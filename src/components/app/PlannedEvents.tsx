import { useMemo, useState } from 'react'
import { Calendar, Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { usePlannedEvents } from '@/hooks/usePlannedEvents'
import { useExpenses } from '@/hooks/useExpenses'
import { useCategories } from '@/context/CategoriesContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PlannedEvent, PlannedEventOccurrence, Expense } from '@/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatMonthHeader(ym: string) {
  const [year, month] = ym.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ─── OccurrenceRow ─────────────────────────────────────────────────────────────

interface OccurrenceRowProps {
  occ:              PlannedEventOccurrence
  expense:          Expense | null
  onEdit:           () => void
  onDelete:         () => void
  onRegister:       () => void
  onViewExpense:    () => void
  categoryMap:      Record<string, { label: string; color: string; icon: string }>
}

function OccurrenceRow({
  occ, expense, onEdit, onDelete, onRegister, onViewExpense, categoryMap,
}: OccurrenceRowProps) {
  const cat = categoryMap[occ.category]
  const isComputed = Boolean(occ.instance?.expense_id)
  const delta = expense ? expense.amount - occ.estimated_amount : 0

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">

      {/* Estado icon */}
      <div className="mt-0.5 shrink-0">
        {isComputed
          ? <CheckCircle2 size={16} className="text-green-500" />
          : <Clock size={16} className="text-muted-foreground" />
        }
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{occ.title}</span>
          {cat && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: cat.color + '30', color: cat.color }}
            >
              {cat.icon} {cat.label}
            </span>
          )}
          {occ.is_recurring && (
            <Badge variant="outline" className="text-xs py-0 h-5">Recurrente</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{formatDate(occ.date)}</p>

        {isComputed && expense ? (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
            <span className="text-muted-foreground">
              Estimado <span className="text-foreground font-medium">{fmt(occ.estimated_amount)}</span>
            </span>
            <span className="text-muted-foreground">
              Real <span className="text-foreground font-medium">{fmt(expense.amount)}</span>
            </span>
            <span className={delta <= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
              {delta <= 0 ? '−' : '+'}{fmt(Math.abs(delta))}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-foreground">
            <span className="font-medium">{fmt(occ.estimated_amount)}</span> estimado
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="shrink-0 flex items-center gap-1">
        {isComputed ? (
          <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={onViewExpense}>
            Ver gasto
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={onRegister}>
            Registrar gasto
          </Button>
        )}
        <button
          onClick={onEdit}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Editar template"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Eliminar template"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── DeleteConfirmDialog ───────────────────────────────────────────────────────

interface DeleteConfirmProps {
  event:         PlannedEvent
  computedCount: number
  onConfirm:     () => void
  onCancel:      () => void
}

function DeleteConfirmDialog({ event, computedCount, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle size={18} className="text-amber-500" />
            Eliminar evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {computedCount > 0 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-400">
              Este evento tiene <strong>{computedCount} gasto{computedCount > 1 ? 's' : ''} registrado{computedCount > 1 ? 's' : ''}</strong>.
              Al borrarlo, los gastos no se eliminarán pero perderás el historial de estimaciones.
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong className="text-foreground">"{event.title}"</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={onConfirm}>Eliminar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── PlannedEvents ─────────────────────────────────────────────────────────────

interface PlannedEventsProps {
  onNavigateToExpenses?: () => void
  onAddEvent?:           () => void                   // FEAT-007
  onEditEvent?:          (id: string) => void         // FEAT-007
  onRegisterExpense?:    (eventId: string, date: string, estimatedAmount: number, category: string, title: string) => void  // FEAT-008
}

export default function PlannedEvents({
  onNavigateToExpenses,
  onAddEvent,
  onEditEvent,
  onRegisterExpense,
}: PlannedEventsProps) {
  const { occurrences, instances, events, removeEvent, windowMonths, setWindowMonths } = usePlannedEvents()
  const { data: expenses } = useExpenses()
  const { categoryMap } = useCategories()

  const [deleteCandidate, setDeleteCandidate] = useState<PlannedEvent | null>(null)

  // Índice expense_id → Expense para enriquecer ocurrencias computadas
  const expenseById = useMemo(() => {
    const map = new Map<string, Expense>()
    for (const e of expenses) map.set(e.id, e)
    return map
  }, [expenses])

  // Ocurrencias agrupadas por mes (YYYY-MM)
  const byMonth = useMemo(() => {
    const groups: { ym: string; items: PlannedEventOccurrence[] }[] = []
    const seen = new Map<string, PlannedEventOccurrence[]>()
    for (const occ of occurrences) {
      const ym = occ.date.slice(0, 7)
      if (!seen.has(ym)) { seen.set(ym, []); groups.push({ ym, items: seen.get(ym)! }) }
      seen.get(ym)!.push(occ)
    }
    return groups
  }, [occurrences])

  // Total estimado pendiente (sin gasto vinculado)
  const totalPending = useMemo(
    () => occurrences.filter((o) => !o.instance?.expense_id).reduce((s, o) => s + o.estimated_amount, 0),
    [occurrences],
  )

  function getExpenseForOcc(occ: PlannedEventOccurrence): Expense | null {
    if (!occ.instance?.expense_id) return null
    return expenseById.get(occ.instance.expense_id) ?? null
  }

  function handleDeleteClick(eventId: string) {
    const event = events.find((e) => e.id === eventId)
    if (event) setDeleteCandidate(event)
  }

  function handleDeleteConfirm() {
    if (deleteCandidate) {
      removeEvent(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  const computedCountForCandidate = deleteCandidate
    ? instances.filter((i) => i.event_id === deleteCandidate.id && i.expense_id != null).length
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Eventos futuros
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalPending > 0
              ? `${fmt(totalPending)} estimado pendiente`
              : 'Sin gastos pendientes en la ventana'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de ventana */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Ventana:</span>
            {([6, 12, 24] as const).map((m) => (
              <button
                key={m}
                onClick={() => setWindowMonths(m)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  windowMonths === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent text-muted-foreground'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onAddEvent} className="gap-1" title="Disponible en próxima versión" disabled={!onAddEvent}>
            <Plus size={15} /> Nuevo evento
          </Button>
        </div>
      </div>

      {/* Lista por mes */}
      {byMonth.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay eventos en los próximos {windowMonths} meses.</p>
            <p className="text-xs mt-1">Creá un evento con el botón "Nuevo evento".</p>
          </CardContent>
        </Card>
      ) : (
        byMonth.map(({ ym, items }) => {
          const pendingTotal = items
            .filter((o) => !o.instance?.expense_id)
            .reduce((s, o) => s + o.estimated_amount, 0)

          return (
            <Card key={ym}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>{formatMonthHeader(ym)}</span>
                  {pendingTotal > 0 && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {fmt(pendingTotal)} pendiente
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {items.map((occ) => (
                  <OccurrenceRow
                    key={`${occ.event_id}:${occ.date}`}
                    occ={occ}
                    expense={getExpenseForOcc(occ)}
                    categoryMap={categoryMap}
                    onEdit={() => onEditEvent?.(occ.event_id)}
                    onDelete={() => handleDeleteClick(occ.event_id)}
                    onRegister={() => onRegisterExpense?.(occ.event_id, occ.date, occ.estimated_amount, occ.category, occ.title)}
                    onViewExpense={() => onNavigateToExpenses?.()}
                  />
                ))}
              </CardContent>
            </Card>
          )
        })
      )}

      {/* Delete confirmation */}
      {deleteCandidate && (
        <DeleteConfirmDialog
          event={deleteCandidate}
          computedCount={computedCountForCandidate}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteCandidate(null)}
        />
      )}
    </div>
  )
}
