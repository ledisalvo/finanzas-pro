import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRecurring } from '@/hooks/useRecurring'
import { useCategories } from '@/context/CategoriesContext'
import { NewCategoryInline } from '@/components/app/NewCategoryInline'
import type { Recurring } from '@/types'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

const EMPTY_FORM = {
  description:  '',
  category:     'servicios',
  amount:       '',
  day_of_month: '',
}

type FormState = typeof EMPTY_FORM


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
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM)
  const [showNewCat, setShowNewCat] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const handleCategoryCreated = (newId: string) => {
    setForm((f) => ({ ...f, category: newId }))
    setShowNewCat(false)
  }

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

export default function Recurring() {
  const { data: recurring, add, update, remove } = useRecurring()
  const { categoryMap } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Recurring | null>(null)

  const sorted = useMemo(
    () => [...recurring].sort((a, b) => a.day_of_month - b.day_of_month),
    [recurring],
  )

  const totalMensual = useMemo(
    () => recurring.reduce((sum, r) => sum + r.amount, 0),
    [recurring],
  )

  const handleAdd = (values: FormState) => {
    add({
      description:  values.description,
      category:     values.category,
      amount:       parseFloat(values.amount),
      day_of_month: parseInt(values.day_of_month, 10),
    })
    setShowForm(false)
  }

  const handleEdit = (values: FormState) => {
    if (!editing) return
    update(editing.id, {
      description:  values.description,
      category:     values.category,
      amount:       parseFloat(values.amount),
      day_of_month: parseInt(values.day_of_month, 10),
    })
    setEditing(null)
  }

  return (
    <div className="space-y-6">
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
            const cat = categoryMap[item.category]
            const isEditing = editing?.id === item.id

            if (isEditing) {
              return (
                <div key={item.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Editando: {item.description}</p>
                  <RecurringForm
                    initial={{
                      description:  item.description,
                      category:     item.category,
                      amount:       String(item.amount),
                      day_of_month: String(item.day_of_month),
                    }}
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
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.label} · Día {item.day_of_month} de cada mes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(item.amount)}</p>
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
