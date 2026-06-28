"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { createRentalContract } from '@/actions/rental-contract-actions'
import { addMonths, format } from 'date-fns'

export interface ActiveRentalInfo {
  rentalId: string
  clientName: string
  rentalStartDate: string
  deviceName: string
  deviceModel: string | null
}

export interface ScanMatchClient {
  id: string
  name: string
  birth_date: string | null
  disability_type: string | null
}

export interface ScanMatchDevice {
  id: string
  name: string
  model: string | null
  status: string
  is_rental_available: boolean
}

function extractQrToken(value: string): string {
  // URL format: https://inventory.gwatc.cloud/scan/{qr_token}
  const match = value.match(/\/scan\/([0-9a-f-]{36})/i)
  return match ? match[1] : value.trim()
}

export async function getClientByQrTokenForScan(qrToken: string): Promise<{
  success: boolean
  client?: ScanMatchClient
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, birth_date, disability_type')
      .eq('qr_token' as any, qrToken)
      .single()

    if (error || !data) return { success: false, error: '대상자 QR을 찾을 수 없습니다' }
    return { success: true, client: data as ScanMatchClient }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}

export async function getInventoryByQrOrBarcode(value: string): Promise<{
  success: boolean
  device?: ScanMatchDevice
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const token = extractQrToken(value)

    // Try qr_token first
    const { data: byQr } = await supabase
      .from('inventory')
      .select('id, name, model, status, is_rental_available')
      .eq('qr_token', token)
      .single()

    // Fallback: barcode field
    const { data: byBarcode } = byQr
      ? { data: null }
      : await supabase
          .from('inventory')
          .select('id, name, model, status, is_rental_available')
          .eq('barcode', value.trim())
          .single()

    const device = (byQr ?? byBarcode) as ScanMatchDevice | null
    if (!device) return { success: false, error: '기기 QR/바코드를 찾을 수 없습니다' }

    if (device.status !== '보관' || !device.is_rental_available) {
      return { success: false, error: `기기를 대여할 수 없습니다 (현재 상태: ${device.status})` }
    }

    return { success: true, device }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}

export async function getActiveRentalByDeviceQr(value: string): Promise<{
  success: boolean
  info?: ActiveRentalInfo
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const token = extractQrToken(value)

    // Find device by QR token or barcode
    const { data: byQr } = await supabase
      .from('inventory')
      .select('id, name, model, status')
      .eq('qr_token', token)
      .single()

    const { data: byBarcode } = byQr
      ? { data: null }
      : await supabase
          .from('inventory')
          .select('id, name, model, status')
          .eq('barcode', value.trim())
          .single()

    const device = (byQr ?? byBarcode) as { id: string; name: string; model: string | null; status: string } | null
    if (!device) return { success: false, error: '기기 QR/바코드를 찾을 수 없습니다' }

    // Find active rental for this device
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, rental_start_date, client_id')
      .eq('inventory_id', device.id)
      .in('status', ['rented', 'overdue'])
      .order('rental_start_date', { ascending: false })
      .limit(1)
      .single()

    if (rentalError || !rental) {
      return { success: false, error: `현재 대여 중인 기기가 아닙니다 (상태: ${device.status})` }
    }

    const rentalTyped = rental as { id: string; rental_start_date: string; client_id: string }

    // Get client name
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', rentalTyped.client_id)
      .single()

    const clientName = (client as { name: string } | null)?.name ?? '알 수 없음'

    return {
      success: true,
      info: {
        rentalId: rentalTyped.id,
        clientName,
        rentalStartDate: rentalTyped.rental_start_date,
        deviceName: device.name,
        deviceModel: device.model,
      },
    }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}

export async function createRentalFromScan(
  clientId: string,
  inventoryId: string,
): Promise<{ success: boolean; rentalId?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const today = new Date()
    const endDate = addMonths(today, 1)

    const { data, error } = await supabase
      .from('rentals')
      .insert({
        client_id: clientId,
        inventory_id: inventoryId,
        rental_start_date: format(today, 'yyyy-MM-dd'),
        rental_end_date: format(endDate, 'yyyy-MM-dd'),
        status: 'rented',
        extension_count: 0,
      })
      .select('id')
      .single()

    if (error || !data) {
      return { success: false, error: '대여 생성에 실패했습니다: ' + (error?.message ?? '') }
    }

    await supabase
      .from('inventory')
      .update({ status: '대여중' })
      .eq('id', inventoryId)

    const rentalId = (data as { id: string }).id

    // Auto-create contract for e-signature
    await createRentalContract(rentalId)

    return { success: true, rentalId }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}

export interface DeviceLookupResult {
  id: string
  name: string
  model: string | null
  status: string
  is_rental_available: boolean
  qr_token: string | null
  barcode: string | null
  asset_code: string | null
  category: string | null
  activeRental: {
    rentalId: string
    clientName: string
    rentalStartDate: string
  } | null
}

export async function getDeviceByScanValue(value: string): Promise<{
  success: boolean
  device?: DeviceLookupResult
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const supabase = createAdminClient()
    const token = extractQrToken(value)

    const { data: byQr } = await supabase
      .from('inventory')
      .select('id, name, model, status, is_rental_available, qr_token, barcode, asset_code, category')
      .eq('qr_token', token)
      .single()

    const { data: byBarcode } = byQr
      ? { data: null }
      : await supabase
          .from('inventory')
          .select('id, name, model, status, is_rental_available, qr_token, barcode, asset_code, category')
          .eq('barcode', value.trim())
          .single()

    const raw = (byQr ?? byBarcode) as Omit<DeviceLookupResult, 'activeRental'> | null
    if (!raw) return { success: false, error: '기기 QR/바코드를 찾을 수 없습니다' }

    const { data: rental } = await supabase
      .from('rentals')
      .select('id, rental_start_date, client_id')
      .eq('inventory_id', raw.id)
      .in('status', ['rented', 'overdue'])
      .order('rental_start_date', { ascending: false })
      .limit(1)
      .single()

    let activeRental: DeviceLookupResult['activeRental'] = null
    if (rental) {
      const r = rental as { id: string; rental_start_date: string; client_id: string }
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', r.client_id)
        .single()
      activeRental = {
        rentalId: r.id,
        clientName: (client as { name: string } | null)?.name ?? '알 수 없음',
        rentalStartDate: r.rental_start_date,
      }
    }

    return { success: true, device: { ...raw, activeRental } }
  } catch {
    return { success: false, error: '오류가 발생했습니다' }
  }
}
