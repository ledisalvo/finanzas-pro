import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { useGoals } from '@/hooks/useGoals'
import type { BudgetGoal } from '@/types'

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#ef4444',
  '#eab308', '#22c55e', '#ec4899', '#14b8a6',
]

const EMPTY_FORM = {
  name: '', icon: '', color: PRESET_COLORS[0],
  monthly_amount: '', has_target: false,
  target_amount: '', current_amount: '',
}
type FormState = typeof EMPTY_FORM

function GoalForm({ initial, onSave, onCancel }: { initial?: FormState; onSave: (v: FormState) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4 pt-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre del objetivo</Label>
          <Input placeholder="Ej: Vacaciones" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
            <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }} />
          ))}
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" title="Color personalizado" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Aporte mensual</Label>
          <Input type="number" min={0} step={0.01} placeholder="0.00" value={form.monthly_amount}
            onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Acumulado actual</Label>
          <Input type="number" min={0} step={0.01} placeholder="0.00" value={form.current_amount}
            onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input id="has-target" type="checkbox" checked={form.has_target}
            onChange={(e) => setForm({ ...form, has_target: e.target.checked, target_amount: '' })}
            className="h-4 w-4 rounded border-border" />
          <Label htmlFor="has-target">Tiene meta de monto total</Label>
        </div>
        {form.has_target && (
          <Input type="number" min={0} step={0.01} placeholder="Monto meta total"
            value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <span className="text-lg">{form.icon || '?'}</span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${form.color}25`, color: form.color }}>
          {form.name || 'Vista previa'}
        </span>
        {form.monthly_amount && <span className="text-xs text-muted-foreground ml-auto">{formatCurrency(parseFloat(form.monthly_amount) || 0)}/mes</span>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

export default function Goals() {
  const { data: goals, add, update, remove } = useGoals()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BudgetGoal | null>(null)

  const handleAdd = (v: FormState) => {
    add({
      name: v.name, icon: v.icon, color: v.color,
      monthly_amount: parseFloat(v.monthly_amount),
      target_amount: v.has_target && v.target_amount ? parseFloat(v.target_amount) : null,
      current_amount: parseFloat(v.current_amount) || 0,
    })
    setShowForm(false)
  }

  const handleEdit = (v: FormState) => {
    if (!editing) return
    update(editing.id, {
      name: v.name, icon: v.icon, color: v.color,
      monthly_amount: parseFloat(v.monthly_amount),
      target_amount: v.has_target && v.target_amount ? parseFloat(v.target_amount) : null,
      current_amount: parseFloat(v.current_amount) || 0,
    })
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Objetivos de ahorro</CardTitle>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>+ Nuevo objetivo</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-2">
              <p className="text-sm font-medium mb-2">Nuevo objetivo</p>
              <GoalForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {goals.map((goal) => {
            const pct = goal.target_amount ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : null
            const monthsLeft = goal.target_amount && goal.monthly_amount > 0
              ? Math.ceil((goal.target_amount - goal.current_amount) / goal.monthly_amount)
              : null

            if (editing?.id === goal.id) {
              return (
                <div key={goal.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Editando: {goal.name}</p>
                  <GoalForm
                    initial={{
                      name: goal.name, icon: goal.icon, color: goal.color,
                      monthly_amount: String(goal.monthly_amount),
                      has_target: goal.target_amount !== null,
                      target_amount: goal.target_amount != null ? String(goal.target_amount) : '',
                      current_amount: String(goal.current_amount),
                    }}
                    onSave={handleEdit}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )
            }

            return (
              <div key={goal.id} className="rounded-lg border border-border bg-card p-4 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{goal.icon}</span>
                    <p className="font-medium">{goal.name}</p>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                      {formatCurrency(goal.monthly_amount)}/mes
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(goal); setShowForm(false) }} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Editar</button>
                    <button onClick={() => remove(goal.id)} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors">Eliminar</button>
                  </div>
                </div>

                {goal.target_amount !== null && pct !== null ? (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatCurrency(goal.current_amount)} ahorrado</span>
                      <span>Meta: {formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs font-medium" style={{ color: goal.color }}>{pct}% alcanzado</span>
                      {monthsLeft !== null && monthsLeft > 0 && (
                        <span className="text-xs text-muted-foreground">~{monthsLeft} meses para la meta</span>
                      )}
                      {monthsLeft !== null && monthsLeft <= 0 && (
                        <span className="text-xs text-green-400 font-medium">¡Meta alcanzada!</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Acumulado: {formatCurrency(goal.current_amount)} · Sin meta fija
                  </p>
                )}
              </div>
            )
          })}

          {goals.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">Sin objetivos. Creá uno con el botón de arriba.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
