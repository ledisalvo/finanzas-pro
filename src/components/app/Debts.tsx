import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useDebts } from '@/hooks/useDebts'
import { useExpenses } from '@/hooks/useExpenses'
import type { DebtType } from '@/types'

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#ec4899', '#14b8a6',
]

// ─── New debt form ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:         '',
  color:        '#3b82f6',
  debt_type:    'installments' as DebtType,
  total_amount: '',
  installments: '',
}

type DebtFormState = typeof EMPTY_FORM

function DebtForm({ onSave, onCancel }: { onSave: (v: DebtFormState) => void; onCancel: () => void }) {
  const [form, setForm] = useState<DebtFormState>(EMPTY_FORM)

  const totalAmt       = parseFloat(form.total_amount) || 0
  const installCount   = parseInt(form.installments, 10) || 0
  const installPreview = form.debt_type === 'installments' && totalAmt > 0 && installCount > 0
    ? totalAmt / installCount
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Name + color */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="debt-name">Nombre</Label>
          <Input
            id="debt-name"
            placeholder="Ej: Tarjeta Visa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              title="Color personalizado"
            />
          </div>
        </div>
      </div>

      {/* Debt type */}
      <div className="space-y-1.5">
        <Label>Tipo de deuda</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['installments', 'open'] as DebtType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm({ ...form, debt_type: type, installments: '' })}
              className={`rounded-md border p-2.5 text-sm transition-colors ${
                form.debt_type === type
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {type === 'installments' ? 'Cuotas fijas' : 'Deuda abierta'}
            </button>
          ))}
        </div>
        {form.debt_type === 'open' && (
          <p className="text-xs text-muted-foreground">Sin cuotas definidas, pagás cuando podés.</p>
        )}
      </div>

      {/* Total amount */}
      <div className="space-y-1.5">
        <Label htmlFor="debt-total">Monto total</Label>
        <Input
          id="debt-total"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          value={form.total_amount}
          onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
          required
        />
      </div>

      {/* Installments — only for 'installments' type */}
      {form.debt_type === 'installments' && (
        <div className="space-y-1.5">
          <Label htmlFor="debt-installments">Cantidad de cuotas</Label>
          <Input
            id="debt-installments"
            type="number"
            min={1}
            step={1}
            placeholder="Ej: 12"
            value={form.installments}
            onChange={(e) => setForm({ ...form, installments: e.target.value })}
            required
          />
          {installPreview !== null && (
            <p className="text-xs text-muted-foreground">
              Cuota aprox: {formatCurrency(installPreview)}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Debts() {
  const { data: debts, add, remove } = useDebts()
  const { data: expenses }           = useExpenses()
  const [showForm, setShowForm]      = useState(false)
  const [expandedId, setExpandedId]  = useState<string | null>(null)

  const activeDebts = useMemo(() => debts.filter((d) => d.status === 'active'), [debts])

  const totalRemaining = useMemo(
    () => activeDebts.reduce((sum, d) => sum + Math.max(0, d.total_amount - d.paid_amount), 0),
    [activeDebts],
  )

  // ── Proyección de deuda mes a mes ────────────────────────────────────────────
  const projectionData = useMemo(() => {
    if (activeDebts.length === 0) return []

    // Cuántos meses necesitamos para cubrir la deuda más larga (máx 36)
    let maxMonths = 12
    activeDebts.forEach((d) => {
      if (d.debt_type === 'installments' && d.installment_amount && d.installment_amount > 0) {
        const remaining  = Math.max(0, d.total_amount - d.paid_amount)
        const monthsLeft = Math.ceil(remaining / d.installment_amount)
        maxMonths = Math.max(maxMonths, Math.min(monthsLeft, 36))
      }
    })

    const now = new Date()
    const points = []
    for (let i = 0; i <= maxMonths; i++) {
      const d     = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const label = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
      const point: Record<string, number | string> = { mes: label }
      let total = 0
      activeDebts.forEach((debt) => {
        const remaining = Math.max(0, debt.total_amount - debt.paid_amount)
        if (debt.debt_type === 'installments' && debt.installment_amount && debt.installment_amount > 0) {
          const projected = Math.max(0, remaining - i * debt.installment_amount)
          point[debt.id] = projected
          total += projected
        } else {
          // Deuda abierta: línea recta (sin cuotas definidas)
          point[debt.id] = remaining
          total += remaining
        }
      })
      point['__total__'] = total
      points.push(point)
    }
    return points
  }, [activeDebts])

  const paymentsFor = (debtId: string) =>
    expenses.filter((e) => e.debt_id === debtId).sort((a, b) => b.date.localeCompare(a.date))

  const canDelete = (debtId: string) => !expenses.some((e) => e.debt_id === debtId)

  const handleAdd = (values: DebtFormState) => {
    const totalAmt     = parseFloat(values.total_amount)
    const installments = values.debt_type === 'installments' && values.installments
      ? parseInt(values.installments, 10)
      : null
    add({
      name:               values.name,
      color:              values.color,
      debt_type:          values.debt_type,
      total_amount:       totalAmt,
      installments,
      installment_amount: installments ? totalAmt / installments : null,
      paid_amount:        0,
      status:             'active',
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">

      {/* Active debt progress cards */}
      {activeDebts.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeDebts.map((debt) => {
              const remaining       = Math.max(0, debt.total_amount - debt.paid_amount)
              const pct             = Math.min(100, Math.round((debt.paid_amount / debt.total_amount) * 100))
              const installmentsPaid =
                debt.debt_type === 'installments' && debt.installment_amount && debt.installment_amount > 0
                  ? Math.floor(debt.paid_amount / debt.installment_amount)
                  : null

              return (
                <Card
                  key={debt.id}
                  className="overflow-hidden"
                  style={{ borderLeft: `4px solid ${debt.color}` }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{debt.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: debt.color }}>
                        {formatCurrency(remaining)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        restante de {formatCurrency(debt.total_amount)}
                      </p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: debt.color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct}% pagado</span>
                      {installmentsPaid !== null && debt.installments != null
                        ? <span>{installmentsPaid} / {debt.installments} cuotas</span>
                        : <span>Deuda abierta · pagás cuando podés</span>
                      }
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Total debt summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Deuda total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalRemaining)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeDebts.length} deuda{activeDebts.length !== 1 ? 's' : ''} activa{activeDebts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Proyección */}
      {projectionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Proyección de deuda</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={projectionData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={56}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                {/* Línea por deuda */}
                {activeDebts.map((debt) => (
                  <Line
                    key={debt.id}
                    type="monotone"
                    dataKey={debt.id}
                    name={debt.name}
                    stroke={debt.color}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray={debt.debt_type === 'open' ? '5 5' : undefined}
                  />
                ))}
                {/* Línea de total */}
                {activeDebts.length > 1 && (
                  <Line
                    type="monotone"
                    dataKey="__total__"
                    name="Total"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={false}
                    strokeOpacity={0.4}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              Las deudas abiertas (sin cuotas) se muestran como línea punteada horizontal.
            </p>
          </CardContent>
        </Card>
      )}

      {/* All debts list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todas las deudas</CardTitle>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>+ Nueva deuda</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1">

          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm font-medium mb-2">Nueva deuda</p>
              <DebtForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {debts.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">
              Sin deudas registradas. Agregá una con el botón de arriba.
            </p>
          )}

          {debts.map((debt) => {
            const remaining       = Math.max(0, debt.total_amount - debt.paid_amount)
            const installmentsPaid =
              debt.debt_type === 'installments' && debt.installment_amount && debt.installment_amount > 0
                ? Math.floor(debt.paid_amount / debt.installment_amount)
                : null
            const isExpanded = expandedId === debt.id
            const payments   = paymentsFor(debt.id)

            return (
              <div key={debt.id}>
                <div
                  className={`flex items-start justify-between rounded-md px-2 py-3 hover:bg-muted/50 transition-colors group ${
                    debt.status === 'paid' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: debt.color }}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{debt.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {debt.debt_type === 'installments' ? 'Cuotas' : 'Abierta'}
                        </Badge>
                        {debt.status === 'paid' && (
                          <Badge variant="secondary" className="text-xs">✓ Saldada</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(debt.total_amount)}
                        {' · '}Pagado: {formatCurrency(debt.paid_amount)}
                        {' · '}Restante: {formatCurrency(remaining)}
                        {installmentsPaid !== null && debt.installments != null &&
                          ` · ${installmentsPaid}/${debt.installments} cuotas`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {payments.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {isExpanded ? 'Ocultar' : `${payments.length} pago${payments.length !== 1 ? 's' : ''}`}
                      </button>
                    )}
                    {canDelete(debt.id) && (
                      <button
                        onClick={() => remove(debt.id)}
                        className="rounded px-2 py-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment history */}
                {isExpanded && (
                  <div className="mx-2 mb-2 rounded-md bg-muted/30 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Pagos registrados</p>
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                          <span>{p.description}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
