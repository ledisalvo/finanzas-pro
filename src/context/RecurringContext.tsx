import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Recurring } from '@/types'

interface RecurringContextValue {
  data:         Recurring[]
  overdueItems: Recurring[]
  loading:      boolean
  error:        Error | null
  add:             (item: Omit<Recurring, 'id' | 'user_id'>) => Promise<void>
  update:          (id: string, changes: Partial<Omit<Recurring, 'id' | 'user_id'>>) => Promise<void>
  remove:          (id: string) => Promise<void>
  applyIpcUpdate:  (id: string, ipcPercent: number) => Promise<void>
}

const RecurringContext = createContext<RecurringContextValue | null>(null)

export function RecurringProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [data, setData]       = useState<Recurring[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return }

    setLoading(true)
    supabase
      .from('recurring')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_month', { ascending: true })
      .then(({ data: rows, error: err }) => {
        if (err) setError(new Error(err.message))
        else setData(rows ?? [])
        setLoading(false)
      })
  }, [userId])

  const overdueItems = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return data.filter(
      (r) => r.update_type === 'ipc' && r.next_update_date != null && r.next_update_date <= today,
    )
  }, [data])

  async function add(item: Omit<Recurring, 'id' | 'user_id'>) {
    const optimistic: Recurring = { ...item, id: crypto.randomUUID(), user_id: userId! }
    setData((prev) => [...prev, optimistic])

    const { data: inserted, error: err } = await supabase
      .from('recurring')
      .insert({ ...item, user_id: userId })
      .select()
      .single()

    if (err) {
      setData((prev) => prev.filter((r) => r.id !== optimistic.id))
      setError(new Error(err.message))
    } else {
      setData((prev) => prev.map((r) => (r.id === optimistic.id ? inserted : r)))
    }
  }

  async function update(id: string, changes: Partial<Omit<Recurring, 'id' | 'user_id'>>) {
    const snapshot = data
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))

    const { error: err } = await supabase.from('recurring').update(changes).eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  async function remove(id: string) {
    const snapshot = data
    setData((prev) => prev.filter((r) => r.id !== id))

    const { error: err } = await supabase.from('recurring').delete().eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  async function applyIpcUpdate(id: string, ipcPercent: number) {
    const item = data.find((r) => r.id === id)
    if (!item) return

    const today = new Date()
    const nextDate = new Date(today)
    nextDate.setMonth(nextDate.getMonth() + (item.update_frequency ?? 1))

    const dates = {
      last_updated:     today.toISOString().slice(0, 10),
      next_update_date: nextDate.toISOString().slice(0, 10),
    }

    if (item.is_shared && item.total_amount != null) {
      const newTotal  = item.total_amount * (1 + ipcPercent / 100)
      const newAmount = newTotal * item.shared_ratio
      await update(id, { total_amount: newTotal, amount: newAmount, ...dates })
    } else {
      const newAmount = item.amount * (1 + ipcPercent / 100)
      await update(id, { amount: newAmount, ...dates })
    }
  }

  return (
    <RecurringContext.Provider value={{ data, overdueItems, loading, error, add, update, remove, applyIpcUpdate }}>
      {children}
    </RecurringContext.Provider>
  )
}

export function useRecurring() {
  const ctx = useContext(RecurringContext)
  if (!ctx) throw new Error('useRecurring debe usarse dentro de RecurringProvider')
  return ctx
}
