import { createContext, useContext, useState, type ReactNode } from 'react'
import type { BudgetGoal } from '@/types'

const MOCK_GOALS: BudgetGoal[] = [
  {
    id: '1', user_id: 'mock-user',
    name: 'Fondo de emergencia', icon: '🛡️', color: '#ef4444',
    monthly_amount: 5000, target_amount: 200000, current_amount: 45000,
  },
  {
    id: '2', user_id: 'mock-user',
    name: 'Vacaciones', icon: '🏖️', color: '#3b82f6',
    monthly_amount: 8000, target_amount: null, current_amount: 16000,
  },
]

interface GoalsContextValue {
  data:    BudgetGoal[]
  loading: boolean
  error:   Error | null
  add:    (item: Omit<BudgetGoal, 'id' | 'user_id'>) => void
  update: (id: string, changes: Partial<Omit<BudgetGoal, 'id' | 'user_id'>>) => void
  remove: (id: string) => void
}

const GoalsContext = createContext<GoalsContextValue | null>(null)

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BudgetGoal[]>(MOCK_GOALS)

  function add(item: Omit<BudgetGoal, 'id' | 'user_id'>) {
    setData((prev) => [...prev, { ...item, id: crypto.randomUUID(), user_id: 'mock-user' }])
  }

  function update(id: string, changes: Partial<Omit<BudgetGoal, 'id' | 'user_id'>>) {
    setData((prev) => prev.map((g) => (g.id === id ? { ...g, ...changes } : g)))
  }

  function remove(id: string) {
    setData((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <GoalsContext.Provider value={{ data, loading: false, error: null, add, update, remove }}>
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoals debe usarse dentro de GoalsProvider')
  return ctx
}
