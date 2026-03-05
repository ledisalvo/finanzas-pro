import { useEffect, useRef, useState } from 'react'

const EMOJI_GROUPS = [
  {
    label: 'Comida y bebida',
    emojis: ['🍔', '🍕', '🥗', '🍜', '🥩', '🍱', '☕', '🍺', '🛒', '🍰', '🥐', '🌮', '🍣', '🥪', '🍷'],
  },
  {
    label: 'Transporte',
    emojis: ['🚗', '🚕', '🚌', '🚂', '✈️', '⛽', '🅿️', '🛵', '🚲', '🚁', '🛳️', '🚦'],
  },
  {
    label: 'Personal',
    emojis: ['👤', '💇', '💅', '🏋️', '👕', '👟', '💄', '🪒', '🧴', '👜', '💍', '🧖'],
  },
  {
    label: 'Servicios',
    emojis: ['💡', '📱', '🌐', '💧', '🔥', '📺', '📡', '🔌', '🖥️', '📞', '🏠'],
  },
  {
    label: 'Ocio',
    emojis: ['🎮', '🎬', '🎵', '📚', '🎯', '⚽', '🎸', '🎲', '🏖️', '🎭', '🎪', '🎨'],
  },
  {
    label: 'Salud',
    emojis: ['💊', '🏥', '🦷', '👓', '🩺', '🧬', '💉', '🩹', '🧘', '🏃'],
  },
  {
    label: 'Finanzas',
    emojis: ['💰', '💳', '🏦', '📊', '💸', '🪙', '💹', '🧾', '📈', '💼'],
  },
  {
    label: 'Hogar',
    emojis: ['🏡', '🛋️', '🔧', '🧹', '🪴', '🛁', '🪑', '🛏️', '🪟', '🔑'],
  },
  {
    label: 'Emergencias',
    emojis: ['🚨', '⚠️', '🆘', '🔴', '🚒', '🚑', '🛡️', '⚡'],
  },
  {
    label: 'Educación',
    emojis: ['🎓', '✏️', '🏫', '📝', '🖊️', '🔬', '🗺️', '📐'],
  },
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-xl leading-none">{value || '?'}</span>
        <span className="text-muted-foreground">{value ? 'Cambiar emoji' : 'Elegir emoji'}</span>
        <span className="ml-auto text-muted-foreground text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card shadow-xl">
          {/* Custom input */}
          <div className="border-b border-border p-2">
            <input
              type="text"
              placeholder="O escribí un emoji directo…"
              maxLength={4}
              className="w-full rounded bg-muted px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
              onChange={(e) => {
                const val = [...e.target.value].slice(0, 2).join('')
                if (val) { onChange(val); setOpen(false) }
              }}
            />
          </div>

          {/* Groups */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-3">
            {EMOJI_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { onChange(emoji); setOpen(false) }}
                      className={`rounded p-1 text-lg leading-none transition-colors hover:bg-muted ${
                        value === emoji ? 'bg-primary/20 ring-1 ring-primary' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
