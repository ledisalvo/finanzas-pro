import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Debt } from '@/types'

interface DebtsContextValue {
  data:        Debt[]
  loading:     boolean
  error:       Error | null
  add:         (item: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  remove:      (id: string) => Promise<void>
  addPayment:  (debtId: string, amount: number) => Promise<void>
}

const DebtsContext = createContext<DebtsContextValue | null>(null)

export function DebtsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [data, setData]       = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) { setData([]); setLoading(false); return }

    setLoading(true)
    supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data: rows, error: err }) => {
        if (err) setError(new Error(err.message))
        else setData(rows ?? [])
        setLoading(false)
      })
  }, [userId])

  async function add(item: Omit<Debt, 'id' | 'user_id' | 'created_at'>) {
    const optimistic: Debt = {
      ...item,
      id: crypto.randomUUID(),
      user_id: userId!,
      created_at: new Date().toISOString(),
    }
    setData((prev) => [optimistic, ...prev])

    const { data: inserted, error: err } = await supabase
      .from('debts')
      .insert({ ...item, user_id: userId })
      .select()
      .single()

    if (err) {
      setData((prev) => prev.filter((d) => d.id !== optimistic.id))
      setError(new Error(err.message))
    } else {
      setData((prev) => prev.map((d) => (d.id === optimistic.id ? inserted : d)))
    }
  }

  async function remove(id: string) {
    const snapshot = data
    setData((prev) => prev.filter((d) => d.id !== id))

    const { error: err } = await supabase.from('debts').delete().eq('id', id)
    if (err) {
      setData(snapshot)
      setError(new Error(err.message))
    }
  }

  async function addPayment(debtId: string, amount: number) {
    const debt = data.find((d) => d.id === debtId)
    if (!debt) return

    const newPaid:   number         = debt.paid_amount + amount
    const newStatus: Debt['status'] = newPaid >= debt.total_amount ? 'paid' : 'active'

    setData((prev) =>
      prev.map((d) => (d.id === debtId ? { ...d, paid_amount: newPaid, status: newStatus } : d)),
    )

    const { error: err } = await supabase
      .from('debts')
      .update({ paid_amount: newPaid, status: newStatus })
      .eq('id', debtId)
      .eq('user_id', userId)

    if (err) {
      setData((prev) =>
        prev.map((d) => (d.id === debtId ? { ...d, paid_amount: debt.paid_amount, status: debt.status } : d)),
      )
      setError(new Error(err.message))
    }
  }

  return (
    <DebtsContext.Provider value={{ data, loading, error, add, remove, addPayment }}>
      {children}
    </DebtsContext.Provider>
  )
}

export function useDebts() {
  const ctx = useContext(DebtsContext)
  if (!ctx) throw new Error('useDebts debe usarse dentro de DebtsProvider')
  return ctx
}
