import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useRecurring } from '@/hooks/useRecurring'
import { useCategories } from '@/context/CategoriesContext'
import { NewCategoryInline } from '@/components/app/NewCategoryInline'
import { IpcAlertBanner } from '@/components/app/IpcAlertBanner'
import type { Recurring } from '@/types'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

function formatMonth(dateStr: string) {
  const [year, month] = dateStr.split('-')
  return `${month}/${year}`
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        value ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-[18px]' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  description:      '',
  category:         'servicios',
  amount:           '',   // used when !is_shared
  day_of_month:     '',
  is_shared:        false,
  total_amount:     '',   // used when is_shared
  shared_ratio:     50,   // percentage 1–100
  has_ipc:          false,
  update_frequency: 6,
}

type FormState = typeof EMPTY_FORM

function recurringToForm(item: Recurring): FormState {
  return {
    description:      item.description,
    category:         item.category,
    amount:           item.is_shared ? '' : String(item.amount),
    day_of_month:     String(item.day_of_month),
    is_shared:        item.is_shared,
    total_amount:     item.total_amount != null ? String(item.total_amount) : '',
    shared_ratio:     Math.round(item.shared_ratio * 100),
    has_ipc:          item.update_type === 'ipc',
    update_frequency: item.update_frequency ?? 6,
  }
}

function formToPayload(values: FormState): Omit<Recurring, 'id' | 'user_id'> {
  const isShared  = values.is_shared
  const totalAmt  = isShared ? parseFloat(values.total_amount) : null
  const ratio     = isShared ? values.shared_ratio / 100 : 1
  const amount    = isShared ? (totalAmt! * ratio) : parseFloat(values.amount)
  const hasIpc    = values.has_ipc

  let nextUpdateDate: string | null = null
  if (hasIpc) {
    const d = new Date()
    d.setMonth(d.getMonth() + values.update_frequency)
    nextUpdateDate = d.toISOString().slice(0, 10)
  }

  return {
    description:      values.description,
    category:         values.category,
    amount,
    day_of_month:     parseInt(values.day_of_month, 10),
    is_shared:        isShared,
    shared_ratio:     ratio,
    total_amount:     totalAmt,
    update_type:      hasIpc ? 'ipc' : 'none',
    update_frequency: hasIpc ? values.update_frequency : null,
    last_updated:     null,
    next_update_date: nextUpdateDate,
  }
}

// ─── Recurring expense form ───────────────────────────────────────────────────

function RecurringForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: FormState
  onSave: (values: FormState) => void
  onCancel: () => void
}) {
  const { categories } = useCategories()
  const [form, setForm]           = useState<FormState>(initial ?? EMPTY_FORM)
  const [showNewCat, setShowNewCat] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const handleCategoryCreated = (newId: string) => {
    setForm((f) => ({ ...f, category: newId }))
    setShowNewCat(false)
  }

  const myPart =
    form.is_shared && form.total_amount && parseFloat(form.total_amount) > 0
      ? parseFloat(form.total_amount) * (form.shared_ratio / 100)
      : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Input
            id="description"
            placeholder="Ej: Netflix"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        {!form.is_shared && (
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto mensual</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="day">Día del mes en que se debita</Label>
        <Input
          id="day"
          type="number"
          min={1}
          max={31}
          placeholder="1 – 31"
          value={form.day_of_month}
          onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
          required
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Categoría</Label>
          {!showNewCat && (
            <button
              type="button"
              onClick={() => setShowNewCat(true)}
              className="text-xs text-primary hover:underline"
            >
              + Nueva categoría
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setForm({ ...form, category: cat.id })}
              className={`flex items-center gap-2 rounded-md border p-2 text-sm transition-colors ${
                form.category === cat.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>

        {showNewCat && (
          <NewCategoryInline
            onCreated={handleCategoryCreated}
            onCancel={() => setShowNewCat(false)}
          />
        )}
      </div>

      {/* Shared section */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">¿Es un gasto compartido?</Label>
          <Toggle
            value={form.is_shared}
            onChange={(v) => setForm({ ...form, is_shared: v, amount: v ? '' : form.amount })}
          />
        </div>

        {form.is_shared && (
          <div className="space-y-3 pt-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="total_amount">Monto total</Label>
                <Input
                  id="total_amount"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shared_ratio">Mi porcentaje (%)</Label>
                <Input
                  id="shared_ratio"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={form.shared_ratio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      shared_ratio: Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 50)),
                    })
                  }
                />
              </div>
            </div>

            {myPart !== null && (
              <p className="text-sm font-medium text-primary">
                Tu parte: {formatCurrency(myPart)}
              </p>
            )}

          </div>
        )}
      </div>

      {/* IPC section — independent of shared */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">¿Se actualiza por IPC?</Label>
          <Toggle
            value={form.has_ipc}
            onChange={(v) => setForm({ ...form, has_ipc: v })}
          />
        </div>

        {form.has_ipc && (
          <div className="space-y-1.5">
            <Label htmlFor="update_frequency">Frecuencia de actualización</Label>
            <select
              id="update_frequency"
              value={form.update_frequency}
              onChange={(e) =>
                setForm({ ...form, update_frequency: parseInt(e.target.value, 10) })
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[1, 2, 3, 6, 12].map((n) => (
                <option key={n} value={n}>
                  Cada {n} {n === 1 ? 'mes' : 'meses'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecurringScreen() {
  const { data: recurring, add, update, remove } = useRecurring()
  const { categoryMap } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Recurring | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const sorted = useMemo(
    () => [...recurring].sort((a, b) => b.amount - a.amount),
    [recurring],
  )

  const totalMensual = useMemo(
    () => recurring.reduce((sum, r) => sum + r.amount, 0),
    [recurring],
  )

  const handleAdd = (values: FormState) => {
    add(formToPayload(values))
    setShowForm(false)
  }

  const handleEdit = (values: FormState) => {
    if (!editing) return
    update(editing.id, formToPayload(values))
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      {/* IPC alert banner */}
      <IpcAlertBanner />

      {/* KPI */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total mensual fijo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalMensual)}</p>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gastos recurrentes</CardTitle>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm font-medium mb-2">Nuevo gasto recurrente</p>
              <RecurringForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {sorted.map((item) => {
            const cat      = categoryMap[item.category]
            const isEditing = editing?.id === item.id
            const isOverdue =
              item.update_type === 'ipc' &&
              item.next_update_date != null &&
              item.next_update_date <= today

            if (isEditing) {
              return (
                <div key={item.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Editando: {item.description}</p>
                  <RecurringForm
                    initial={recurringToForm(item)}
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">
                    {cat?.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium">{item.description}</p>
                      {item.is_shared && (
                        <Badge variant="secondary" className="text-xs">
                          Compartido · {Math.round(item.shared_ratio * 100)}%
                        </Badge>
                      )}
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          ⚠ Actualizar
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cat?.label} · Día {item.day_of_month} de cada mes
                      {item.update_type === 'ipc' && item.next_update_date && !isOverdue && (
                        <span className="ml-1">
                          · Próx. actualización: {formatMonth(item.next_update_date)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    {item.is_shared && item.total_amount != null && (
                      <p className="text-xs text-muted-foreground">
                        de {formatCurrency(item.total_amount)}
                      </p>
                    )}
                  </div>
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

          {sorted.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">
              Sin gastos recurrentes. Agregá uno con el botón de arriba.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
