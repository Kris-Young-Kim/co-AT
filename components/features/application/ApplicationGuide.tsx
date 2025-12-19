"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  TestTube,
  Wrench,
  Heart,
  GraduationCap,
  Phone,
  MapPin,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

const serviceCategories = [
  {
    id: "consult",
    label: "상담 및 정보제공",
    description: "전화, 방문, 센터 방문 상담을 통해 보조기기에 대한 정보와 상담을 제공합니다.",
    icon: MessageSquare,
    details: [
      "콜센터(1670-5529)를 통한 단순 정보제공",
      "센터 방문 상담 및 초기 평가",
      "가정 방문 상담 서비스",
      "전시장 견학 프로그램",
    ],
  },
  {
    id: "experience",
    label: "체험",
    description: "보조기기를 직접 체험하고 대여할 수 있는 서비스입니다.",
    icon: TestTube,
    details: [
      "전시장 내 보조기기 직접 체험",
      "단기 대여 서비스",
      "체험 후 구매 결정 지원",
    ],
  },
  {
    id: "custom",
    label: "맞춤형 지원",
    description: "개인에게 맞는 보조기기를 제작하거나 대여해드립니다.",
    icon: Wrench,
    details: [
      "맞춤 제작 지원 (재료비 10만원 기준)",
      "장기 대여 서비스 (최대 1년, 연장 가능)",
      "장애인보조기기 교부사업 맞춤형 평가지원",
    ],
  },
  {
    id: "aftercare",
    label: "사후관리",
    description: "보조기기의 수리, 소독, 점검 및 재사용 서비스를 제공합니다.",
    icon: Heart,
    details: [
      "점검 및 수리 서비스 (연간 10만원 기준)",
      "소독 및 세척 서비스",
      "재사용 지원 (기증/수거 → 세척/수리 → 재보급)",
    ],
  },
  {
    id: "education",
    label: "교육/홍보",
    description: "보조기기 활용 교육 및 홍보 프로그램을 운영합니다.",
    icon: GraduationCap,
    details: [
      "사용자 교육 프로그램",
      "전문가 교육 및 연수",
      "보조기기 인식 개선 캠페인",
    ],
  },
]

const applicationSteps = [
  {
    step: 1,
    title: "서비스 선택",
    description: "원하시는 서비스 카테고리를 선택해주세요.",
  },
  {
    step: 2,
    title: "신청서 작성",
    description: "필요한 정보를 입력하여 신청서를 작성해주세요.",
  },
  {
    step: 3,
    title: "신청 완료",
    description: "신청이 접수되면 센터에서 연락드립니다.",
  },
]

export function ApplicationGuide() {
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          보조기기 신청 안내
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          강원특별자치도 보조기기센터에서 제공하는 다양한 서비스를 신청하실 수 있습니다.
        </p>
      </div>

      {/* 서비스 안내 */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">제공 서비스</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.id} className="h-full">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{category.label}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* 신청 절차 */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">신청 절차</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {applicationSteps.map((step) => (
            <Card key={step.step}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                    {step.step}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* 안내 사항 */}
      <section>
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              신청 시 안내사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">대상자</p>
                  <p className="text-sm text-muted-foreground">
                    장애인복지법상 장애인, 노인장기요양보험법상 노인, 국가유공자 등
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">대여 기간</p>
                  <p className="text-sm text-muted-foreground">
                    1인 연간 3종 이하, 최대 1년 (연장 1회/2회 가능)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">지원 한도</p>
                  <p className="text-sm text-muted-foreground">
                    맞춤 제작: 재료비 10만원 기준, 초과 시 자부담<br />
                    수리: 연간 10만원 기준
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">책임 사항</p>
                  <p className="text-sm text-muted-foreground">
                    대여 중 파손 또는 분실 시 사용자 책임
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 문의처 */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              문의처
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">콜센터</p>
                  <p className="text-lg font-semibold text-primary">1670-5529</p>
                  <p className="text-sm text-muted-foreground">
                    보조기기 관련 정보 제공 및 상담
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">센터 위치</p>
                  <p className="text-sm text-muted-foreground">
                    강원특별자치도 보조기기센터
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">운영 시간</p>
                  <p className="text-sm text-muted-foreground">
                    평일 09:00 ~ 18:00 (주 5일 근무)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 신청하기 버튼 */}
      <div className="flex justify-center pt-4">
        <Button size="lg" className="text-lg px-8" asChild>
          <Link href="/portal/apply/wizard">
            <span>신청하기</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

