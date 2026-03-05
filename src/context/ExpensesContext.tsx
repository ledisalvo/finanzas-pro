import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Expense } from '@/types'

const MOCK_EXPENSES: Expense[] = [
  { id: '1', user_id: 'mock-user', date: '2026-03-01', category: 'comida',      description: 'Almuerzo trabajo', amount: 1500,  recurring: false, created_at: '2026-03-01T12:00:00Z' },
  { id: '2', user_id: 'mock-user', date: '2026-03-02', category: 'viaticos',    description: 'Nafta',            amount: 8000,  recurring: false, created_at: '2026-03-02T09:00:00Z' },
  { id: '3', user_id: 'mock-user', date: '2026-03-03', category: 'servicios',   description: 'Internet',         amount: 4500,  recurring: true,  created_at: '2026-03-03T08:00:00Z' },
  { id: '4', user_id: 'mock-user', date: '2026-03-04', category: 'ocio',        description: 'Streaming',        amount: 2200,  recurring: true,  created_at: '2026-03-04T20:00:00Z' },
  { id: '5', user_id: 'mock-user', date: '2026-03-05', category: 'personal',    description: 'Ropa',             amount: 12000, recurring: false, created_at: '2026-03-05T15:00:00Z' },
]

interface ExpensesContextValue {
  data:    Expense[]
  loading: boolean
  error:   Error | null
  add:    (item: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => void
  update: (id: string, changes: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) => void
  remove: (id: string) => void
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null)

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Expense[]>(MOCK_EXPENSES)

  function add(item: Omit<Expense, 'id' | 'user_id' | 'created_at'>) {
    // TODO: reemplazar por insert a Supabase en la próxima sesión
    setData((prev) => [
      ...prev,
      { ...item, id: crypto.randomUUID(), user_id: 'mock-user', created_at: new Date().toISOString() },
    ])
  }

  function update(id: string, changes: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) {
    // TODO: reemplazar por update a Supabase en la próxima sesión
    setData((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)))
  }

  function remove(id: string) {
    // TODO: reemplazar por delete a Supabase en la próxima sesión
    setData((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <ExpensesContext.Provider value={{ data, loading: false, error: null, add, update, remove }}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpenses debe usarse dentro de ExpensesProvider')
  return ctx
}
