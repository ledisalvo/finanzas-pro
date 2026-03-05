import { useState } from 'react'
import type { Budget } from '@/types'

const MOCK_BUDGETS: Budget[] = [
  { id: '1', user_id: 'mock-user', category: 'comida',      amount: 20000, month: '2026-03' },
  { id: '2', user_id: 'mock-user', category: 'viaticos',    amount: 15000, month: '2026-03' },
  { id: '3', user_id: 'mock-user', category: 'personal',    amount: 10000, month: '2026-03' },
  { id: '4', user_id: 'mock-user', category: 'emergencias', amount: 5000,  month: '2026-03' },
  { id: '5', user_id: 'mock-user', category: 'servicios',   amount: 8000,  month: '2026-03' },
  { id: '6', user_id: 'mock-user', category: 'ocio',        amount: 6000,  month: '2026-03' },
]

export function useBudgets() {
  const [data] = useState<Budget[]>(MOCK_BUDGETS)
  const [loading] = useState(false)
  const [error] = useState<Error | null>(null)

  return { data, loading, error }
}
