import { createContext, useContext, useState, type ReactNode } from 'react'

interface MonthContextValue {
  month: string          // YYYY-MM
  label: string          // "Marzo 2026"
  prev: () => void
  next: () => void
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toYYYYMM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function toLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

const MonthContext = createContext<MonthContextValue | null>(null)

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(() => toYYYYMM(new Date()))

  const shift = (delta: number) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(toYYYYMM(d))
  }

  return (
    <MonthContext.Provider value={{ month, label: toLabel(month), prev: () => shift(-1), next: () => shift(1) }}>
      {children}
    </MonthContext.Provider>
  )
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth debe usarse dentro de MonthProvider')
  return ctx
}
