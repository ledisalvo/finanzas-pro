import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useExpenses } from '@/hooks/useExpenses'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function Projection() {
  const { data: expenses } = useExpenses()

  // Proyección simple: acumulado real del mes + línea de tendencia hasta fin de mes
  const projectionData = useMemo(() => {
    const today = new Date('2026-03-05')
    const dayOfMonth = today.getDate()
    const daysInMonth = 31 // marzo

    // Acumulado diario real
    const dailyMap: Record<number, number> = {}
    expenses.forEach((e) => {
      const d = parseInt(e.date.split('-')[2], 10)
      dailyMap[d] = (dailyMap[d] ?? 0) + e.amount
    })

    const data: { dia: string; real: number | null; proyectado: number | null; acumulado: number | null }[] = []
    let cumReal = 0
    for (let day = 1; day <= daysInMonth; day++) {
      if (day <= dayOfMonth) {
        cumReal += dailyMap[day] ?? 0
        data.push({ dia: `${day}`, real: cumReal, proyectado: null, acumulado: null })
      } else {
        const projected = Math.round((cumReal / dayOfMonth) * day)
        data.push({ dia: `${day}`, real: null, proyectado: projected, acumulado: null })
      }
    }
    return data
  }, [expenses])

  const avgDaily = useMemo(() => {
    const dayOfMonth = 5
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    return total / dayOfMonth
  }, [expenses])

  const projected = Math.round(avgDaily * 31)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Promedio diario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(Math.round(avgDaily))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Proyección fin de mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(projected)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendencia mensual</CardTitle>
          <CardDescription>Acumulado real (azul) y proyección (gris punteado)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={projectionData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <XAxis dataKey="dia" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0)]}
              />
              <ReferenceLine x="5" stroke="#3b82f6" strokeDasharray="4 2" />
              <Line
                type="monotone"
                dataKey="real"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="proyectado"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Nota: la proyección se calculará con lógica real en la próxima sesión,
            tomando promedios históricos y gastos recurrentes conocidos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
