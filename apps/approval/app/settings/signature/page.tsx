'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { upsertSignature, getSignature } from '@/actions/approval-actions'
import { createClient } from '@supabase/supabase-js'

function createBrowserSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function SignaturePage() {
  const { user } = useUser()
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    getSignature(user.id).then(sig => {
      if (sig) setCurrentUrl(sig.image_url)
    })
  }, [user?.id])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setUploading(true)
    setMessage(null)

    const supabase = createBrowserSupabase()
    const path = `${user.id}/signature.png`

    const { error: uploadError } = await supabase.storage
      .from('approval-signatures')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setMessage('업로드 실패: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('approval-signatures')
      .getPublicUrl(path)

    const result = await upsertSignature(user.id, publicUrl)
    if (result) {
      setCurrentUrl(publicUrl)
      setMessage('서명 이미지가 저장되었습니다.')
    } else {
      setMessage('저장 실패. 다시 시도해주세요.')
    }
    setUploading(false)
  }

  return (
    <div className="p-8 space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">서명 이미지 등록</h1>
      <p className="text-sm text-gray-500">
        결재 시 도장처럼 사용될 서명 이미지를 등록합니다. PNG 또는 JPG, 최대 2MB.
      </p>

      {currentUrl && (
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm font-medium text-gray-700 mb-2">현재 등록된 서명</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="서명 이미지" className="h-24 object-contain border rounded" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          서명 이미지 {currentUrl ? '교체' : '등록'}
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
      </div>

      {uploading && <p className="text-sm text-blue-600">업로드 중...</p>}
      {message && (
        <p className={`text-sm ${message.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
