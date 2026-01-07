/**
 * 실시간 알림 구독 훅
 * Supabase Realtime을 사용하여 알림을 실시간으로 수신
 */

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getNotifications, type Notification } from "@/actions/notification-actions"

export function useNotifications() {
  const queryClient = useQueryClient()
  const [supabase] = useState(() => createClient())

  // 알림 목록 조회
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await getNotifications({ limit: 50 })
      if (!result.success) {
        throw new Error(result.error || "알림 조회 실패")
      }
      return result
    },
    refetchInterval: 30000, // 30초마다 자동 갱신
  })

  // Realtime 구독
  useEffect(() => {
    console.log("[useNotifications] Realtime 구독 시작")

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("[useNotifications] 새 알림 수신:", payload.new)
          
          // 쿼리 캐시 업데이트
          queryClient.setQueryData<{
            success: boolean
            notifications?: Notification[]
            total?: number
            unreadCount?: number
          }>(["notifications"], (old) => {
            if (!old) return old

            const newNotification = payload.new as Notification
            
            // 만료된 알림은 제외
            if (newNotification.expires_at && new Date(newNotification.expires_at) < new Date()) {
              return old
            }

            // 이미 존재하는 알림은 제외
            if (old.notifications?.some((n) => n.id === newNotification.id)) {
              return old
            }

            // 브라우저 알림 (선택사항)
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(newNotification.title || "", {
                body: newNotification.body || "",
                icon: "/favicon.ico",
                tag: newNotification.id || "",
              })
            }

            return {
              ...old,
              notifications: [newNotification, ...(old.notifications || [])],
              total: (old.total || 0) + 1,
              unreadCount: (old.unreadCount || 0) + 1,
            }
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("[useNotifications] 알림 업데이트:", payload.new)
          
          // 쿼리 캐시 업데이트
          queryClient.setQueryData<{
            success: boolean
            notifications?: Notification[]
            total?: number
            unreadCount?: number
          }>(["notifications"], (old) => {
            if (!old) return old

            const updatedNotification = payload.new as Notification

            return {
              ...old,
              notifications: old.notifications?.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              ),
              unreadCount:
                updatedNotification.status === "read"
                  ? Math.max(0, (old.unreadCount || 0) - 1)
                  : old.unreadCount,
            }
          })
        }
      )
      .subscribe((status) => {
        console.log("[useNotifications] 구독 상태:", status)
      })

    return () => {
      console.log("[useNotifications] Realtime 구독 해제")
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("[useNotifications] 브라우저 알림 권한:", permission)
      })
    }
  }, [])

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
  }
}
