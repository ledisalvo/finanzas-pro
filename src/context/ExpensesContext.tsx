import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Expense } from '@/types'

interface ExpensesContextValue {
  data:    Expense[]
  loading: boolean
  error:   Error | null
  add:     (item: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  addMany: (items: Omit<Expense, 'id' | 'user_id' | 'created_at'>[]) => Promise<void>
  update:  (id: string, changes: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) => Promise<void>
  remove:  (id: string) => Promise<void>
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null)

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [data, setData]       = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return }

    setLoading(true)
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (err) setError(new Error(err.message))
        else setData(rows ?? [])
        setLoading(false)
      })
  }, [userId])

  async function add(item: Omit<Expense, 'id' | 'user_id' | 'created_at'>) {
    const optimistic: Expense = {
      ...item,
      id: crypto.randomUUID(),
      user_id: userId!,
      created_at: new Date().toISOString(),
    }
    setData((prev) => [optimistic, ...prev])

    const { data: inserted, error: err } = await supabase
      .from('expenses')
      .insert({ ...item, user_id: userId })
      .select()
      .single()

    if (err) {
      setData((prev) => prev.filter((e) => e.id !== optimistic.id))
      setError(new Error(err.message))
    } else {
      setData((prev) => prev.map((e) => (e.id === optimistic.id ? inserted : e)))
    }
  }

  async function addMany(items: Omit<Expense, 'id' | 'user_id' | 'created_at'>[]) {
    if (items.length === 0) return
    const rows = items.map((item) => ({ ...item, user_id: userId }))

    const { data: inserted, error: err } = await supabase
      .from('expenses')
      .insert(rows)
      .select()

    if (err) {
      setError(new Error(err.message))
    } else {
      setData((prev) =>
        [...(inserted ?? []), ...prev].sort((a, b) => b.date.localeCompare(a.date)),
      )
    }
  }

  async function update(id: string, changes: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) {
    const snapshot = data
    setData((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)))

    const { error: err } = await supabase.from('expenses').update(changes).eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  async function remove(id: string) {
    const snapshot = data
    setData((prev) => prev.filter((e) => e.id !== id))

    const { error: err } = await supabase.from('expenses').delete().eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  return (
    <ExpensesContext.Provider value={{ data, loading, error, add, addMany, update, remove }}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpenses debe usarse dentro de ExpensesProvider')
  return ctx
}
