import { createContext, useContext, useState, type ReactNode } from 'react'
import { CATEGORIES as DEFAULT_CATEGORIES, type Category } from '@/types'

interface CategoriesContextValue {
  categories: Category[]
  categoryMap: Record<string, Category>
  add:    (item: Omit<Category, 'id'>) => string
  update: (id: string, changes: Partial<Omit<Category, 'id'>>) => void
  remove: (id: string) => void
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  function add(item: Omit<Category, 'id'>): string {
    const id = item.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setCategories((prev) => [...prev, { ...item, id }])
    return id
  }

  function update(id: string, changes: Partial<Omit<Category, 'id'>>) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)))
  }

  function remove(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <CategoriesContext.Provider value={{ categories, categoryMap, add, update, remove }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories debe usarse dentro de CategoriesProvider')
  return ctx
}
