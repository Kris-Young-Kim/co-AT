import type { Metadata } from "next"
import { Breadcrumb } from "@/components/common/breadcrumb"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "이메일무단수집거부",
  description: "강원특별자치도 보조기기센터 이메일무단수집거부 안내",
  alternates: { canonical: `${baseUrl}/email-policy` },
}

export default function EmailPolicyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[{ label: "이메일무단수집거부", href: "/email-policy" }]}
        className="mb-6"
      />
      <h1 className="text-responsive-xl font-bold text-foreground mb-8">이메일무단수집거부</h1>

      <div className="max-w-3xl space-y-8">
        <div className="bg-muted/50 rounded-lg p-6 text-sm leading-relaxed text-muted-foreground border">
          <p>
            본 웹 사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를
            이용하여 무단으로 수집되는 것을 거부하며 이를 위반 시 정보통신망법에 의해 형사 처벌됨을
            유념하시기 바랍니다.
          </p>
        </div>

        <section>
          <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b">
            ※ 정보통신망 이용촉진 및 정보보호 등에 관한법률 제50조의 2 (전자우편주소의 무단 수집행위 등 금지)
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">정보통신망법 제 50조의 2 (전자우편주소의 무단 수집행위 등 금지)</span>
            </p>
            <p>
              누구든지 전자우편주소의 수집을 거부하는 의사가 명시된 인터넷 홈페이지에서 자동으로
              전자우편주소를 수집하는 프로그램 그 밖의 기술적 장치를 이용하여 전자우편주소를
              수집하여서는 아니된다.
            </p>
            <p>
              누구든지 제1항의 규정을 위반하여 수집된 전자우편주소를 판매·유통하여서는 아니된다.
            </p>
            <p>
              누구든지 제1항의 및 제2항의 규정에 의하여 수집·판매 및 유통이 금지된
              전자우편주소임을 알고 이를 정보전송에 이용하여서는 아니된다.
            </p>
          </div>
        </section>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5 text-sm text-muted-foreground leading-relaxed">
          <p>
            ※ 만일, 위와 같은 기술적 조치를 사용한 이메일주소 무단수집 피해를 당하신 경우
            불법스팸 대응센터 전용전화(국번없이{" "}
            <span className="font-semibold text-foreground">02-1336</span>)나 홈페이지(
            <span className="font-semibold text-foreground">www.spamcop.or.kr</span>)의 신고 창을
            통하여 신고하기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}
