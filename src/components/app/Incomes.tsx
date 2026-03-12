import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIncomes } from '@/hooks/useIncomes'
import { useMonth } from '@/context/MonthContext'
import type { Income } from '@/types'

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { description: '', amount: '', day_of_month: '', month: '' }
type FormState = typeof EMPTY_FORM

function IncomeForm({
  initial,
  defaultMonth,
  onSave,
  onCancel,
}: {
  initial?: FormState
  defaultMonth: string
  onSave: (v: FormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormState>(
    initial ?? { ...EMPTY_FORM, month: defaultMonth },
  )

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="inc-desc">Descripción</Label>
        <Input
          id="inc-desc"
          placeholder="Ej: Sueldo, Freelance, Aguinaldo"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inc-amount">Monto</Label>
          <Input
            id="inc-amount"
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inc-day">Día en que entra</Label>
          <Input
            id="inc-day"
            type="number"
            min={1}
            max={31}
            placeholder="1 – 31"
            value={form.day_of_month}
            onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inc-month">Mes</Label>
        <input
          id="inc-month"
          type="month"
          value={form.month}
          onChange={(e) => setForm({ ...form, month: e.target.value })}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Para aguinaldo u otros ingresos puntuales, cambiá el mes libremente.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Incomes() {
  const { data: incomes, add, update, remove } = useIncomes()
  const { month, label } = useMonth()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Income | null>(null)

  const monthIncomes = useMemo(
    () => incomes
      .filter((i) => i.month === month)
      .sort((a, b) => a.day_of_month - b.day_of_month),
    [incomes, month],
  )

  const totalMes = useMemo(
    () => monthIncomes.reduce((s, i) => s + i.amount, 0),
    [monthIncomes],
  )

  const handleAdd = (v: FormState) => {
    add({
      description:  v.description,
      amount:       parseFloat(v.amount),
      day_of_month: parseInt(v.day_of_month, 10),
      month:        v.month,
    })
    setShowForm(false)
  }

  const handleEdit = (v: FormState) => {
    if (!editing) return
    update(editing.id, {
      description:  v.description,
      amount:       parseFloat(v.amount),
      day_of_month: parseInt(v.day_of_month, 10),
      month:        v.month,
    })
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      {/* KPI — total del mes seleccionado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Total ingresos — {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalMes)}</p>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingresos de {label}</CardTitle>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>+ Agregar</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm font-medium mb-2">Nuevo ingreso</p>
              <IncomeForm
                defaultMonth={month}
                onSave={handleAdd}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {monthIncomes.map((item) => {
            if (editing?.id === item.id) {
              return (
                <div key={item.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Editando: {item.description}</p>
                  <IncomeForm
                    initial={{
                      description:  item.description,
                      amount:       String(item.amount),
                      day_of_month: String(item.day_of_month),
                      month:        item.month,
                    }}
                    defaultMonth={month}
                    onSave={handleEdit}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )
            }
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md px-2 py-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-400/10 text-lg">
                    💵
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">Día {item.day_of_month}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-green-400">{formatCurrency(item.amount)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(item); setShowForm(false) }}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {monthIncomes.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">
              Sin ingresos en {label}. Agregá uno con el botón de arriba.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
