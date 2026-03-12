# FinanzasPro — Guía para Claude Code

## Stack
- React 18 + TypeScript 5, Vite 5
- Tailwind CSS 3 (fondo oscuro, accent azul) — **sin** Tailwind 4
- shadcn/ui componentes instalados manualmente en `src/components/ui/`
  (no usar el CLI de `shadcn` que requiere Tailwind 4)
- Supabase JS SDK v2 — cliente singleton en `src/lib/supabase.ts`
- React Router v6
- Recharts para gráficos

## Estructura
```
src/
  types/index.ts       interfaces + CATEGORIES + CATEGORY_MAP
  lib/supabase.ts      cliente singleton
  lib/utils.ts         cn() helper
  hooks/               useExpenses, useBudgets, useRecurring
  components/ui/       button, card, tabs, input, label, badge
  components/app/      Dashboard, BudgetVsReal, ExpenseList, Recurring, Projection, ExpenseForm
  pages/               LoginPage, AppPage
supabase/schema.sql    tablas + RLS + índices
```

## Convenciones
- Español para texto visible en UI, inglés para código
- Nunca lógica de negocio en componentes — siempre en hooks
- Hooks devuelven `{ data, loading, error }`
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Colores y categorías solo en `src/types/index.ts` (`CATEGORIES`, `CATEGORY_MAP`)
- Path alias `@/` apunta a `src/`

## Estado actual (sesión 1 — 2026-03-05)
- [x] Scaffold Vite + React + TypeScript
- [x] Tailwind CSS 3 configurado con tema oscuro y accent azul
- [x] Componentes shadcn/ui base: button, card, tabs, input, label, badge
- [x] src/types/index.ts con Expense, Budget, Recurring, Category, CATEGORIES
- [x] src/lib/supabase.ts singleton
- [x] Hooks con datos mock (no conectados a Supabase)
- [x] LoginPage con Supabase Auth (email/password, sign up, sign in)
- [x] AppPage con 5 tabs: Dashboard, Pres. vs Real, Gastos, Recurrentes, Proyección
- [x] supabase/schema.sql con RLS completo
- [x] .env.example

