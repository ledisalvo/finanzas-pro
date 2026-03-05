import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { BudgetGoal } from '@/types'

interface GoalsContextValue {
  data:    BudgetGoal[]
  loading: boolean
  error:   Error | null
  add:    (item: Omit<BudgetGoal, 'id' | 'user_id'>) => Promise<void>
  update: (id: string, changes: Partial<Omit<BudgetGoal, 'id' | 'user_id'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

const GoalsContext = createContext<GoalsContextValue | null>(null)

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [data, setData]       = useState<BudgetGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return }

    setLoading(true)
    supabase
      .from('budget_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data: rows, error: err }) => {
        if (err) setError(new Error(err.message))
        else setData(rows ?? [])
        setLoading(false)
      })
  }, [userId])

  async function add(item: Omit<BudgetGoal, 'id' | 'user_id'>) {
    const optimistic: BudgetGoal = { ...item, id: crypto.randomUUID(), user_id: userId! }
    setData((prev) => [...prev, optimistic])

    const { data: inserted, error: err } = await supabase
      .from('budget_goals')
      .insert({ ...item, user_id: userId })
      .select()
      .single()

    if (err) {
      setData((prev) => prev.filter((g) => g.id !== optimistic.id))
      setError(new Error(err.message))
    } else {
      setData((prev) => prev.map((g) => (g.id === optimistic.id ? inserted : g)))
    }
  }

  async function update(id: string, changes: Partial<Omit<BudgetGoal, 'id' | 'user_id'>>) {
    const snapshot = data
    setData((prev) => prev.map((g) => (g.id === id ? { ...g, ...changes } : g)))

    const { error: err } = await supabase.from('budget_goals').update(changes).eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  async function remove(id: string) {
    const snapshot = data
    setData((prev) => prev.filter((g) => g.id !== id))

    const { error: err } = await supabase.from('budget_goals').delete().eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  return (
    <GoalsContext.Provider value={{ data, loading, error, add, update, remove }}>
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoals debe usarse dentro de GoalsProvider')
  return ctx
}
