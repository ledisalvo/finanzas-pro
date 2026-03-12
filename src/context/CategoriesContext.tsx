import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES as DEFAULT_CATEGORIES, type Category } from '@/types'

const DEFAULT_IDS = new Set(DEFAULT_CATEGORIES.map((c) => c.id))

interface CategoriesContextValue {
  categories: Category[]
  categoryMap: Record<string, Category>
  add:               (item: Omit<Category, 'id'>) => Promise<string>
  update:            (id: string, changes: Partial<Omit<Category, 'id'>>) => Promise<void>
  remove:            (id: string) => Promise<void>
  toggleBudget:      (id: string, value: boolean) => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [custom, setCustom] = useState<Category[]>([])

  useEffect(() => {
    if (!userId) { setCustom([]); return }

    supabase
      .from('categories')
      .select('id, label, icon, color, description, track_budget')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data: rows }) => {
        setCustom(rows ?? [])
      })
  }, [userId])

  const categories = [...DEFAULT_CATEGORIES, ...custom]
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  async function add(item: Omit<Category, 'id'>): Promise<string> {
    const id = item.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const newCat: Category = { ...item, id }

    setCustom((prev) => [...prev, newCat])

    const { error } = await supabase
      .from('categories')
      .insert({ ...newCat, user_id: userId })

    if (error) {
      setCustom((prev) => prev.filter((c) => c.id !== id))
      throw new Error(error.message)
    }
    return id
  }

  async function update(id: string, changes: Partial<Omit<Category, 'id'>>) {
    if (DEFAULT_IDS.has(id)) return
    const snapshot = custom
    setCustom((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)))

    const { error } = await supabase
      .from('categories')
      .update(changes)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) setCustom(snapshot)
  }

  async function remove(id: string) {
    if (DEFAULT_IDS.has(id)) return
    const snapshot = custom
    setCustom((prev) => prev.filter((c) => c.id !== id))

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) setCustom(snapshot)
  }

  async function toggleBudget(id: string, value: boolean) {
    if (DEFAULT_IDS.has(id)) return
    const snapshot = custom
    setCustom((prev) => prev.map((c) => (c.id === id ? { ...c, track_budget: value } : c)))

    const { error } = await supabase
      .from('categories')
      .update({ track_budget: value })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) setCustom(snapshot)
  }

  return (
    <CategoriesContext.Provider value={{ categories, categoryMap, add, update, remove, toggleBudget }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories debe usarse dentro de CategoriesProvider')
  return ctx
}
