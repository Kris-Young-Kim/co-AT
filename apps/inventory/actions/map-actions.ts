'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface CityRentalStat {
  city: string
  rented: number
  overdue: number
  total: number
}

export async function getRentalsByCity(): Promise<CityRentalStat[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('rentals')
    .select('status, clients(city)')
    .in('status', ['rented', 'overdue'])

  if (error || !data) return []

  const map = new Map<string, CityRentalStat>()

  for (const row of data) {
    const city = (row.clients as { city?: string } | null)?.city
    if (!city) continue

    const existing = map.get(city) ?? { city, rented: 0, overdue: 0, total: 0 }
    if (row.status === 'rented') existing.rented++
    if (row.status === 'overdue') existing.overdue++
    existing.total++
    map.set(city, existing)
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}
