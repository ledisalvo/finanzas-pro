// ─── Domain models ────────────────────────────────────────────────────────────

export interface Expense {
  id: string
  user_id: string
  date: string          // YYYY-MM-DD
  category: string      // Category.id slug
  description: string
  amount: number
  recurring: boolean
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string      // Category.id slug
  amount: number
  month: string         // YYYY-MM
}

export interface Recurring {
  id: string
  user_id: string
  description: string
  category: string      // Category.id slug
  amount: number
  day_of_month: number
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  label: string
  icon: string
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'comida',       label: 'Comida',       icon: '🍔', color: '#f97316' },
  { id: 'viaticos',     label: 'Viáticos',     icon: '🚗', color: '#3b82f6' },
  { id: 'personal',     label: 'Personal',     icon: '👤', color: '#8b5cf6' },
  { id: 'emergencias',  label: 'Emergencias',  icon: '🚨', color: '#ef4444' },
  { id: 'servicios',    label: 'Servicios',    icon: '💡', color: '#eab308' },
  { id: 'ocio',         label: 'Ocio',         icon: '🎮', color: '#22c55e' },
]

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)
