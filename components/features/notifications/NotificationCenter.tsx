"use client"

import { useState } from "react"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { markNotificationAsRead, markAllNotificationsAsRead, archiveNotification } from "@/actions/notification-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Archive, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
  const { notifications, unreadCount, isLoading, refetch } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId)
    refetch()
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    refetch()
  }

  const handleArchive = async (notificationId: string) => {
    await archiveNotification(notificationId)
    refetch()
  }

  const unreadNotifications = notifications.filter((n) => n.status === "unread")
  const readNotifications = notifications.filter((n) => n.status === "read")

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      case "rental_expiry":
        return "bg-orange-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-96 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">알림</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-8 text-xs"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    모두 읽음
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-sm text-muted-foreground">로딩 중...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-sm text-muted-foreground">알림이 없습니다</div>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.length > 0 && (
                    <>
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onArchive={handleArchive}
                          getTypeColor={getTypeColor}
                        />
                      ))}
                      {readNotifications.length > 0 && (
                        <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                          읽은 알림
                        </div>
                      )}
                    </>
                  )}
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onArchive={handleArchive}
                      getTypeColor={getTypeColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  getTypeColor,
}: {
  notification: {
    id: string
    type: string
    title: string
    body: string
    link: string | null
    status: string
    created_at: string
  }
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  getTypeColor: (type: string) => string
}) {
  const content = (
    <div
      className={cn(
        "flex gap-3 p-4 hover:bg-accent transition-colors",
        notification.status === "unread" && "bg-accent/50"
      )}
    >
      <div className={cn("h-2 w-2 rounded-full mt-2 flex-shrink-0", getTypeColor(notification.type))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.body}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {notification.status === "unread" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(notification.id)
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onArchive(notification.id)
              }}
            >
              <Archive className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={() => onMarkAsRead(notification.id)}>
        {content}
      </Link>
    )
  }

  return content
}
