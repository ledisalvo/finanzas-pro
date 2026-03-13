import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { PlannedEvent, PlannedEventInstance, PlannedEventOccurrence } from '@/types'

// ─── Context value ─────────────────────────────────────────────────────────────

interface PlannedEventsContextValue {
  events:       PlannedEvent[]
  instances:    PlannedEventInstance[]
  occurrences:  PlannedEventOccurrence[]  // enriquecidas, ordenadas por fecha, dentro de la ventana
  windowMonths: number
  setWindowMonths: (months: number) => void
  loading: boolean
  error:   Error | null
  // Templates CRUD
  addEvent:    (item: Omit<PlannedEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateEvent: (id: string, changes: Partial<Omit<PlannedEvent, 'id' | 'user_id' | 'created_at'>>) => Promise<void>
  removeEvent: (id: string) => Promise<void>
  // Instancias
  linkExpense:   (eventId: string, date: string, expenseId: string, estimatedAmount: number) => Promise<void>
  unlinkExpense: (instanceId: string) => Promise<void>
}

const PlannedEventsContext = createContext<PlannedEventsContextValue | null>(null)

// ─── Resolución de ocurrencias ─────────────────────────────────────────────────

function resolveOccurrences(
  events: PlannedEvent[],
  instances: PlannedEventInstance[],
  windowMonths: number,
): PlannedEventOccurrence[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const windowEnd = new Date(today)
  windowEnd.setMonth(windowEnd.getMonth() + windowMonths)

  // índice rápido: "event_id:YYYY-MM-DD" → instancia
  const instanceMap = new Map<string, PlannedEventInstance>()
  for (const inst of instances) {
    instanceMap.set(`${inst.event_id}:${inst.date}`, inst)
  }

  const result: PlannedEventOccurrence[] = []

  for (const event of events) {
    const dates: string[] = []

    if (event.is_recurring) {
      // Una ocurrencia por año dentro de la ventana
      const startYear = today.getFullYear()
      const endYear   = windowEnd.getFullYear()
      for (let year = startYear; year <= endYear; year++) {
        const d = new Date(year, event.month - 1, event.day)
        if (d >= today && d <= windowEnd) {
          dates.push(d.toISOString().slice(0, 10))
        }
      }
    } else {
      // Próximo año calendario donde month/day cae después de hoy
      const thisYear = today.getFullYear()
      for (let year = thisYear; year <= thisYear + 1; year++) {
        const d = new Date(year, event.month - 1, event.day)
        if (d >= today) {
          if (d <= windowEnd) dates.push(d.toISOString().slice(0, 10))
          break
        }
      }
    }

    for (const date of dates) {
      const instance = instanceMap.get(`${event.id}:${date}`) ?? null
      result.push({
        event_id:         event.id,
        title:            event.title,
        category:         event.category,
        notes:            event.notes,
        is_recurring:     event.is_recurring,
        date,
        estimated_amount: event.estimated_amount,
        instance,
        expense:          null, // enriquecer a nivel componente con ExpensesContext si se necesita
      })
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function PlannedEventsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()

  const [events,    setEvents]    = useState<PlannedEvent[]>([])
  const [instances, setInstances] = useState<PlannedEventInstance[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<Error | null>(null)
  const [windowMonths, setWindowMonths] = useState(12)

  // ── Fetch inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setEvents([]); setInstances([]); setLoading(false); return }

    setLoading(true)
    Promise.all([
      supabase.from('planned_events').select('*').eq('user_id', userId).order('month').order('day'),
      supabase.from('planned_event_instances').select('*').eq('user_id', userId),
    ]).then(([eventsRes, instancesRes]) => {
      if (eventsRes.error)    setError(new Error(eventsRes.error.message))
      else if (instancesRes.error) setError(new Error(instancesRes.error.message))
      else {
        setEvents(eventsRes.data ?? [])
        setInstances(instancesRes.data ?? [])
      }
      setLoading(false)
    })
  }, [userId])

  // ── Ocurrencias calculadas ───────────────────────────────────────────────────
  const occurrences = useMemo(
    () => resolveOccurrences(events, instances, windowMonths),
    [events, instances, windowMonths],
  )

  // ── Templates CRUD ───────────────────────────────────────────────────────────
  async function addEvent(item: Omit<PlannedEvent, 'id' | 'user_id' | 'created_at'>) {
    const optimistic: PlannedEvent = {
      ...item,
      id: crypto.randomUUID(),
      user_id: userId!,
      created_at: new Date().toISOString(),
    }
    setEvents((prev) => [...prev, optimistic])

    const { data: inserted, error: err } = await supabase
      .from('planned_events')
      .insert({ ...item, user_id: userId })
      .select()
      .single()

    if (err) {
      setEvents((prev) => prev.filter((e) => e.id !== optimistic.id))
      setError(new Error(err.message))
    } else {
      setEvents((prev) => prev.map((e) => (e.id === optimistic.id ? inserted : e)))
    }
  }

  async function updateEvent(id: string, changes: Partial<Omit<PlannedEvent, 'id' | 'user_id' | 'created_at'>>) {
    const snapshot = events
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)))

    const { error: err } = await supabase.from('planned_events').update(changes).eq('id', id)
    if (err) {
      setEvents(snapshot)
      setError(new Error(err.message))
    }
  }

  async function removeEvent(id: string) {
    const snapshot = events
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setInstances((prev) => prev.filter((i) => i.event_id !== id))

    const { error: err } = await supabase.from('planned_events').delete().eq('id', id)
    if (err) {
      setEvents(snapshot)
      setError(new Error(err.message))
    }
  }

  // ── Instancias ───────────────────────────────────────────────────────────────

  async function linkExpense(eventId: string, date: string, expenseId: string, estimatedAmount: number) {
    const existing = instances.find((i) => i.event_id === eventId && i.date === date)

    if (existing) {
      // actualizar instancia existente
      const snapshot = instances
      setInstances((prev) =>
        prev.map((i) => (i.id === existing.id ? { ...i, expense_id: expenseId } : i)),
      )
      const { error: err } = await supabase
        .from('planned_event_instances')
        .update({ expense_id: expenseId })
        .eq('id', existing.id)
      if (err) {
        setInstances(snapshot)
        setError(new Error(err.message))
      }
    } else {
      // crear nueva instancia
      const optimistic: PlannedEventInstance = {
        id: crypto.randomUUID(),
        user_id: userId!,
        event_id: eventId,
        date,
        estimated_amount: estimatedAmount,
        expense_id: expenseId,
        created_at: new Date().toISOString(),
      }
      setInstances((prev) => [...prev, optimistic])

      const { data: inserted, error: err } = await supabase
        .from('planned_event_instances')
        .insert({ user_id: userId, event_id: eventId, date, estimated_amount: estimatedAmount, expense_id: expenseId })
        .select()
        .single()

      if (err) {
        setInstances((prev) => prev.filter((i) => i.id !== optimistic.id))
        setError(new Error(err.message))
      } else {
        setInstances((prev) => prev.map((i) => (i.id === optimistic.id ? inserted : i)))
      }
    }
  }

  async function unlinkExpense(instanceId: string) {
    const snapshot = instances
    setInstances((prev) =>
      prev.map((i) => (i.id === instanceId ? { ...i, expense_id: null } : i)),
    )
    const { error: err } = await supabase
      .from('planned_event_instances')
      .update({ expense_id: null })
      .eq('id', instanceId)
    if (err) {
      setInstances(snapshot)
      setError(new Error(err.message))
    }
  }

  return (
    <PlannedEventsContext.Provider
      value={{
        events, instances, occurrences,
        windowMonths, setWindowMonths,
        loading, error,
        addEvent, updateEvent, removeEvent,
        linkExpense, unlinkExpense,
      }}
    >
      {children}
    </PlannedEventsContext.Provider>
  )
}

export function usePlannedEvents() {
  const ctx = useContext(PlannedEventsContext)
  if (!ctx) throw new Error('usePlannedEvents debe usarse dentro de PlannedEventsProvider')
  return ctx
}
