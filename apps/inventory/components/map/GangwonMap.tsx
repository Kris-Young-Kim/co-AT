'use client'

import { useState, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import type { CityRentalStat } from '@/inventory/actions/map-actions'
import { getRentalsByCity } from '@/inventory/actions/map-actions'
import { RotateCw } from 'lucide-react'

const GEO_URL = '/gangwon.geojson'

const COLOR_SCALE = ['#dde8f0', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8']

function getColor(total: number, max: number): string {
  if (total === 0) return COLOR_SCALE[0]
  const idx = Math.min(Math.ceil((total / max) * (COLOR_SCALE.length - 1)), COLOR_SCALE.length - 1)
  return COLOR_SCALE[idx]
}

interface TooltipState {
  x: number
  y: number
  city: string
}

interface GangwonMapProps {
  initialData: CityRentalStat[]
}

export function GangwonMap({ initialData }: GangwonMapProps) {
  const [data, setData] = useState<CityRentalStat[]>(initialData)
  const [selected, setSelected] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const cityMap = new Map(data.map(d => [d.city, d]))
  const maxTotal = Math.max(...data.map(d => d.total), 1)
  const activeList = data.filter(d => d.total > 0)
  const selectedStat = selected ? cityMap.get(selected) : null

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    const fresh = await getRentalsByCity()
    setData(fresh)
    setRefreshing(false)
  }, [])

  const handleGeoClick = useCallback((name: string) => {
    setSelected(prev => (prev === name ? null : name))
  }, [])

  return (
    <div className="flex gap-6">
      {/* Map canvas */}
      <div className="relative flex-1 min-w-0 bg-sky-50 rounded-xl border overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [128.2, 37.85], scale: 18000 }}
          width={700}
          height={550}
          className="w-full h-auto"
        >
          <ZoomableGroup zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const name: string = geo.properties.name
                  const stat = cityMap.get(name)
                  const isSelected = selected === name
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelected ? '#f59e0b' : getColor(stat?.total ?? 0, maxTotal)}
                      stroke="#94a3b8"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', opacity: 0.75, cursor: 'pointer' },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => handleGeoClick(name)}
                      onMouseMove={(e: React.MouseEvent) =>
                        setTooltip({ x: e.clientX, y: e.clientY, city: name })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip (portal-free fixed) */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-md px-2.5 py-2 pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          <p className="font-semibold">{tooltip.city}</p>
          {(() => {
            const s = cityMap.get(tooltip.city)
            return (
              <p className="text-gray-300 mt-0.5">
                대여중 {s?.rented ?? 0} · 연체 {s?.overdue ?? 0}
              </p>
            )
          })()}
        </div>
      )}

      {/* Sidebar */}
      <div className="w-60 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">시군별 활성 대여</p>
            <p className="text-xs text-gray-400">대여중 + 연체</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="새로고침"
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"
          >
            <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Color legend */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400">대여 건수</p>
          <div className="flex items-center gap-1.5">
            {COLOR_SCALE.map((c, i) => (
              <div
                key={c}
                className="h-3 flex-1 rounded-sm"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0건</span>
            <span>{maxTotal}건</span>
          </div>
        </div>

        {/* Selected city */}
        {selectedStat ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm text-amber-900">{selectedStat.city}</p>
              <button
                onClick={() => setSelected(null)}
                className="text-amber-400 hover:text-amber-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">대여중</span>
                <span className="font-medium text-blue-700">{selectedStat.rented}건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">연체</span>
                <span className={`font-medium ${selectedStat.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {selectedStat.overdue}건
                </span>
              </div>
              <div className="flex justify-between border-t border-amber-100 pt-1.5">
                <span className="font-medium text-gray-700">합계</span>
                <span className="font-bold">{selectedStat.total}건</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">시군을 클릭하면 상세 정보를 볼 수 있습니다.</p>
        )}

        {/* Rankings */}
        <div className="space-y-0.5">
          {activeList.map((stat, i) => (
            <button
              key={stat.city}
              onClick={() => handleGeoClick(stat.city)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                selected === stat.city
                  ? 'bg-amber-100 text-amber-800'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="w-4 text-center text-xs text-gray-400">{i + 1}</span>
              <span className="flex-1 text-left">{stat.city}</span>
              <span className="font-medium text-blue-600 text-xs">{stat.total}</span>
              {stat.overdue > 0 && (
                <span className="text-xs text-red-500">{stat.overdue}↑</span>
              )}
            </button>
          ))}
          {activeList.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">현재 활성 대여 없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
