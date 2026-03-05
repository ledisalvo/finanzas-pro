import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useCategories } from '@/context/CategoriesContext'
import { useGoals } from '@/hooks/useGoals'
import { useRecurring } from '@/hooks/useRecurring'
import { useMonth } from '@/context/MonthContext'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function Dashboard() {
  const { month }           = useMonth()
  const { data: expenses }  = useExpenses()
  const { data: budgets }   = useBudgets()
  const { data: goals }     = useGoals()
  const { data: recurring } = useRecurring()
  const { categories, categoryMap } = useCategories()

  const monthExpenses    = useMemo(() => expenses.filter((e) => e.date.startsWith(month)), [expenses, month])
  const monthBudgets     = useMemo(() => budgets.filter((b) => b.month === month), [budgets, month])

  const totalGastado     = useMemo(() => monthExpenses.reduce((sum, e) => sum + e.amount, 0), [monthExpenses])
  const totalPresupuesto = useMemo(() => monthBudgets.reduce((sum, b) => sum + b.amount, 0), [monthBudgets])
  const totalFijos       = useMemo(() => recurring.reduce((sum, r) => sum + r.amount, 0), [recurring])

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return categories.map((cat) => ({ name: cat.label, gasto: map[cat.id] ?? 0, color: cat.color }))
  }, [monthExpenses, categories])

  const pct = totalPresupuesto > 0
    ? Math.min(100, Math.round((totalGastado / totalPresupuesto) * 100))
    : 0

  const goalsWithTarget = useMemo(() => goals.filter((g) => g.target_amount !== null), [goals])

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gastado este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalGastado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Presupuesto total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPresupuesto)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalPresupuesto - totalGastado >= 0 ? 'text-green-400' : 'text-destructive'}`}>
              {formatCurrency(totalPresupuesto - totalGastado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Uso del presupuesto — {pct}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#3b82f6' }} />
          </div>
        </CardContent>
      </Card>

      {/* Goals progress — solo los que tienen meta */}
      {goalsWithTarget.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Objetivos de ahorro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalsWithTarget.map((goal) => {
              const pctGoal = Math.min(100, Math.round((goal.current_amount / goal.target_amount!) * 100))
              const remaining = goal.target_amount! - goal.current_amount
              const monthsLeft = goal.monthly_amount > 0 ? Math.ceil(remaining / goal.monthly_amount) : null
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{goal.icon}</span>
                      <span className="text-sm font-medium">{goal.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{formatCurrency(goal.current_amount)}</span>
                      <span className="text-xs text-muted-foreground"> / {formatCurrency(goal.target_amount!)}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pctGoal}%`, backgroundColor: goal.color }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs font-medium" style={{ color: goal.color }}>{pctGoal}%</span>
                    {monthsLeft !== null && monthsLeft > 0
                      ? <span className="text-xs text-muted-foreground">~{monthsLeft} meses para la meta</span>
                      : <span className="text-xs text-green-400 font-medium">¡Meta alcanzada!</span>
                    }
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Gastos fijos del mes */}
      {totalFijos > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gastos fijos del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalFijos)}</p>
            <p className="text-xs text-muted-foreground mt-1">{recurring.length} concepto{recurring.length !== 1 ? 's' : ''} recurrente{recurring.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      )}

      {/* Bar chart by category */}
      <Card>
        <CardHeader>
          <CardTitle>Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              Sin gastos registrados. Usá <span className="text-primary font-medium">+ Nuevo gasto</span> para agregar uno.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory.filter((c) => c.gasto > 0)} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                  formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Gasto']} />
                <Bar dataKey="gasto" radius={[4, 4, 0, 0]}>
                  {byCategory.filter((c) => c.gasto > 0).map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos gastos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthExpenses.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">Sin gastos registrados en este mes.</p>
          ) : (
            monthExpenses.slice(0, 5).map((exp) => {
              const cat = categoryMap[exp.category]
              return (
                <div key={exp.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.date} · {cat?.label}</p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatCurrency(exp.amount)}</p>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
