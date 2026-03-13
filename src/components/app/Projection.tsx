import { useMemo, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useIncomes } from '@/hooks/useIncomes'
import { useRecurring } from '@/hooks/useRecurring'
import { useBudgets } from '@/hooks/useBudgets'
import { usePlannedEvents } from '@/hooks/usePlannedEvents'
import { useCategories } from '@/context/CategoriesContext'
import type { PlannedEventOccurrence } from '@/types'

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// ─── Event pin renderer (SVG, inside Recharts LabelList) ──────────────────────

function makeEventPinContent(
  chartData:      { monthKey: string }[],
  pendingByMonth: Map<string, PlannedEventOccurrence[]>,
  onEnter:        (monthKey: string, x: number, y: number) => void,
  onLeave:        () => void,
) {
  return function EventPinContent(props: any) {
    const { x, y, width, index } = props
    if (index == null || !chartData[index]) return null
    const monthKey = chartData[index].monthKey
    const events = pendingByMonth.get(monthKey) ?? []
    if (events.length === 0) return null

    const cx = (x ?? 0) + (width ?? 0) / 2
    const cy = (y ?? 0) - 12

    return (
      <g>
        <circle
          cx={cx} cy={cy} r={9}
          fill="#f59e0b"
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => onEnter(monthKey, e.clientX, e.clientY)}
          onMouseLeave={onLeave}
        />
        <text
          x={cx} y={cy + 4}
          textAnchor="middle"
          fill="white"
          fontSize={10}
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {events.length}
        </text>
      </g>
    )
  }
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Returns YYYY-MM strings for the next `count` months starting from the selected month */
function getNextMonthKeys(fromMonth: string, count: number): string[] {
  const [year, month] = fromMonth.split('-').map(Number)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1 + i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

function monthLabel(key: string) {
  const [, m] = key.split('-').map(Number)
  return MONTH_NAMES[m - 1]
}

/** YYYY-MM del mes actual real (independiente del selector de mes) */
function todayMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function Projection() {
  const { data: incomes }   = useIncomes()
  const { data: recurring } = useRecurring()
  const { data: budgets }   = useBudgets()
  const { occurrences }     = usePlannedEvents()
  const { categoryMap }     = useCategories()

  const [pinTooltip, setPinTooltip] = useState<{ monthKey: string; x: number; y: number } | null>(null)

  const handlePinEnter = useCallback((monthKey: string, x: number, y: number) => {
    setPinTooltip({ monthKey, x, y })
  }, [])
  const handlePinLeave = useCallback(() => setPinTooltip(null), [])

  // Mes actual real — la proyección siempre parte de hoy
  const currentMonth = useMemo(() => todayMonthKey(), [])

  // Ingresos del mes actual como base de referencia
  const baseIngresos = useMemo(
    () => incomes.filter((i) => i.month === currentMonth).reduce((s, i) => s + i.amount, 0),
    [incomes, currentMonth],
  )

  // Gastos fijos mensuales (recurrentes)
  const totalFijos = useMemo(() => recurring.reduce((s, r) => s + r.amount, 0), [recurring])

  // Proyección para los próximos 6 meses desde hoy — no cambia con el selector
  const monthKeys = useMemo(() => getNextMonthKeys(currentMonth, 6), [currentMonth])

  // Límite de la ventana de 6 meses (para filtrar ocurrencias sin alterar el context)
  const windowEnd = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 6)
    return d.toISOString().slice(0, 10)
  }, [])

  // Solo ocurrencias pendientes (sin gasto vinculado) dentro de los 6 meses
  const pendingOccurrences = useMemo(
    () => occurrences.filter((o) => !o.instance?.expense_id && o.date <= windowEnd),
    [occurrences, windowEnd],
  )

  // Agrupadas por mes para los pins
  const pendingByMonth = useMemo(() => {
    const map = new Map<string, PlannedEventOccurrence[]>()
    for (const occ of pendingOccurrences) {
      const ym = occ.date.slice(0, 7)
      if (!map.has(ym)) map.set(ym, [])
      map.get(ym)!.push(occ)
    }
    return map
  }, [pendingOccurrences])

  const chartData = useMemo(() => monthKeys.map((key) => {
    // Ingresos: use from DB if available for that month, otherwise use base
    const ingresos = incomes.filter((i) => i.month === key).reduce((s, i) => s + i.amount, 0) || baseIngresos

    // Presupuestado: sum of budgets for that month; fallback to current month budgets
    const budgetedMonth = budgets.filter((b) => b.month === key)
    const fallbackBudgets = budgets.filter((b) => b.month === currentMonth)
    const presupuestado = (budgetedMonth.length > 0 ? budgetedMonth : fallbackBudgets)
      .reduce((s, b) => s + b.amount, 0)

    const libre = Math.max(0, ingresos - totalFijos - presupuestado)
    const deficit = ingresos - totalFijos - presupuestado < 0
      ? Math.abs(ingresos - totalFijos - presupuestado)
      : 0

    return {
      mes:            monthLabel(key),
      monthKey:       key,
      Ingresos:       ingresos,
      Fijos:          totalFijos,
      Presupuestado:  presupuestado,
      Libre:          libre,
      deficit,
      raw:            ingresos - totalFijos - presupuestado,
    }
  }), [monthKeys, incomes, budgets, baseIngresos, totalFijos, currentMonth])

  return (
    <div className="space-y-6">
      {/* Resumen del mes seleccionado */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección planificada — base {monthLabel(currentMonth)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Ingresos esperados</span>
            <span className="font-semibold text-green-400">{formatCurrency(baseIngresos)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-sm text-muted-foreground">− Gastos fijos (recurrentes)</span>
            <span className="font-medium text-destructive">−{formatCurrency(totalFijos)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-sm text-muted-foreground">− Presupuesto planificado</span>
            <span className="font-medium text-yellow-400">
              −{formatCurrency(budgets.filter((b) => b.month === currentMonth).reduce((s, b) => s + b.amount, 0))}
            </span>
          </div>
          {(() => {
            const planBudgets = budgets.filter((b) => b.month === currentMonth).reduce((s, b) => s + b.amount, 0)
            const libre = baseIngresos - totalFijos - planBudgets
            return (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold">= Disponible proyectado</span>
                  <span className={`text-xl font-bold ${libre >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(libre)}
                  </span>
                </div>
                {libre < 0 && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded p-2">
                    ⚠️ Tu presupuesto planificado supera tus ingresos. Ajustá los presupuestos por categoría.
                  </p>
                )}
              </>
            )
          })()}
        </CardContent>
      </Card>

      {/* Gráfico de barras apiladas — 6 meses */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución proyectada — próximos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Fijos + Presupuestado + Disponible libre, usando los presupuestos cargados por categoría.
            Los meses sin presupuesto usan los del mes actual como referencia.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 28, right: 16, left: 8, bottom: 4 }}>
              <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
              <Bar dataKey="Fijos"         stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Presupuestado" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Libre"         stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                <LabelList
                  content={makeEventPinContent(chartData, pendingByMonth, handlePinEnter, handlePinLeave)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Tooltip flotante para los pins */}
          {pinTooltip && (() => {
            const events = pendingByMonth.get(pinTooltip.monthKey) ?? []
            return (
              <div
                style={{ position: 'fixed', top: pinTooltip.y - 8, left: pinTooltip.x + 12, zIndex: 50 }}
                className="bg-card border border-border rounded-lg shadow-xl p-3 min-w-[200px] max-w-[260px] pointer-events-none"
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {events.length} evento{events.length > 1 ? 's' : ''} pendiente{events.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-1.5">
                  {events.map((occ) => (
                    <div key={`${occ.event_id}:${occ.date}`} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground truncate">{occ.title}</span>
                      <span className="text-xs font-medium text-amber-400 shrink-0">
                        ${occ.estimated_amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Eventos próximos */}
      {pendingOccurrences.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
              Eventos próximos ({pendingOccurrences.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              {pendingOccurrences.map((occ) => {
                const cat = categoryMap[occ.category]
                return (
                  <div
                    key={`${occ.event_id}:${occ.date}`}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground shrink-0 w-14">{formatDate(occ.date)}</span>
                      <span className="text-sm truncate">{occ.title}</span>
                      {cat && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded shrink-0 font-medium"
                          style={{ background: cat.color + '30', color: cat.color }}
                        >
                          {cat.icon} {cat.label}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-amber-400 shrink-0">
                      {formatCurrency(occ.estimated_amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <th className="py-2 text-right text-yellow-400">Presupuestado</th>
                  <th className="py-2 text-right text-primary">Libre</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.monthKey} className="border-b border-border/50">
                    <td className="py-2 font-medium">{row.mes}</td>
                    <td className="py-2 text-right text-green-400">{formatCurrency(row.Ingresos)}</td>
                    <td className="py-2 text-right text-destructive">−{formatCurrency(row.Fijos)}</td>
                    <td className="py-2 text-right text-yellow-400">−{formatCurrency(row.Presupuestado)}</td>
                    <td className={`py-2 text-right font-semibold ${row.raw >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(row.raw)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
