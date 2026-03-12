import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { useCategories } from '@/context/CategoriesContext'

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#ef4444',
  '#eab308', '#22c55e', '#ec4899', '#14b8a6',
]

interface NewCategoryInlineProps {
  onCreated: (newId: string) => void
  onCancel:  () => void
}

export function NewCategoryInline({ onCreated, onCancel }: NewCategoryInlineProps) {
  const { add } = useCategories()
  const [form, setForm] = useState({ label: '', icon: '', color: PRESET_COLORS[0], description: '' })

  const handleCreate = async () => {
    if (!form.label || !form.icon) return
    const newId = await add(form)
    onCreated(newId)
  }

  return (
    <div className="mt-3 rounded-md border border-primary/30 bg-muted/40 p-3 space-y-3">
      <p className="text-xs font-semibold text-primary">Nueva categoría</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nombre</Label>
          <Input
            placeholder="Ej: Salud"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Emoji</Label>
          <EmojiPicker
            value={form.icon}
            onChange={(emoji) => setForm({ ...form, icon: emoji })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripción <span className="text-muted-foreground">(opcional)</span></Label>
        <Input
          placeholder="Ej: Salud, farmacia, médico"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Color</Label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: form.color === c ? 'white' : 'transparent' }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
            title="Color personalizado"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button
          type="button"
          size="sm"
          disabled={!form.label || !form.icon}
          onClick={handleCreate}
        >
          Crear y seleccionar
        </Button>
      </div>
    </div>
  )
}
