import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { CATEGORIES } from '@/types'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function BudgetVsReal() {
  const { data: expenses } = useExpenses()
  const { data: budgets } = useBudgets()

  const chartData = useMemo(() => {
    const spentMap: Record<string, number> = {}
    expenses.forEach((e) => {
      spentMap[e.category] = (spentMap[e.category] ?? 0) + e.amount
    })
    return CATEGORIES.map((cat) => {
      const budget = budgets.find((b) => b.category === cat.id)
      const presupuesto = budget?.amount ?? 0
      const real = spentMap[cat.id] ?? 0
      return {
        name: cat.label,
        Presupuesto: presupuesto,
        Real: real,
        color: cat.color,
      }
    })
  }, [expenses, budgets])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto vs. Gasto real por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
              <Bar dataKey="Presupuesto" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Real"        fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-left">Categoría</th>
                  <th className="py-2 text-right">Presupuesto</th>
                  <th className="py-2 text-right">Real</th>
                  <th className="py-2 text-right">Diferencia</th>
                  <th className="py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => {
                  const diff = row.Presupuesto - row.Real
                  const pct  = row.Presupuesto > 0 ? Math.round((row.Real / row.Presupuesto) * 100) : 0
                  return (
                    <tr key={row.name} className="border-b border-border/50">
                      <td className="py-2 font-medium">{row.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{formatCurrency(row.Presupuesto)}</td>
                      <td className="py-2 text-right">{formatCurrency(row.Real)}</td>
                      <td className={`py-2 text-right font-medium ${diff >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                      <td className={`py-2 text-right ${pct >= 100 ? 'text-destructive' : pct >= 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {pct}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
