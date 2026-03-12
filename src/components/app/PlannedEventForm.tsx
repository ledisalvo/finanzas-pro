import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePlannedEvents } from '@/hooks/usePlannedEvents'
import { useCategories } from '@/context/CategoriesContext'
import type { PlannedEvent } from '@/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** Máximo de días para un mes dado (usando año bisiesto para permitir feb-29). */
function maxDaysInMonth(month: number): number {
  // Año 2000 es bisiesto → feb tiene 29 días
  return new Date(2000, month, 0).getDate()
}

function isDayValid(day: number, month: number): boolean {
  return day >= 1 && day <= maxDaysInMonth(month)
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PlannedEventFormProps {
  initial?:  PlannedEvent
  onClose?:  () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PlannedEventForm({ initial, onClose }: PlannedEventFormProps) {
  const { addEvent, updateEvent } = usePlannedEvents()
  const { categories } = useCategories()

  const [form, setForm] = useState({
    title:            initial?.title            ?? '',
    month:            initial?.month            ?? new Date().getMonth() + 1,
    day:              initial?.day              ?? new Date().getDate(),
    estimated_amount: initial?.estimated_amount != null ? String(initial.estimated_amount) : '',
    category:         initial?.category         ?? categories[0]?.id ?? '',
    notes:            initial?.notes            ?? '',
    is_recurring:     initial?.is_recurring     ?? false,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [saving, setSaving] = useState(false)

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = 'El título es obligatorio.'
    const amount = parseFloat(form.estimated_amount)
    if (isNaN(amount) || amount < 0) errs.estimated_amount = 'El monto debe ser ≥ 0.'
    if (!isDayValid(form.day, form.month)) {
      errs.day = `El mes de ${MONTH_NAMES[form.month - 1]} no tiene el día ${form.day}.`
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleMonthChange = (month: number) => {
    const max = maxDaysInMonth(month)
    setForm((f) => ({ ...f, month, day: Math.min(f.day, max) }))
    setErrors((e) => ({ ...e, day: undefined }))
  }

  const handleDayChange = (raw: string) => {
    const day = parseInt(raw, 10)
    if (isNaN(day)) return
    setForm((f) => ({ ...f, day }))
    setErrors((e) => ({ ...e, day: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    const payload = {
      title:            form.title.trim(),
      month:            form.month,
      day:              form.day,
      estimated_amount: parseFloat(form.estimated_amount),
      category:         form.category,
      notes:            form.notes.trim() || null,
      is_recurring:     form.is_recurring,
    }

    if (initial) {
      await updateEvent(initial.id, payload)
    } else {
      await addEvent(payload)
    }

    setSaving(false)
    onClose?.()
  }

  const maxDay = maxDaysInMonth(form.month)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Título */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="Ej: Cumpleaños de Fulano"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors((err) => ({ ...err, title: undefined })) }}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Mes + Día */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="month">Mes</Label>
          <select
            id="month"
            value={form.month}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="day">Día</Label>
          <Input
            id="day"
            type="number"
            min={1}
            max={maxDay}
            value={form.day}
            onChange={(e) => handleDayChange(e.target.value)}
          />
          {errors.day && <p className="text-xs text-destructive">{errors.day}</p>}
        </div>
      </div>

      {/* Monto estimado */}
      <div className="space-y-1.5">
        <Label htmlFor="estimated_amount">Monto estimado</Label>
        <Input
          id="estimated_amount"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          value={form.estimated_amount}
          onChange={(e) => { setForm({ ...form, estimated_amount: e.target.value }); setErrors((err) => ({ ...err, estimated_amount: undefined })) }}
        />
        {errors.estimated_amount && <p className="text-xs text-destructive">{errors.estimated_amount}</p>}
        <p className="text-xs text-muted-foreground">Orientativo — podés registrar un monto diferente al crear el gasto real.</p>
      </div>

      {/* Categoría */}
      <div className="space-y-1.5">
        <Label>Categoría</Label>
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
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas <span className="text-muted-foreground">(opcional)</span></Label>
        <textarea
          id="notes"
          rows={2}
          placeholder="Ej: Regalo + cena"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* ¿Se repite cada año? */}
      <div className="flex items-center gap-2">
        <input
          id="is_recurring"
          type="checkbox"
          checked={form.is_recurring}
          onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="is_recurring">Se repite cada año</Label>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </form>
  )
}
