import { getDashboardData, getIncome } from '@/actions/finance-actions'
import { INCOME_CATEGORY_LABEL } from '@/lib/constants'
import type { FinanceCategoryStats } from '@co-at/types'

function fmt(n: number) { return n.toLocaleString('ko-KR') }

function CategoryRow({ stat, depth = 0 }: { stat: FinanceCategoryStats; depth?: number }) {
  const isRoot = depth === 0
  return (
    <>
      <tr style={{ backgroundColor: isRoot ? '#f3f4f6' : 'white' }}>
        <td style={{ padding: '5px 10px', paddingLeft: `${10 + depth * 16}px`, fontSize: 11, fontWeight: isRoot ? 600 : 400 }}>
          {stat.category.name}
        </td>
        <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(stat.budget)}</td>
        <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(stat.spent)}</td>
        <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11, color: stat.remaining < 0 ? '#dc2626' : 'inherit' }}>
          {fmt(stat.remaining)}
        </td>
        <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{stat.rate}%</td>
      </tr>
      {stat.children?.map(child => <CategoryRow key={child.category.id} stat={child} depth={depth + 1} />)}
    </>
  )
}

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const sp   = await searchParams
  const year = sp.year ? parseInt(sp.year) : new Date().getFullYear()

  const [data, incomeRows] = await Promise.all([
    getDashboardData(year),
    getIncome({ year }),
  ])

  const incomeByCategory = new Map<string, number>()
  let incomeTotal = 0
  for (const row of incomeRows) {
    incomeByCategory.set(row.category, (incomeByCategory.get(row.category) ?? 0) + row.amount)
    incomeTotal += row.amount
  }

  const printDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <style>{`
          @media print {
            @page { margin: 15mm; size: A4 portrait; }
            .no-print { display: none !important; }
            body { padding: 0; }
          }
          * { box-sizing: border-box; }
          body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 24px; color: #111; margin: 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; }
          th { background: #f3f4f6; font-size: 10px; padding: 5px 8px; }
          .section-title { font-size: 13px; font-weight: 600; margin: 16px 0 6px; }
          .total-row { background: #eff6ff; font-weight: 600; }
        `}</style>
      </head>
      <body>
        {/* Print trigger */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            인쇄
          </button>
          <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>Ctrl+P 또는 위 버튼을 눌러 인쇄하세요</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{year}년도 세입·세출 결산서</h1>
          <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>출력일: {printDate}</p>
        </div>

        {/* Summary row */}
        <table style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '25%' }}>세입 합계</th>
              <th style={{ textAlign: 'center', width: '25%' }}>세출 예산액</th>
              <th style={{ textAlign: 'center', width: '25%' }}>세출 집행액</th>
              <th style={{ textAlign: 'center', width: '25%' }}>잔액</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 12 }}>{fmt(incomeTotal)}원</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 12 }}>{fmt(data.totalBudget)}원</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 12 }}>{fmt(data.totalSpent)}원</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{fmt(data.remaining)}원</td>
            </tr>
          </tbody>
        </table>

        {/* 세입 내역 */}
        <p className="section-title">1. 세입 내역</p>
        <table style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '50%' }}>구분</th>
              <th style={{ textAlign: 'right' }}>금액(원)</th>
              <th style={{ textAlign: 'right' }}>비율</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(INCOME_CATEGORY_LABEL).map(([key, label]) => {
              const amt = incomeByCategory.get(key) ?? 0
              const rate = incomeTotal ? Math.round((amt / incomeTotal) * 100) : 0
              return (
                <tr key={key}>
                  <td style={{ padding: '5px 10px', fontSize: 11 }}>{label}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(amt)}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{rate}%</td>
                </tr>
              )
            })}
            <tr className="total-row">
              <td style={{ padding: '5px 10px', fontSize: 11 }}>합계</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(incomeTotal)}</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>100%</td>
            </tr>
          </tbody>
        </table>

        {/* 세출 내역 */}
        <p className="section-title">2. 세출 내역 (예산 대비 집행 현황)</p>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '35%' }}>과목</th>
              <th style={{ textAlign: 'right' }}>예산액(원)</th>
              <th style={{ textAlign: 'right' }}>지출액(원)</th>
              <th style={{ textAlign: 'right' }}>잔액(원)</th>
              <th style={{ textAlign: 'right' }}>집행률</th>
            </tr>
          </thead>
          <tbody>
            {data.categoryStats.map(stat => <CategoryRow key={stat.category.id} stat={stat} />)}
            <tr className="total-row">
              <td style={{ padding: '5px 10px', fontSize: 11 }}>합계</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(data.totalBudget)}</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(data.totalSpent)}</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{fmt(data.remaining)}</td>
              <td style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11 }}>{data.executionRate}%</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <p style={{ marginTop: 24, fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>
          ※ 본 결산서는 시스템에서 자동 생성된 자료입니다.
        </p>
      </body>
    </html>
  )
}
