import { useState } from 'react'
import type { Recurring } from '@/types'

const MOCK_RECURRING: Recurring[] = [
  { id: '1', user_id: 'mock-user', description: 'Internet',    category: 'servicios', amount: 4500, day_of_month: 3  },
  { id: '2', user_id: 'mock-user', description: 'Netflix',     category: 'ocio',      amount: 1800, day_of_month: 5  },
  { id: '3', user_id: 'mock-user', description: 'Spotify',     category: 'ocio',      amount: 400,  day_of_month: 5  },
  { id: '4', user_id: 'mock-user', description: 'Gimnasio',    category: 'personal',  amount: 3500, day_of_month: 10 },
  { id: '5', user_id: 'mock-user', description: 'Seguro auto', category: 'viaticos',  amount: 6200, day_of_month: 15 },
]

export function useRecurring() {
  const [data, setData] = useState<Recurring[]>(MOCK_RECURRING)
  const [loading] = useState(false)
  const [error] = useState<Error | null>(null)

  function add(item: Omit<Recurring, 'id' | 'user_id'>) {
    // TODO: reemplazar por insert a Supabase en la próxima sesión
    const newItem: Recurring = {
      ...item,
      id: crypto.randomUUID(),
      user_id: 'mock-user',
    }
    setData((prev) => [...prev, newItem])
  }

  function update(id: string, changes: Partial<Omit<Recurring, 'id' | 'user_id'>>) {
    // TODO: reemplazar por update a Supabase en la próxima sesión
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
  }

  function remove(id: string) {
    // TODO: reemplazar por delete a Supabase en la próxima sesión
    setData((prev) => prev.filter((r) => r.id !== id))
  }

  return { data, loading, error, add, update, remove }
}
