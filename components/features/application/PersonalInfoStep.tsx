"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useApplicationStore, type PersonalInfo } from "@/lib/stores/application-store"

const DISABILITY_OPTIONS = [
  { value: "physical", label: "지체" },
  { value: "brain_lesion", label: "뇌병변" },
  { value: "visual", label: "시각" },
  { value: "hearing", label: "청각" },
  { value: "language", label: "언어" },
  { value: "intellectual", label: "지적" },
  { value: "autism", label: "자폐성" },
  { value: "mental", label: "정신" },
  { value: "kidney", label: "신장" },
  { value: "cardiac", label: "심장" },
  { value: "respiratory", label: "호흡기" },
  { value: "liver", label: "간" },
  { value: "face", label: "안면" },
  { value: "intestine", label: "장루·요루" },
  { value: "epilepsy", label: "뇌전증" },
]

const INPUT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
const SELECT = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

export function PersonalInfoStep() {
  const { user } = useUser()
  const { setCurrentStep, setPersonalInfo } = useApplicationStore()

  const meta = (user?.publicMetadata ?? {}) as { birth_date?: string; name?: string }
  const clerkName =
    meta.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    ""
  const clerkBirthDate = meta.birth_date ?? ""

  const [form, setForm] = useState<PersonalInfo>({
    name: clerkName,
    birth_date: clerkBirthDate || null,
    gender: null,
    contact: null,
    disability_type: null,
    disability_grade: null,
    economic_status: null,
  })
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value || null }))
  }

  function handleNext() {
    if (!form.name.trim()) {
      setError("이름은 필수 입력 항목입니다")
      return
    }
    setPersonalInfo({ ...form, name: form.name.trim() })
    setCurrentStep(3)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">본인 정보 입력</h3>
        <p className="text-sm text-muted-foreground">
          서비스 지원을 위한 기본 정보를 입력해 주세요. 필수 항목(*)을 제외하고는 나중에 담당자가 확인합니다.
        </p>
      </div>

      {/* 기본 정보 */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-1">기본 정보</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className={INPUT}
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label>
            <input
              name="birth_date"
              type="date"
              value={form.birth_date ?? ""}
              onChange={handleChange}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
            <select name="gender" value={form.gender ?? ""} onChange={handleChange} className={SELECT}>
              <option value="">선택</option>
              <option value="male">남</option>
              <option value="female">여</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              name="contact"
              type="tel"
              value={form.contact ?? ""}
              onChange={handleChange}
              className={INPUT}
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">경제상황</label>
            <select
              name="economic_status"
              value={form.economic_status ?? ""}
              onChange={handleChange}
              className={SELECT}
            >
              <option value="">선택</option>
              <option value="기초생활수급">기초생활수급</option>
              <option value="차상위">차상위</option>
              <option value="일반">일반</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* 장애 정보 */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="text-sm font-semibold text-gray-700 px-1">장애 정보</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">장애유형</label>
            <select
              name="disability_type"
              value={form.disability_type ?? ""}
              onChange={handleChange}
              className={SELECT}
            >
              <option value="">선택</option>
              {DISABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">장애정도</label>
            <select
              name="disability_grade"
              value={form.disability_grade ?? ""}
              onChange={handleChange}
              className={SELECT}
            >
              <option value="">선택</option>
              <option value="심한">심한</option>
              <option value="심하지 않은">심하지 않은</option>
            </select>
          </div>
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
          이전
        </Button>
        <Button onClick={handleNext} className="flex-1">
          다음
        </Button>
      </div>
    </div>
  )
}
