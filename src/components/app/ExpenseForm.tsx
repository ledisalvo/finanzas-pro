import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpenses } from '@/hooks/useExpenses'
import { useDebts } from '@/hooks/useDebts'
import { useGoals } from '@/hooks/useGoals'
import { useCategories } from '@/context/CategoriesContext'
import { NewCategoryInline } from '@/components/app/NewCategoryInline'
import type { Expense } from '@/types'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

type ExpenseType = 'normal' | 'debt_payment' | 'savings'

interface ExpenseFormProps {
  initial?: Expense
  onClose?: () => void
}

export default function ExpenseForm({ initial, onClose }: ExpenseFormProps) {
  const { add, update }                       = useExpenses()
  const { data: debts, addPayment }           = useDebts()
  const { data: goals, addContribution }      = useGoals()
  const { categories }                        = useCategories()

  const initialExpenseType: ExpenseType =
    initial?.is_savings     ? 'savings'      :
    initial?.is_debt_payment ? 'debt_payment' : 'normal'

  const [form, setForm] = useState({
    date:         initial?.date        ?? new Date().toISOString().slice(0, 10),
    category:     initial?.category    ?? categories[0]?.id ?? '',
    description:  initial?.description ?? '',
    amount:       initial?.amount      != null ? String(initial.amount) : '',
    recurring:    initial?.recurring   ?? false,
    expense_type: initialExpenseType,
    debt_id:      initial?.debt_id     ?? '',
    goal_id:      initial?.goal_id     ?? '',
  })

  const [showNewCat, setShowNewCat] = useState(false)

  const activeDebts = useMemo(() => debts.filter((d) => d.status === 'active'), [debts])

  const handleTypeChange = (type: ExpenseType) => {
    setForm((f) => ({
      ...f,
      expense_type: type,
      debt_id: type === 'debt_payment' && activeDebts.length > 0 ? activeDebts[0].id : f.debt_id,
      goal_id: type === 'savings'      && goals.length > 0        ? goals[0].id        : f.goal_id,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isDebtPayment = form.expense_type === 'debt_payment'
    const isSavings     = form.expense_type === 'savings'
    const payload = {
      date:            form.date,
      category:        form.category,
      description:     form.description,
      amount:          parseFloat(form.amount),
      recurring:       form.recurring,
      is_debt_payment: isDebtPayment,
      debt_id:         isDebtPayment && form.debt_id ? form.debt_id : null,
      is_savings:      isSavings,
      goal_id:         isSavings && form.goal_id ? form.goal_id : null,
    }

    if (initial) {
      await update(initial.id, payload)

      // Si se asignó a una deuda que antes no tenía → actualizar paid_amount
      const wasDebtPayment = initial.is_debt_payment && !!initial.debt_id
      if (isDebtPayment && form.debt_id && !wasDebtPayment) {
        await addPayment(form.debt_id, parseFloat(form.amount))
      }

      // Si se asignó a un objetivo que antes no tenía → actualizar current_amount
      const wasSavings = initial.is_savings && !!initial.goal_id
      if (isSavings && form.goal_id && !wasSavings) {
        await addContribution(form.goal_id, parseFloat(form.amount))
      }
    } else {
      await add(payload)
      if (isDebtPayment && form.debt_id) {
        await addPayment(form.debt_id, parseFloat(form.amount))
      }
      if (isSavings && form.goal_id) {
        await addContribution(form.goal_id, parseFloat(form.amount))
      }
    }
    onClose?.()
  }

  const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
    { value: 'normal',       label: 'Gasto normal' },
    { value: 'debt_payment', label: 'Pago de deuda' },
    { value: 'savings',      label: 'Aporte a ahorro' },
  ]

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

      {/* Expense type selector */}
      <div className="space-y-2">
        <Label>Tipo de gasto</Label>
        <div className="grid grid-cols-3 gap-2">
          {EXPENSE_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={`rounded-md border p-2 text-xs transition-colors ${
                form.expense_type === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {form.expense_type === 'debt_payment' && (
          activeDebts.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="debt_id">Deuda</Label>
              <select
                id="debt_id"
                value={form.debt_id}
                onChange={(e) => setForm({ ...form, debt_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">Seleccioná una deuda…</option>
                {activeDebts.map((d) => {
                  const remaining = Math.max(0, d.total_amount - d.paid_amount)
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} — Restante: {formatCurrency(remaining)}
                    </option>
                  )
                })}
              </select>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No tenés deudas activas. Podés agregarlas en la pestaña Deudas.
            </p>
          )
        )}

        {form.expense_type === 'savings' && (
          goals.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="goal_id">Objetivo de ahorro</Label>
              <select
                id="goal_id"
                value={form.goal_id}
                onChange={(e) => setForm({ ...form, goal_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">Seleccioná un objetivo…</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.name} — Ahorrado: {formatCurrency(g.current_amount)}
                    {g.target_amount ? ` / ${formatCurrency(g.target_amount)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No tenés objetivos de ahorro. Podés agregarlos en la pestaña Objetivos.
            </p>
          )
        )}
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
