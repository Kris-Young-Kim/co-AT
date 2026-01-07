"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getDashboardStats,
  getNewApplications,
  getTodaySchedules,
  type DashboardStats,
  type NewApplication,
  type TodaySchedule,
} from "@/actions/dashboard-actions"

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const result = await getDashboardStats()
      if (!result.success || !result.stats) {
        throw new Error(result.error || "대시보드 통계 조회에 실패했습니다")
      }
      return result.stats
    },
    refetchInterval: 30000, // 30초마다 자동 갱신 (실시간 KPI 모니터링)
  })
}

export function useNewApplications(limit: number = 10) {
  return useQuery<NewApplication[]>({
    queryKey: ["dashboard", "new-applications", limit],
    queryFn: async () => {
      const result = await getNewApplications(limit)
      if (!result.success || !result.applications) {
        throw new Error(result.error || "신규 접수 조회에 실패했습니다")
      }
      return result.applications
    },
    refetchInterval: 30000, // 30초마다 자동 갱신 (실시간 KPI 모니터링)
  })
}

export function useTodaySchedules() {
  return useQuery<TodaySchedule[]>({
    queryKey: ["dashboard", "today-schedules"],
    queryFn: async () => {
      const result = await getTodaySchedules()
      if (!result.success || !result.schedules) {
        throw new Error(result.error || "오늘의 일정 조회에 실패했습니다")
      }
      return result.schedules
    },
    refetchInterval: 30000, // 30초마다 자동 갱신 (실시간 KPI 모니터링)
  })
}

