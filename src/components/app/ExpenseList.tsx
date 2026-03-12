import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useExpenses } from '@/hooks/useExpenses'
import { useCategories } from '@/context/CategoriesContext'
import { useMonth } from '@/context/MonthContext'
import { CsvImport } from '@/components/app/CsvImport'
import type { Expense } from '@/types'

interface ExpenseListProps {
  onEdit: (expense: Expense) => void
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-').map(Number)
  return `${day} de ${MONTHS[month - 1]}`
}

export default function ExpenseList({ onEdit }: ExpenseListProps) {
  const { month }                   = useMonth()
  const { data: expenses, remove }  = useExpenses()
  const { categories, categoryMap } = useCategories()
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showImport, setShowImport]          = useState(false)

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(month)),
    [expenses, month],
  )

  const hasUncategorized = useMemo(
    () => monthExpenses.some((e) => !e.category),
    [monthExpenses],
  )

  const filtered = useMemo(
    () => monthExpenses.filter((e) => {
      if (filterCategory === 'all')  return true
      if (filterCategory === '__none__') return !e.category
      return e.category === filterCategory
    }),
    [monthExpenses, filterCategory],
  )

  const otherMonthsCount = useMemo(
    () => expenses.filter((e) => !e.date.startsWith(month)).length,
    [expenses, month],
  )

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
    const map = new Map<string, typeof filtered>()
    sorted.forEach((e) => {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    })
    return Array.from(map.entries()) // [['2026-03-09', [...]], ...]
  }, [filtered])

  const sorted = useMemo(() => grouped.flatMap(([, exps]) => exps), [grouped])

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  )

  return (
    <div className="space-y-4">
      {showImport && <CsvImport onClose={() => setShowImport(false)} />}

      {/* KPI total */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total de gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
        </CardContent>
      </Card>

      {/* Category filter + import button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filterCategory === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          Todos
        </button>
        {hasUncategorized && (
          <button
            onClick={() => setFilterCategory('__none__')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === '__none__'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            📋 Sin categoría
          </button>
        )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filterCategory === cat.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
          Importar CSV
        </Button>
      </div>

      {otherMonthsCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          <span className="text-foreground font-medium">{otherMonthsCount} gasto{otherMonthsCount !== 1 ? 's' : ''}</span>
          {' '}en otros meses — usá el selector de mes para navegarlos.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gastos ({sorted.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {grouped.map(([date, exps]) => (
            <div key={date}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-3 pt-4 pb-1">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  {formatDateLabel(date)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Gastos del día */}
              {exps.map((exp) => {
                const cat   = categoryMap[exp.category]
                const icon  = cat?.icon  ?? '📋'
                const label = cat?.label ?? 'Sin categoría'
                const color = cat?.color ?? '#94a3b8'
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <p className="text-sm font-medium">{exp.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {exp.recurring && (
                        <Badge variant="secondary" className="text-xs">Recurrente</Badge>
                      )}
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full hidden sm:inline"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {label}
                      </span>
                      <p className="font-semibold w-24 text-right">{formatCurrency(exp.amount)}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(exp)}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remove(exp.id)}
                          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {sorted.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Sin gastos para esta categoría.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
