import { useState } from 'react'
import type { Expense } from '@/types'

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    user_id: 'mock-user',
    date: '2026-03-01',
    category: 'comida',
    description: 'Almuerzo trabajo',
    amount: 1500,
    recurring: false,
    created_at: '2026-03-01T12:00:00Z',
  },
  {
    id: '2',
    user_id: 'mock-user',
    date: '2026-03-02',
    category: 'viaticos',
    description: 'Nafta',
    amount: 8000,
    recurring: false,
    created_at: '2026-03-02T09:00:00Z',
  },
  {
    id: '3',
    user_id: 'mock-user',
    date: '2026-03-03',
    category: 'servicios',
    description: 'Internet',
    amount: 4500,
    recurring: true,
    created_at: '2026-03-03T08:00:00Z',
  },
  {
    id: '4',
    user_id: 'mock-user',
    date: '2026-03-04',
    category: 'ocio',
    description: 'Streaming',
    amount: 2200,
    recurring: true,
    created_at: '2026-03-04T20:00:00Z',
  },
  {
    id: '5',
    user_id: 'mock-user',
    date: '2026-03-05',
    category: 'personal',
    description: 'Ropa',
    amount: 12000,
    recurring: false,
    created_at: '2026-03-05T15:00:00Z',
  },
]

export function useExpenses() {
  const [data] = useState<Expense[]>(MOCK_EXPENSES)
  const [loading] = useState(false)
  const [error] = useState<Error | null>(null)

  return { data, loading, error }
}
