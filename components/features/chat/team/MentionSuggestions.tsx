'use client'

interface Profile {
  clerk_user_id: string
  full_name: string
}

interface MentionSuggestionsProps {
  query: string
  profiles: Profile[]
  onSelect: (profile: Profile) => void
}

export function MentionSuggestions({ query, profiles, onSelect }: MentionSuggestionsProps) {
  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)

  if (filtered.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 mb-1 w-56 bg-popover border rounded-md shadow-md z-50 overflow-hidden">
      {filtered.map((profile) => (
        <button
          key={profile.clerk_user_id}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(profile)
          }}
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {profile.full_name[0]}
          </div>
          {profile.full_name}
        </button>
      ))}
    </div>
  )
}
