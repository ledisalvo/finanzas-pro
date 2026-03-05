import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCategories } from '@/context/CategoriesContext'
import type { Category } from '@/types'

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#ef4444',
  '#eab308', '#22c55e', '#ec4899', '#14b8a6',
]

const EMPTY_FORM = { label: '', icon: '', color: PRESET_COLORS[0] }
type FormState = typeof EMPTY_FORM

function CategoryForm({
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
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="space-y-4 pt-2"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cat-label">Nombre</Label>
          <Input
            id="cat-label"
            placeholder="Ej: Salud"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cat-icon">Emoji</Label>
          <Input
            id="cat-icon"
            placeholder="Ej: 🏥"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            required
          />
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
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? 'white' : 'transparent',
              }}
            />
          ))}
          {/* Custom color */}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            title="Color personalizado"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <span className="text-lg">{form.icon || '?'}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${form.color}25`, color: form.color }}
        >
          {form.label || 'Vista previa'}
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}

export default function Categories() {
  const { categories, add, update, remove } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const handleAdd = (values: FormState) => {
    add(values)
    setShowForm(false)
  }

  const handleEdit = (values: FormState) => {
    if (!editing) return
    update(editing.id, values)
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorías</CardTitle>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + Nueva categoría
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {/* New category form */}
          {showForm && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
              <p className="text-sm font-medium mb-1">Nueva categoría</p>
              <CategoryForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {categories.map((cat) => {
            const isEditing = editing?.id === cat.id

            if (isEditing) {
              return (
                <div key={cat.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-1">Editando: {cat.label}</p>
                  <CategoryForm
                    initial={{ label: cat.label, icon: cat.icon, color: cat.color }}
                    onSave={handleEdit}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )
            }

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{cat.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(cat); setShowForm(false) }}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(cat.id)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {categories.length === 0 && !showForm && (
            <p className="py-8 text-center text-muted-foreground">
              Sin categorías. Agregá una con el botón de arriba.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            El ID de cada categoría se genera automáticamente desde el nombre y no cambia al editar.
            Los gastos existentes mantienen su categoría aunque edites el nombre o el ícono.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
