import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIncomes } from '@/hooks/useIncomes'
import type { Income } from '@/types'

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

const EMPTY_FORM = { description: '', amount: '', day_of_month: '' }
type FormState = typeof EMPTY_FORM

function IncomeForm({
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
      <div className="space-y-1.5">
        <Label htmlFor="inc-desc">Descripción</Label>
        <Input
          id="inc-desc"
          placeholder="Ej: Sueldo, Freelance"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inc-amount">Monto mensual</Label>
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

export default function Incomes() {
  const { data: incomes, add, update, remove } = useIncomes()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)

  const totalMensual = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes])

  const handleAdd = (v: FormState) => {
    add({ description: v.description, amount: parseFloat(v.amount), day_of_month: parseInt(v.day_of_month, 10) })
    setShowForm(false)
  }

  const handleEdit = (v: FormState) => {
    if (!editing) return
    update(editing.id, { description: v.description, amount: parseFloat(v.amount), day_of_month: parseInt(v.day_of_month, 10) })
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total ingresos mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalMensual)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fuentes de ingreso</CardTitle>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>+ Agregar</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm font-medium mb-2">Nueva fuente de ingreso</p>
              <IncomeForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {incomes.map((item) => {
            if (editing?.id === item.id) {
              return (
                <div key={item.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Editando: {item.description}</p>
                  <IncomeForm
                    initial={{ description: item.description, amount: String(item.amount), day_of_month: String(item.day_of_month) }}
                    onSave={handleEdit}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )
            }
            return (
              <div key={item.id} className="flex items-center justify-between rounded-md px-2 py-3 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-400/10 text-lg">💵</div>
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">Día {item.day_of_month} de cada mes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-green-400">{formatCurrency(item.amount)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(item); setShowForm(false) }} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Editar</button>
                    <button onClick={() => remove(item.id)} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            )
          })}

          {incomes.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">Sin fuentes de ingreso. Agregá una con el botón de arriba.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
