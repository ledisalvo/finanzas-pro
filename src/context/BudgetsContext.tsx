import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Budget } from '@/types'

interface BudgetsContextValue {
  data:    Budget[]
  loading: boolean
  error:   Error | null
  upsert: (category: string, amount: number, month: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

const BudgetsContext = createContext<BudgetsContextValue | null>(null)

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [data, setData]       = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return }

    setLoading(true)
    supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (err) setError(new Error(err.message))
        else setData(rows ?? [])
        setLoading(false)
      })
  }, [userId])

  async function upsert(category: string, amount: number, month: string) {
    const existing = data.find((b) => b.category === category && b.month === month)

    if (existing) {
      const snapshot = data
      setData((prev) => prev.map((b) => (b.id === existing.id ? { ...b, amount } : b)))
      const { error: err } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existing.id)
      if (err) { setData(snapshot); setError(new Error(err.message)) }
    } else {
      const optimistic: Budget = {
        id: crypto.randomUUID(), user_id: userId!, category, amount, month,
      }
      setData((prev) => [...prev, optimistic])
      const { data: inserted, error: err } = await supabase
        .from('budgets')
        .insert({ user_id: userId, category, amount, month })
        .select()
        .single()
      if (err) {
        setData((prev) => prev.filter((b) => b.id !== optimistic.id))
        setError(new Error(err.message))
      } else {
        setData((prev) => prev.map((b) => (b.id === optimistic.id ? inserted : b)))
      }
    }
  }

  async function remove(id: string) {
    const snapshot = data
    setData((prev) => prev.filter((b) => b.id !== id))
    const { error: err } = await supabase.from('budgets').delete().eq('id', id)
    if (err) { setData(snapshot); setError(new Error(err.message)) }
  }

  return (
    <BudgetsContext.Provider value={{ data, loading, error, upsert, remove }}>
      {children}
    </BudgetsContext.Provider>
  )
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext)
  if (!ctx) throw new Error('useBudgets debe usarse dentro de BudgetsProvider')
  return ctx
}
