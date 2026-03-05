import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Income } from '@/types'

const MOCK_INCOMES: Income[] = [
  { id: '1', user_id: 'mock-user', description: 'Sueldo', amount: 150000, day_of_month: 5 },
]

interface IncomesContextValue {
  data:    Income[]
  loading: boolean
  error:   Error | null
  add:    (item: Omit<Income, 'id' | 'user_id'>) => void
  update: (id: string, changes: Partial<Omit<Income, 'id' | 'user_id'>>) => void
  remove: (id: string) => void
}

const IncomesContext = createContext<IncomesContextValue | null>(null)

export function IncomesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Income[]>(MOCK_INCOMES)

  function add(item: Omit<Income, 'id' | 'user_id'>) {
    setData((prev) => [...prev, { ...item, id: crypto.randomUUID(), user_id: 'mock-user' }])
  }

  function update(id: string, changes: Partial<Omit<Income, 'id' | 'user_id'>>) {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
  }

  function remove(id: string) {
    setData((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <IncomesContext.Provider value={{ data, loading: false, error: null, add, update, remove }}>
      {children}
    </IncomesContext.Provider>
  )
}

export function useIncomes() {
  const ctx = useContext(IncomesContext)
  if (!ctx) throw new Error('useIncomes debe usarse dentro de IncomesProvider')
  return ctx
}
