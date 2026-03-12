import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/context/CategoriesContext'
import { useGoals } from '@/hooks/useGoals'
import { useRecurring } from '@/hooks/useRecurring'
import { useIncomes } from '@/hooks/useIncomes'
import { useMonth } from '@/context/MonthContext'
import { useDebts } from '@/hooks/useDebts'
import { IpcAlertBanner } from '@/components/app/IpcAlertBanner'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function Dashboard() {
  const { month }           = useMonth()
  const { data: expenses }  = useExpenses()
  const { data: budgets }   = useBudgets()
  const { data: goals }     = useGoals()
  const { data: recurring } = useRecurring()
  const { data: incomes }   = useIncomes()
  const { data: debts }     = useDebts()
  const { categories, categoryMap } = useCategories()

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(month)),
    [expenses, month],
  )

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalIngresos = useMemo(
    () => incomes.filter((i) => i.month === month).reduce((s, i) => s + i.amount, 0),
    [incomes, month],
  )
  const totalFijos = useMemo(() => recurring.reduce((s, r) => s + r.amount, 0), [recurring])
  const totalPresupuestado = useMemo(
    () => budgets.filter((b) => b.month === month).reduce((s, b) => s + b.amount, 0),
    [budgets, month],
  )
  const sinAsignar = totalIngresos - totalFijos - totalPresupuestado

  const totalDeudaRestante = useMemo(
    () => debts.filter((d) => d.status === 'active')
              .reduce((s, d) => s + Math.max(0, d.total_amount - d.paid_amount), 0),
    [debts],
  )
  const totalAhorrado = useMemo(
    () => goals.reduce((s, g) => s + g.current_amount, 0),
    [goals],
  )

  // ── Category status ───────────────────────────────────────────────────────
  const categoryStatus = useMemo(() => {
    const spentMap: Record<string, number> = {}
    monthExpenses.forEach((e) => { spentMap[e.category] = (spentMap[e.category] ?? 0) + e.amount })

    return categories
      .filter((cat) => cat.track_budget !== false)
      .map((cat) => {
        const budget = budgets.find((b) => b.category === cat.id && b.month === month)
        const presupuesto = budget?.amount ?? 0
        const real = spentMap[cat.id] ?? 0
        const pct  = presupuesto > 0 ? Math.round((real / presupuesto) * 100) : null
        return { cat, presupuesto, real, pct }
      })
      .filter((row) => row.presupuesto > 0 || row.real > 0)
      .sort((a, b) => {
        // Sort: over budget first, then by % desc, then no budget at end
        if (a.pct === null && b.pct !== null) return 1
        if (a.pct !== null && b.pct === null) return -1
        return (b.pct ?? 0) - (a.pct ?? 0)
      })
  }, [monthExpenses, categories, budgets, month])

  const overBudget = categoryStatus.filter((r) => r.pct !== null && r.pct > 100)

  // ── Recent expenses ───────────────────────────────────────────────────────
  const recentExpenses = useMemo(
    () => [...monthExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [monthExpenses],
  )

  return (
    <div className="space-y-6">
      <IpcAlertBanner />

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Ingresos del mes</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIngresos)}</p>
          </CardContent>
        </Card>

        <Card className={sinAsignar === 0 ? 'border-green-400/40' : sinAsignar < 0 ? 'border-destructive/40' : 'border-yellow-400/40'}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Sin asignar</p>
            <p className={`text-2xl font-bold ${sinAsignar === 0 ? 'text-green-400' : sinAsignar < 0 ? 'text-destructive' : 'text-yellow-400'}`}>
              {formatCurrency(sinAsignar)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sinAsignar === 0 ? 'Base cero ✓' : sinAsignar > 0 ? 'Por asignar' : 'Excedido'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Deuda restante</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDeudaRestante)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {debts.filter((d) => d.status === 'active').length} deuda{debts.filter((d) => d.status === 'active').length !== 1 ? 's' : ''} activa{debts.filter((d) => d.status === 'active').length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Total ahorrado</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalAhorrado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {goals.length} objetivo{goals.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Alertas ── */}
      {overBudget.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              ⚠ {overBudget.length} categoría{overBudget.length !== 1 ? 's' : ''} superaron el presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {overBudget.map(({ cat, real, presupuesto, pct }) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm"
                >
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                  <span className="text-destructive font-semibold">{pct}%</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatCurrency(real - presupuesto)} extra)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Category status grid ── */}
      {categoryStatus.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Estado por categoría</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryStatus.map(({ cat, presupuesto, real, pct }) => {
              const barColor =
                pct === null      ? '#64748b' :
                pct > 100         ? '#ef4444' :
                pct === 100       ? '#94a3b8' :
                pct >= 80         ? '#eab308' : '#22c55e'
              const clampedPct = pct !== null ? Math.min(pct, 100) : 0

              return (
                <Card key={cat.id} className="overflow-hidden">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </div>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: barColor }}
                      >
                        {pct !== null ? `${pct}%` : '—'}
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${clampedPct}%`, backgroundColor: barColor }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(real)} gastado</span>
                      {presupuesto > 0
                        ? <span>{formatCurrency(presupuesto)} pres.</span>
                        : <span className="italic">sin presupuesto</span>
                      }
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent expenses ── */}
      {recentExpenses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Últimos gastos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentExpenses.map((exp) => {
              const cat = categoryMap[exp.category]
              return (
                <div key={exp.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{cat?.icon ?? '📋'}</span>
                    <div>
                      <p className="text-sm font-medium leading-tight">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.date.slice(8, 10)}/{exp.date.slice(5, 7)} · {cat?.label ?? 'Sin categoría'}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(exp.amount)}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {categoryStatus.length === 0 && recentExpenses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Sin datos para este mes. Cargá ingresos, presupuestos y gastos para ver el dashboard.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
