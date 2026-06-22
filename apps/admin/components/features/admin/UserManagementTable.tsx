'use client'

import { useEffect, useState } from 'react'
import { APP_KEYS, ROLES, type AppKey, type UserRole } from '@co-at/types'

const APP_LABELS: Record<AppKey, string> = {
  eval:       '평가',
  inventory:  '재고',
  stats:      '통계',
  automation: '자동화',
  hr:         '인사',
  approval:   '결재',
  finance:    '재무',
}

const ROLE_LABELS: Record<string, string> = {
  admin:   'Admin',
  manager: 'Manager',
  staff:   'Staff',
  user:    'User',
}

const ALL_APP_KEYS = Object.values(APP_KEYS) as AppKey[]

interface User {
  id: string
  clerk_user_id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface UserPermissions {
  role: UserRole
  apps: AppKey[]
}

interface EditState {
  role: UserRole
  apps: AppKey[]
}

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Record<string, UserPermissions>>({})
  const [editing, setEditing] = useState<Record<string, EditState>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        if (d.success) setUsers(d.users)
        else setError(d.error)
      })
      .catch(() => setError('사용자 목록을 불러오지 못했습니다'))
      .finally(() => setLoading(false))
  }, [])

  async function loadPermissions(userId: string) {
    if (permissions[userId]) return
    const res = await fetch(`/api/admin/users/${userId}/permissions`)
    const d = await res.json()
    if (res.ok) {
      setPermissions(prev => ({ ...prev, [userId]: d }))
    }
  }

  function startEdit(userId: string) {
    const p = permissions[userId]
    setEditing(prev => ({
      ...prev,
      [userId]: {
        role: (p?.role ?? 'staff') as UserRole,
        apps: p?.apps ?? ALL_APP_KEYS,
      },
    }))
  }

  function cancelEdit(userId: string) {
    setEditing(prev => { const n = { ...prev }; delete n[userId]; return n })
  }

  function toggleApp(userId: string, appKey: AppKey) {
    setEditing(prev => {
      const cur = prev[userId]
      if (!cur) return prev
      const has = cur.apps.includes(appKey)
      return {
        ...prev,
        [userId]: {
          ...cur,
          apps: has ? cur.apps.filter(a => a !== appKey) : [...cur.apps, appKey],
        },
      }
    })
  }

  async function savePermissions(userId: string) {
    const state = editing[userId]
    if (!state) return
    setSaving(prev => ({ ...prev, [userId]: true }))
    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: state.role, apps: state.apps }),
      })
      const d = await res.json()
      if (res.ok && d.success) {
        setPermissions(prev => ({ ...prev, [userId]: { role: state.role, apps: state.apps } }))
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: state.role } : u))
        cancelEdit(userId)
      } else {
        alert(d.error ?? '저장 실패')
      }
    } catch {
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }))
    }
  }

  if (loading) return <p className="text-muted-foreground">불러오는 중...</p>
  if (error) return <p className="text-destructive">{error}</p>
  if (users.length === 0) return <p className="text-muted-foreground">사용자가 없습니다</p>

  return (
    <div className="space-y-3">
      {users.map(user => {
        const isEditing = !!editing[user.id]
        const perm = permissions[user.id]
        const edit = editing[user.id]
        const isSaving = saving[user.id]

        return (
          <div key={user.id} className="rounded-lg border bg-card p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium truncate">{user.full_name ?? user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                {!isEditing && (
                  <button
                    onClick={() => { loadPermissions(user.id); startEdit(user.id) }}
                    className="text-xs px-3 py-1 rounded-md border hover:bg-accent transition-colors"
                  >
                    편집
                  </button>
                )}
              </div>
            </div>

            {/* Edit panel */}
            {isEditing && edit && (
              <div className="space-y-3 pt-2 border-t">
                {/* Role selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium w-12 shrink-0">역할</span>
                  {(['staff', 'manager', 'admin'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setEditing(prev => ({ ...prev, [user.id]: { ...prev[user.id]!, role: r } }))}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        edit.role === r
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>

                {/* App access (only relevant for non-admin) */}
                {edit.role !== ROLES.ADMIN && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-sm font-medium w-12 shrink-0 pt-0.5">앱</span>
                    <div className="flex flex-wrap gap-2">
                      {ALL_APP_KEYS.map(appKey => (
                        <button
                          key={appKey}
                          onClick={() => toggleApp(user.id, appKey)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            edit.apps.includes(appKey)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'hover:bg-accent text-muted-foreground'
                          }`}
                        >
                          {APP_LABELS[appKey]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => cancelEdit(user.id)}
                    disabled={isSaving}
                    className="text-xs px-3 py-1.5 rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => savePermissions(user.id)}
                    disabled={isSaving}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}

            {/* Current apps (view mode) */}
            {!isEditing && perm && perm.apps.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {perm.apps.map(a => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                    {APP_LABELS[a] ?? a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
