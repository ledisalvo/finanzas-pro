import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useExpenses } from '@/hooks/useExpenses'
import { useCategories } from '@/context/CategoriesContext'
import type { Expense } from '@/types'

interface ExpenseListProps {
  onEdit: (expense: Expense) => void
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function ExpenseList({ onEdit }: ExpenseListProps) {
  const { data: expenses, remove } = useExpenses()
  const { categories, categoryMap } = useCategories()
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return expenses
    return expenses.filter((e) => e.category === filterCategory)
  }, [expenses, filterCategory])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  )

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Gastos ({sorted.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {sorted.map((exp) => {
            const cat = categoryMap[exp.category]
            return (
              <div
                key={exp.id}
                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat?.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{exp.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exp.recurring && (
                    <Badge variant="secondary" className="text-xs">Recurrente</Badge>
                  )}
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full hidden sm:inline"
                    style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}
                  >
                    {cat?.label}
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
          {sorted.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Sin gastos para esta categoría.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
