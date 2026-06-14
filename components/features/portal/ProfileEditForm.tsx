'use client'

import { useState, useTransition } from 'react'
import { updateMyProfile, type MyProfile, type UpdateMyProfileInput } from '@/actions/portal-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Pencil } from 'lucide-react'

interface ProfileEditFormProps {
  profile: MyProfile
}

const HOUSING_TYPES = ['아파트', '단독주택', '다세대주택', '연립주택', '기타']
const GUARDIAN_RELATIONSHIPS = ['부', '모', '배우자', '자녀', '형제자매', '기타']

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<UpdateMyProfileInput>({
    contact: profile.contact ?? '',
    email: profile.email ?? '',
    address: profile.address ?? '',
    guardian_name: profile.guardian_name ?? '',
    guardian_contact: profile.guardian_contact ?? '',
    guardian_relationship: profile.guardian_relationship ?? '',
    housing_type: profile.housing_type ?? '',
    floor_number: profile.floor_number ?? '',
    has_elevator: profile.has_elevator ?? null,
  })

  const set = (key: keyof UpdateMyProfileInput, value: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    setError('')
    startTransition(async () => {
      const result = await updateMyProfile({
        contact: form.contact || null,
        email: form.email || null,
        address: form.address || null,
        guardian_name: form.guardian_name || null,
        guardian_contact: form.guardian_contact || null,
        guardian_relationship: form.guardian_relationship || null,
        housing_type: form.housing_type || null,
        floor_number: form.floor_number || null,
        has_elevator: form.has_elevator,
      })
      if (result.success) {
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? '저장에 실패했습니다')
      }
    })
  }

  const field = (label: string, value: string | null) => (
    <div className="py-2.5 border-b last:border-0">
      <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl">
      {/* 읽기 전용: 기본 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">기본 정보</CardTitle>
          <p className="text-xs text-muted-foreground">담당자만 수정할 수 있습니다</p>
        </CardHeader>
        <CardContent>
          <dl>
            {field('이름', profile.name)}
            {field('생년월일', profile.birth_date)}
            {field('장애유형', profile.disability_type)}
            {field('장애등급', profile.disability_grade ? `${profile.disability_grade}급` : null)}
            {field('등록번호', profile.registration_number)}
          </dl>
        </CardContent>
      </Card>

      {/* 수정 가능: 연락처 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">연락처 · 주소</CardTitle>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                수정
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="contact">연락처</Label>
                <Input id="contact" value={form.contact ?? ''} onChange={(e) => set('contact', e.target.value)} placeholder="010-0000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="example@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">주소</Label>
                <Input id="address" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="주소를 입력하세요" />
              </div>
            </>
          ) : (
            <dl>
              {field('연락처', profile.contact)}
              {field('이메일', profile.email)}
              {field('주소', profile.address)}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* 수정 가능: 보호자 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">보호자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="guardian_name">보호자 이름</Label>
                <Input id="guardian_name" value={form.guardian_name ?? ''} onChange={(e) => set('guardian_name', e.target.value)} placeholder="이름" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guardian_contact">보호자 연락처</Label>
                <Input id="guardian_contact" value={form.guardian_contact ?? ''} onChange={(e) => set('guardian_contact', e.target.value)} placeholder="010-0000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guardian_relationship">관계</Label>
                <select
                  id="guardian_relationship"
                  value={form.guardian_relationship ?? ''}
                  onChange={(e) => set('guardian_relationship', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">선택</option>
                  {GUARDIAN_RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          ) : (
            <dl>
              {field('보호자 이름', profile.guardian_name)}
              {field('보호자 연락처', profile.guardian_contact)}
              {field('관계', profile.guardian_relationship)}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* 수정 가능: 주거환경 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">주거환경</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="housing_type">주거형태</Label>
                <select
                  id="housing_type"
                  value={form.housing_type ?? ''}
                  onChange={(e) => set('housing_type', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">선택</option>
                  {HOUSING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floor_number">층수</Label>
                <Input id="floor_number" value={form.floor_number ?? ''} onChange={(e) => set('floor_number', e.target.value)} placeholder="예: 3" />
              </div>
              <div className="space-y-1.5">
                <Label>엘리베이터</Label>
                <div className="flex gap-4">
                  {[{ label: '있음', value: true }, { label: '없음', value: false }].map(({ label, value }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="has_elevator"
                        checked={form.has_elevator === value}
                        onChange={() => set('has_elevator', value)}
                        className="accent-primary"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <dl>
              {field('주거형태', profile.housing_type)}
              {field('층수', profile.floor_number)}
              {field('엘리베이터', profile.has_elevator === true ? '있음' : profile.has_elevator === false ? '없음' : null)}
            </dl>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">{error}</div>
      )}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-4 w-4" />
          저장되었습니다
        </div>
      )}

      {editing && (
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
          <Button variant="outline" onClick={() => { setEditing(false); setError('') }}>
            취소
          </Button>
        </div>
      )}
    </div>
  )
}
