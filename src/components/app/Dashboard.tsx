import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { CATEGORIES, CATEGORY_MAP } from '@/types'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function Dashboard() {
  const { data: expenses } = useExpenses()
  const { data: budgets } = useBudgets()

  const totalGastado = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )

  const totalPresupuesto = useMemo(
    () => budgets.reduce((sum, b) => sum + b.amount, 0),
    [budgets],
  )

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount
    })
    return CATEGORIES.map((cat) => ({
      name: cat.label,
      gasto: map[cat.id] ?? 0,
      color: cat.color,
    }))
  }, [expenses])

  const pct = totalPresupuesto > 0
    ? Math.min(100, Math.round((totalGastado / totalPresupuesto) * 100))
    : 0

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

      {/* Progress bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Uso del presupuesto — {pct}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#3b82f6',
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bar chart by category */}
      <Card>
        <CardHeader>
          <CardTitle>Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Gasto']}
              />
              <Bar dataKey="gasto" radius={[4, 4, 0, 0]}>
                {byCategory.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos gastos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {expenses.slice(-5).reverse().map((exp) => {
            const cat = CATEGORY_MAP[exp.category]
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
          })}
        </CardContent>
      </Card>
    </div>
  )
}
