// ─── Domain models ────────────────────────────────────────────────────────────

export interface Expense {
  id: string
  user_id: string
  date: string          // YYYY-MM-DD
  category: string      // Category.id slug
  description: string
  amount: number
  recurring: boolean
  is_debt_payment: boolean
  debt_id: string | null
  is_savings: boolean
  goal_id: string | null
  created_at: string
}

export type DebtType = 'installments' | 'open'

export interface Debt {
  id: string
  user_id: string
  name: string
  color: string
  debt_type: DebtType
  total_amount: number
  installments: number | null       // null when debt_type = 'open'
  installment_amount: number | null // null when debt_type = 'open'
  paid_amount: number
  status: 'active' | 'paid'
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
  amount: number        // always = total_amount * shared_ratio for shared items
  day_of_month: number
  is_shared: boolean
  shared_ratio: number        // 0.01 – 1.0 (user's portion)
  total_amount: number | null // null for non-shared items
  update_type: 'none' | 'ipc'
  update_frequency: number | null  // months between IPC updates
  last_updated: string | null      // YYYY-MM-DD
  next_update_date: string | null  // YYYY-MM-DD
}

export interface Income {
  id: string
  user_id: string
  description: string
  amount: number
  day_of_month: number
  month: string   // YYYY-MM
}

export interface BudgetGoal {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  monthly_amount: number
  target_amount: number | null  // null = sin meta fija
  current_amount: number        // acumulado actual (manual por ahora)
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  label: string
  icon: string
  color: string
  description?: string
  track_budget?: boolean  // false = ocultar en Pres. vs Real (categorías fijas/en el radar)
}

export const CATEGORIES: Category[] = [
  { id: 'supermercado', label: 'Supermercado', icon: '🛒', color: '#f97316', description: 'Compras de alimentos y almacén',          track_budget: true  },
  { id: 'viaticos',     label: 'Viáticos',     icon: '🚗', color: '#3b82f6', description: 'Transporte, nafta, peajes, taxi/Uber',    track_budget: true  },
  { id: 'personal',     label: 'Personal',     icon: '👤', color: '#8b5cf6', description: 'Ropa, peluquería, gym, salud, farmacia',  track_budget: true  },
  { id: 'imprevistos',  label: 'Imprevistos',  icon: '⚡', color: '#ef4444', description: 'Gastos no planeados, arreglos, etc.',     track_budget: true  },
  { id: 'servicios',    label: 'Servicios',    icon: '💡', color: '#eab308', description: 'Luz, agua, gas, internet, teléfono',      track_budget: false },
  { id: 'ocio',         label: 'Ocio',         icon: '🎮', color: '#22c55e', description: 'Suscripciones, entretenimiento, hobbies', track_budget: true  },
]

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)
