import { useMemo, useState, useRef, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudgets } from '@/hooks/useBudgets'
import { useRecurring } from '@/hooks/useRecurring'
import { useIncomes } from '@/hooks/useIncomes'
import { useCategories } from '@/context/CategoriesContext'
import { useMonth } from '@/context/MonthContext'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

function EditableAmount({
  value,
  onSave,
}: {
  value: number
  onSave: (amount: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(String(value))
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing, value])

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n) && n >= 0) onSave(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        step={0.01}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className="w-28 rounded border border-primary bg-background px-2 py-0.5 text-right text-sm focus:outline-none"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Clic para editar"
      className="rounded px-1 py-0.5 text-right text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
    >
      {formatCurrency(value)}
      <span className="ml-1 text-xs opacity-40">✏</span>
    </button>
  )
}

export default function BudgetVsReal() {
  const { month }           = useMonth()
  const { data: expenses }  = useExpenses()
  const { data: budgets, upsert } = useBudgets()
  const { data: recurring } = useRecurring()
  const { data: incomes }   = useIncomes()
  const { categories }      = useCategories()
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  const totalIngresos = useMemo(
    () => incomes.filter((i) => i.month === month).reduce((s, i) => s + i.amount, 0),
    [incomes, month],
  )
  const totalFijos = useMemo(() => recurring.reduce((s, r) => s + r.amount, 0), [recurring])
  const totalEventuales = useMemo(
    () => expenses.filter((e) => e.date.startsWith(month) && !e.recurring).reduce((s, e) => s + e.amount, 0),
    [expenses, month],
  )
  const totalPresupuestado = useMemo(
    () => budgets.filter((b) => b.month === month).reduce((s, b) => s + b.amount, 0),
    [budgets, month],
  )
  const totalLibre = totalIngresos - totalFijos - totalPresupuestado

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(month)),
    [expenses, month],
  )

  const chartData = useMemo(() => {
    const spentMap: Record<string, number> = {}
    monthExpenses.forEach((e) => { spentMap[e.category] = (spentMap[e.category] ?? 0) + e.amount })

    return categories.filter((cat) => cat.track_budget !== false).map((cat) => {
      const budget      = budgets.find((b) => b.category === cat.id && b.month === month)
      const presupuesto = budget?.amount ?? 0
      const real        = spentMap[cat.id] ?? 0
      const catExpenses = monthExpenses.filter((e) => e.category === cat.id)
      return {
        name:        cat.label,
        catId:       cat.id,
        Presupuesto: presupuesto,
        Real:        real,
        color:       cat.color,
        expenses:    catExpenses,
      }
    })
  }, [monthExpenses, budgets, categories, month])

  return (
    <div className="space-y-6">
      {/* Balance real del mes */}
      <Card>
        <CardHeader>
          <CardTitle>Balance del mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ingresos</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(totalIngresos)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">− Fijos</p>
              <p className="text-lg font-bold text-destructive">−{formatCurrency(totalFijos)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">− Presupuestado</p>
              <p className="text-lg font-bold text-blue-400">−{formatCurrency(totalPresupuestado)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">= Sin asignar</p>
              <p className={`text-lg font-bold ${totalLibre === 0 ? 'text-green-400' : totalLibre < 0 ? 'text-destructive' : 'text-yellow-400'}`}>
                {formatCurrency(totalLibre)}
              </p>
            </div>
          </div>
          {totalLibre > 0 && (
            <p className="mt-3 text-xs text-yellow-400 bg-yellow-400/10 rounded p-2">
              Tenés {formatCurrency(totalLibre)} sin asignar. Sumalo a algún presupuesto de categoría para llegar a cero.
            </p>
          )}
          {totalLibre < 0 && (
            <p className="mt-3 text-xs text-destructive bg-destructive/10 rounded p-2">
              ⚠️ Los presupuestos superan tus ingresos en {formatCurrency(Math.abs(totalLibre))}. Revisá los montos.
            </p>
          )}
          {totalLibre === 0 && (
            <p className="mt-3 text-xs text-green-400 bg-green-400/10 rounded p-2">
              Todo tu ingreso está asignado. Presupuesto de base cero completo.
            </p>
          )}

          {/* Desvío real vs planificado — calculado desde chartData para coincidir con la tabla */}
          {(() => {
            const desvio = chartData.reduce((s, row) => s + row.Real - row.Presupuesto, 0)
            if (totalPresupuestado === 0) return null
            return (
              <div className={`mt-4 flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                desvio > 0 ? 'bg-destructive/10' : desvio < 0 ? 'bg-green-400/10' : 'bg-muted/40'
              }`}>
                <span className="text-muted-foreground">Gasto real vs presupuestado</span>
                <span className={`font-semibold ${desvio > 0 ? 'text-destructive' : desvio < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {desvio > 0
                    ? `+${formatCurrency(desvio)} sobre el plan`
                    : desvio < 0
                    ? `${formatCurrency(Math.abs(desvio))} bajo el plan`
                    : 'Exacto al plan'}
                </span>
              </div>
            )
          })()}
        </CardContent>
      </Card>

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
          <CardTitle className="flex items-center justify-between">
            <span>Detalle por categoría</span>
            <span className="text-xs font-normal text-muted-foreground">
              Clic en categoría para ver desglose · Clic en presupuesto para editarlo
            </span>
          </CardTitle>
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
                  <th className="py-2 text-right w-28">Uso</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => {
                  const diff       = row.Presupuesto - row.Real
                  const pct        = row.Presupuesto > 0 ? Math.round((row.Real / row.Presupuesto) * 100) : 0
                  const isExpanded = expandedCat === row.catId
                  const hasItems   = row.expenses.length > 0

                  return (
                    <>
                      <tr
                        key={row.catId}
                        onClick={() => hasItems && setExpandedCat(isExpanded ? null : row.catId)}
                        className={`border-b border-border/50 transition-colors ${hasItems ? 'cursor-pointer hover:bg-muted/40' : ''}`}
                      >
                        <td className="py-2 font-medium">
                          <span className="flex items-center gap-1.5">
                            {hasItems && (
                              <span className="text-muted-foreground text-xs">
                                {isExpanded ? '▾' : '▸'}
                              </span>
                            )}
                            {row.name}
                          </span>
                        </td>
                        <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <EditableAmount
                            value={row.Presupuesto}
                            onSave={(amount) => upsert(row.catId, amount, month)}
                          />
                        </td>
                        <td className="py-2 text-right">{formatCurrency(row.Real)}</td>
                        <td className={`py-2 text-right font-medium ${diff >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                        </td>
                        <td className="py-2 pl-4">
                          {row.Presupuesto > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-16">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct > 100 ? 'bg-destructive' : pct === 100 ? 'bg-slate-400' : pct >= 80 ? 'bg-yellow-400' : 'bg-green-400'
                                  }`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs w-8 text-right tabular-nums ${
                                pct > 100 ? 'text-destructive' : pct === 100 ? 'text-slate-400' : pct >= 80 ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {pct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Desglose acordeón */}
                      {isExpanded && (
                        <tr key={`${row.catId}-detail`} className="border-b border-border/50 bg-muted/20">
                          <td colSpan={5} className="py-2 px-4">
                            <div className="space-y-1">
                              {row.expenses.map((e) => (
                                <div key={e.id} className="flex items-center justify-between text-xs py-0.5">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="text-muted-foreground/60">{e.date.slice(8, 10)}</span>
                                    {e.description}
                                  </span>
                                  <span className="font-medium">{formatCurrency(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
