import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { useGoals } from '@/hooks/useGoals'
import { useExpenses } from '@/hooks/useExpenses'
import type { BudgetGoal } from '@/types'

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#ef4444',
  '#eab308', '#22c55e', '#ec4899', '#14b8a6',
]

// ─── Form ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', icon: '', color: PRESET_COLORS[0],
  has_target: false, target_amount: '',
}
type FormState = typeof EMPTY_FORM

function GoalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: FormState
  onSave: (v: FormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4 pt-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre del objetivo</Label>
          <Input
            placeholder="Ej: Vacaciones"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Emoji</Label>
          <EmojiPicker value={form.icon} onChange={(emoji) => setForm({ ...form, icon: emoji })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            title="Color personalizado"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="has-target"
            type="checkbox"
            checked={form.has_target}
            onChange={(e) => setForm({ ...form, has_target: e.target.checked, target_amount: '' })}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="has-target">Tiene meta de monto total</Label>
        </div>
        {form.has_target && (
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="Monto meta total"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            required
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Goals() {
  const { data: goals, add, update, remove } = useGoals()
  const { data: expenses }                   = useExpenses()
  const [showForm, setShowForm]              = useState(false)
  const [editing, setEditing]                = useState<BudgetGoal | null>(null)
  const [expandedId, setExpandedId]          = useState<string | null>(null)

  const totalAhorrado = useMemo(
    () => goals.reduce((sum, g) => sum + g.current_amount, 0),
    [goals],
  )

  const contributionsFor = (goalId: string) =>
    expenses.filter((e) => e.goal_id === goalId).sort((a, b) => b.date.localeCompare(a.date))

  const canDelete = (goalId: string) => !expenses.some((e) => e.goal_id === goalId)

  const handleAdd = (v: FormState) => {
    add({
      name:           v.name,
      icon:           v.icon,
      color:          v.color,
      monthly_amount: 0,
      target_amount:  v.has_target && v.target_amount ? parseFloat(v.target_amount) : null,
      current_amount: 0,
    })
    setShowForm(false)
  }

  const handleEdit = (v: FormState) => {
    if (!editing) return
    update(editing.id, {
      name:          v.name,
      icon:          v.icon,
      color:         v.color,
      target_amount: v.has_target && v.target_amount ? parseFloat(v.target_amount) : null,
    })
    setEditing(null)
  }

  return (
    <div className="space-y-6">

      {/* Goal progress cards */}
      {goals.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const pct = goal.target_amount
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                : null

              return (
                <Card
                  key={goal.id}
                  className="overflow-hidden"
                  style={{ borderLeft: `4px solid ${goal.color}` }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{goal.icon}</span>
                      {goal.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: goal.color }}>
                        {formatCurrency(goal.current_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {goal.target_amount
                          ? `ahorrado de ${formatCurrency(goal.target_amount)}`
                          : 'ahorrado · sin meta fija'}
                      </p>
                    </div>
                    {pct !== null && (
                      <>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: goal.color }}
                          />
                        </div>
                        <p className="text-xs font-medium" style={{ color: goal.color }}>
                          {pct}% alcanzado
                          {pct >= 100 && ' · ¡Meta alcanzada!'}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* KPI total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total ahorrado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalAhorrado)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {goals.length} objetivo{goals.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* All goals list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Objetivos de ahorro</CardTitle>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>+ Nuevo objetivo</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1">

          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm font-medium mb-2">Nuevo objetivo</p>
              <GoalForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {goals.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">
              Sin objetivos. Creá uno con el botón de arriba.
            </p>
          )}

          {goals.map((goal) => {
            const isEditing      = editing?.id === goal.id
            const contributions  = contributionsFor(goal.id)
            const isExpanded     = expandedId === goal.id

            if (isEditing) {
              return (
                <div key={goal.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Editando: {goal.name}</p>
                  <GoalForm
                    initial={{
                      name:          goal.name,
                      icon:          goal.icon,
                      color:         goal.color,
                      has_target:    goal.target_amount !== null,
                      target_amount: goal.target_amount != null ? String(goal.target_amount) : '',
                    }}
                    onSave={handleEdit}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )
            }

            return (
              <div key={goal.id}>
                <div className="flex items-start justify-between rounded-md px-2 py-3 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-1 text-base"
                      style={{ filter: `drop-shadow(0 0 4px ${goal.color}80)` }}
                    >
                      {goal.icon}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ahorrado: {formatCurrency(goal.current_amount)}
                        {goal.target_amount && ` · Meta: ${formatCurrency(goal.target_amount)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {contributions.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {isExpanded ? 'Ocultar' : `${contributions.length} aporte${contributions.length !== 1 ? 's' : ''}`}
                      </button>
                    )}
                    <button
                      onClick={() => { setEditing(goal); setShowForm(false) }}
                      className="rounded px-2 py-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      Editar
                    </button>
                    {canDelete(goal.id) && (
                      <button
                        onClick={() => remove(goal.id)}
                        className="rounded px-2 py-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                {/* Contribution history */}
                {isExpanded && (
                  <div className="mx-2 mb-2 rounded-md bg-muted/30 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Aportes registrados</p>
                    {contributions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(c.date)}
                          </span>
                          <span>{c.description}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(c.amount)}</span>
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
