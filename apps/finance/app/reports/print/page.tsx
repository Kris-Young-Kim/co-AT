import { getDashboardData, getCategories, getBudgets } from '@/actions/finance-actions'
import type { FinanceCategoryStats } from '@co-at/types'

function fmt(n: number) { return n.toLocaleString('ko-KR') }

function CategoryRow({ stat, depth = 0 }: { stat: FinanceCategoryStats; depth?: number }) {
  return (
    <>
      <tr style={{ backgroundColor: depth === 0 ? '#f9fafb' : 'white' }}>
        <td style={{ padding: '6px 12px', paddingLeft: `${12 + depth * 16}px`, fontSize: 12, fontWeight: depth === 0 ? 600 : 400 }}>
          {stat.category.name}
        </td>
        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12 }}>{fmt(stat.budget)}</td>
        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12 }}>{fmt(stat.spent)}</td>
        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12 }}>{fmt(stat.remaining)}</td>
        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12 }}>{stat.rate}%</td>
      </tr>
      {stat.children?.map(child => (
        <CategoryRow key={child.category.id} stat={child} depth={depth + 1} />
      ))}
    </>
  )
}

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const sp   = await searchParams
  const year = sp.year ? parseInt(sp.year) : new Date().getFullYear()
  const data = await getDashboardData(year)

  return (
    <html lang="ko">
      <head>
        <style>{`
          @media print {
            @page { margin: 20mm; }
            .no-print { display: none !important; }
          }
          body { font-family: 'Malgun Gothic', sans-serif; padding: 32px; color: #111; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; }
          th { background: #f3f4f6; font-size: 11px; }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ marginBottom: 24 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            인쇄
          </button>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
          {year}년도 예산·지출 결산 보고서
        </h1>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 24 }}>
          출력일: {new Date().toLocaleDateString('ko-KR')}
        </p>

        {/* Summary */}
        <table style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>연간 총예산</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>총지출</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>잔액</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>집행률</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13 }}>{fmt(data.totalBudget)}원</td>
              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13 }}>{fmt(data.totalSpent)}원</td>
              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13 }}>{fmt(data.remaining)}원</td>
              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{data.executionRate}%</td>
            </tr>
          </tbody>
        </table>

        {/* Category breakdown */}
        <table>
          <thead>
            <tr>
              {['카테고리', '예산(원)', '지출(원)', '잔액(원)', '집행률'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: h === '카테고리' ? 'left' : 'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categoryStats.map(stat => (
              <CategoryRow key={stat.category.id} stat={stat} />
            ))}
          </tbody>
        </table>
      </body>
    </html>
  )
}
