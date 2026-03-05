import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpenses } from '@/hooks/useExpenses'
import { useCategories } from '@/context/CategoriesContext'
import { NewCategoryInline } from '@/components/app/NewCategoryInline'
import type { Expense } from '@/types'

interface ExpenseFormProps {
  initial?: Expense
  onClose?: () => void
}

export default function ExpenseForm({ initial, onClose }: ExpenseFormProps) {
  const { add, update } = useExpenses()
  const { categories } = useCategories()

  const [form, setForm] = useState({
    date:        initial?.date        ?? new Date().toISOString().slice(0, 10),
    category:    initial?.category    ?? categories[0]?.id ?? '',
    description: initial?.description ?? '',
    amount:      initial?.amount      != null ? String(initial.amount) : '',
    recurring:   initial?.recurring   ?? false,
  })

  const [showNewCat, setShowNewCat] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      date:        form.date,
      category:    form.category,
      description: form.description,
      amount:      parseFloat(form.amount),
      recurring:   form.recurring,
    }
    if (initial) {
      update(initial.id, payload)
    } else {
      add(payload)
    }
    onClose?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Monto</Label>
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
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          placeholder="Ej: Almuerzo trabajo"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            onCreated={(newId) => { setForm((f) => ({ ...f, category: newId })); setShowNewCat(false) }}
            onCancel={() => setShowNewCat(false)}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="recurring"
          type="checkbox"
          checked={form.recurring}
          onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="recurring">Gasto recurrente</Label>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button type="submit">{initial ? 'Guardar cambios' : 'Agregar gasto'}</Button>
      </div>
    </form>
  )
}
