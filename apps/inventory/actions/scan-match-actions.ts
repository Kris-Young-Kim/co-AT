"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { createRentalContract } from '@/actions/rental-contract-actions'
import { addMonths, format } from 'date-fns'

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
