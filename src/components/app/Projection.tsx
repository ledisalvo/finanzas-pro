import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useIncomes } from '@/hooks/useIncomes'
import { useRecurring } from '@/hooks/useRecurring'
import { useGoals } from '@/hooks/useGoals'

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function getNextMonths(count: number) {
  const result = []
  const now = new Date('2026-03-01')
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    result.push({ label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, short: MONTH_NAMES[d.getMonth()] })
  }
  return result
}

export default function Projection() {
  const { data: incomes }   = useIncomes()
  const { data: recurring } = useRecurring()
  const { data: goals }     = useGoals()

  const totalIngresos  = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes])
  const totalFijos     = useMemo(() => recurring.reduce((s, r) => s + r.amount, 0), [recurring])
  const totalObjetivos = useMemo(() => goals.reduce((s, g) => s + g.monthly_amount, 0), [goals])
  const totalLibre     = totalIngresos - totalFijos - totalObjetivos

  const months = useMemo(() => getNextMonths(6), [])

  const chartData = useMemo(() => months.map(({ short }) => ({
    mes:       short,
    Fijos:     totalFijos,
    Objetivos: totalObjetivos,
    Libre:     Math.max(0, totalLibre),
  })), [months, totalFijos, totalObjetivos, totalLibre])

  const goalsWithTarget = useMemo(
    () => goals.filter((g) => g.target_amount !== null && g.monthly_amount > 0),
    [goals],
  )

  return (
    <div className="space-y-6">
      {/* Balance mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Balance mensual proyectado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Ingresos</span>
            <span className="font-semibold text-green-400">{formatCurrency(totalIngresos)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-sm text-muted-foreground">− Gastos fijos (recurrentes)</span>
            <span className="font-medium text-destructive">−{formatCurrency(totalFijos)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-sm text-muted-foreground">− Aportes a objetivos</span>
            <span className="font-medium text-yellow-400">−{formatCurrency(totalObjetivos)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-semibold">= Disponible libre</span>
            <span className={`text-xl font-bold ${totalLibre >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(totalLibre)}
            </span>
          </div>
          {totalLibre < 0 && (
            <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
              ⚠️ Tus compromisos fijos superan tus ingresos. Revisá tus gastos o ajustá los objetivos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stacked bar — próximos 6 meses */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución mensual — próximos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
              <Bar dataKey="Fijos"     stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Objetivos" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Libre"     stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla mes a mes */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección mes a mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-left">Mes</th>
                  <th className="py-2 text-right text-green-400">Ingresos</th>
                  <th className="py-2 text-right text-destructive">Fijos</th>
                  <th className="py-2 text-right text-yellow-400">Objetivos</th>
                  <th className="py-2 text-right text-primary">Libre</th>
                </tr>
              </thead>
              <tbody>
                {months.map(({ label }) => (
                  <tr key={label} className="border-b border-border/50">
                    <td className="py-2 font-medium">{label}</td>
                    <td className="py-2 text-right text-green-400">{formatCurrency(totalIngresos)}</td>
                    <td className="py-2 text-right text-destructive">−{formatCurrency(totalFijos)}</td>
                    <td className="py-2 text-right text-yellow-400">−{formatCurrency(totalObjetivos)}</td>
                    <td className={`py-2 text-right font-semibold ${totalLibre >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(totalLibre)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Estimación de metas */}
      {goalsWithTarget.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estimación de metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalsWithTarget.map((goal) => {
              const remaining = goal.target_amount! - goal.current_amount
              const monthsLeft = remaining > 0 ? Math.ceil(remaining / goal.monthly_amount) : 0
              const targetDate = new Date('2026-03-01')
              targetDate.setMonth(targetDate.getMonth() + monthsLeft)
              const dateStr = `${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getFullYear()}`
              return (
                <div key={goal.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span>{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.name}</span>
                  </div>
                  <div className="text-right">
                    {monthsLeft <= 0
                      ? <span className="text-sm font-medium text-green-400">¡Meta alcanzada!</span>
                      : <>
                          <p className="text-sm font-medium">{dateStr}</p>
                          <p className="text-xs text-muted-foreground">{monthsLeft} meses · faltan {formatCurrency(remaining)}</p>
                        </>
                    }
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
