import { useState } from 'react'
import { useRecurring } from '@/hooks/useRecurring'
import { Button } from '@/components/ui/button'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

function formatMonth(dateStr: string) {
  const [year, month] = dateStr.split('-')
  return `${month}/${year}`
}

function IpcUpdateModal({
  item,
  onClose,
}: {
  item: Pick<import('@/types').Recurring, 'id' | 'description' | 'amount' | 'total_amount' | 'shared_ratio' | 'update_frequency' | 'is_shared'>
  onClose: () => void
}) {
  const { applyIpcUpdate } = useRecurring()
  const [ipc, setIpc]       = useState('')
  const [saving, setSaving] = useState(false)

  const ipcValue   = parseFloat(ipc) || 0
  const baseAmount = item.is_shared ? (item.total_amount ?? 0) : item.amount
  const newBase    = baseAmount * (1 + ipcValue / 100)
  const newPart    = item.is_shared ? newBase * item.shared_ratio : newBase

  const handleConfirm = async () => {
    if (ipcValue <= 0) return
    setSaving(true)
    await applyIpcUpdate(item.id, ipcValue)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl mx-4">
        <h2 className="text-base font-semibold mb-4">
          Actualizar {item.description} por IPC
        </h2>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {item.is_shared ? 'Monto total actual' : 'Monto actual'}
            </span>
            <span className="font-medium">{formatCurrency(baseAmount)}</span>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              IPC acumulado de los últimos {item.update_frequency} meses (%)
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="Ej: 8.4"
              value={ipc}
              onChange={(e) => setIpc(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          {ipcValue > 0 && (
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
              {item.is_shared && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nuevo monto total</span>
                  <span className="font-semibold text-primary">{formatCurrency(newBase)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.is_shared ? 'Tu nueva parte' : 'Nuevo monto'}
                </span>
                <span className="font-semibold text-primary">{formatCurrency(newPart)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={saving || ipcValue <= 0}>
            {saving ? 'Guardando…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function IpcAlertBanner() {
  const { overdueItems } = useRecurring()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (overdueItems.length === 0) return null

  const selected = overdueItems.find((r) => r.id === selectedId) ?? null

  return (
    <>
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
        <p className="text-sm font-medium text-destructive">
          ⚠ {overdueItems.length} gasto{overdueItems.length !== 1 ? 's requieren' : ' requiere'} actualización por IPC
        </p>
        <div className="space-y-1.5">
          {overdueItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm">
                {item.description}
                <span className="text-xs text-muted-foreground ml-1.5">
                  (vencido {formatMonth(item.next_update_date!)})
                </span>
              </span>
              <Button size="sm" variant="destructive" onClick={() => setSelectedId(item.id)}>
                Actualizar
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <IpcUpdateModal
          item={selected}
          onClose={() => setSelectedId(null)}
        />
      )}

    </>
  )
}
