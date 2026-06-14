"use server"

import { createAdminClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { Resend } from 'resend'

// relative import — web-local component not reachable via @/* monorepo alias
import { RentalContractPdf } from '../components/sign/RentalContractPdf'

export async function submitSignature({
  signingToken,
  signerName,
  signerType,
  signatureData,
}: {
  signingToken: string
  signerName: string
  signerType: 'client' | 'guardian'
  signatureData: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: contract, error: contractError } = await (supabase as any)
      .from('rental_contracts')
      .select('*')
      .eq('signing_token', signingToken)
      .single()

    if (contractError || !contract) return { success: false, error: '계약서를 찾을 수 없습니다' }
    if (contract.status !== 'pending') return { success: false, error: '이미 처리된 계약서입니다' }

    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, rental_start_date, rental_end_date, client_id, inventory_id')
      .eq('id', contract.rental_id)
      .single()

    if (rentalError || !rental) return { success: false, error: '대여 정보를 찾을 수 없습니다' }

    const [{ data: clientData }, { data: inventoryData }] = await Promise.all([
      supabase.from('clients').select('name').eq('id', rental.client_id ?? '').single(),
      supabase.from('inventory').select('name, model').eq('id', rental.inventory_id ?? '').single(),
    ])

    const now = new Date().toISOString()

    const { error: updateError } = await (supabase as any)
      .from('rental_contracts')
      .update({
        status: 'signed',
        signer_name: signerName,
        signer_type: signerType,
        signature_data: signatureData,
        signed_at: now,
      })
      .eq('signing_token', signingToken)

    if (updateError) return { success: false, error: updateError.message }

    // Generate PDF and email if delivery method is email
    if (contract.sent_via === 'email' && contract.sent_to) {
      try {
        const clientName = (clientData as any)?.name ?? ''
        const deviceName = (inventoryData as any)?.name ?? ''
        const deviceModel = (inventoryData as any)?.model ?? null

        const pdfBuffer = await renderToBuffer(
          createElement(RentalContractPdf, {
            rentalId: rental.id,
            clientName,
            deviceName,
            deviceModel,
            rentalStartDate: rental.rental_start_date,
            rentalEndDate: rental.rental_end_date,
            signerName,
            signerType,
            signatureData,
            signedAt: now,
          }) as any
        )

        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: '가치함께 <noreply@gwatc.cloud>',
          to: contract.sent_to,
          subject: '[가치함께] 보조기기 대여 계약서',
          html: `
            <p>안녕하세요, <strong>${clientName}</strong>님.</p>
            <p>보조기기 대여 계약서에 서명해 주셔서 감사합니다.</p>
            <p>서명된 계약서를 첨부 파일로 보내드립니다.</p>
            <p>감사합니다.<br/>(사)가치함께자립생활센터</p>
          `,
          attachments: [
            {
              filename: `대여계약서_${clientName}.pdf`,
              content: Buffer.from(pdfBuffer).toString('base64'),
            },
          ],
        })
      } catch {
        // PDF/email failure is non-fatal — signature is already saved
      }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getSigningPageData(signingToken: string): Promise<{
  success: boolean
  error?: string
  contract?: {
    id: string
    status: string
    signed_at: string | null
    signer_name: string | null
  }
  rental?: {
    id: string
    rental_start_date: string
    rental_end_date: string
    client_name: string
    device_name: string
    device_model: string | null
  }
}> {
  try {
    const supabase = createAdminClient()

    const { data: contract, error: contractError } = await (supabase as any)
      .from('rental_contracts')
      .select('id, status, signed_at, signer_name, rental_id')
      .eq('signing_token', signingToken)
      .single()

    if (contractError || !contract) return { success: false, error: '계약서를 찾을 수 없습니다' }

    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .select('id, rental_start_date, rental_end_date, client_id, inventory_id')
      .eq('id', contract.rental_id)
      .single()

    if (rentalError || !rental) return { success: false, error: '대여 정보를 찾을 수 없습니다' }

    const [{ data: clientData }, { data: inventoryData }] = await Promise.all([
      supabase.from('clients').select('name').eq('id', rental.client_id ?? '').single(),
      supabase.from('inventory').select('name, model').eq('id', rental.inventory_id ?? '').single(),
    ])

    return {
      success: true,
      contract: {
        id: contract.id,
        status: contract.status,
        signed_at: contract.signed_at,
        signer_name: contract.signer_name,
      },
      rental: {
        id: rental.id,
        rental_start_date: rental.rental_start_date,
        rental_end_date: rental.rental_end_date,
        client_name: (clientData as any)?.name ?? '',
        device_name: (inventoryData as any)?.name ?? '',
        device_model: (inventoryData as any)?.model ?? null,
      },
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
