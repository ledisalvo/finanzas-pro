import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/types'

interface ExpenseFormProps {
  onClose?: () => void
}

export default function ExpenseForm({ onClose }: ExpenseFormProps) {
  const [form, setForm] = useState({
    date:        new Date().toISOString().slice(0, 10),
    category:    'comida',
    description: '',
    amount:      '',
    recurring:   false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: conectar a Supabase en la próxima sesión
    console.log('Nuevo gasto:', form)
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
        <Label>Categoría</Label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
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
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
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
        <Button type="submit">Guardar gasto</Button>
      </div>
    </form>
  )
}
