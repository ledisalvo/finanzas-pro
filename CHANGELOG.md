# Changelog

Todos los cambios notables de FinanzasPro se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [0.3.0] — 2026-03-05

### Agregado
- `src/context/CategoriesContext.tsx` — React Context con estado mutable de categorías; expone `categories`, `categoryMap`, `add`, `update`, `remove`
- `src/components/app/Categories.tsx` — tab de gestión de categorías: crear, editar nombre/ícono/color, eliminar; selector de colores preset + color personalizado; vista previa en tiempo real
- `AppPage.tsx` — nueva tab "Categorías" y `CategoriesProvider` envolviendo el layout

### Modificado
- `Dashboard`, `BudgetVsReal`, `ExpenseList`, `ExpenseForm`, `Recurring` — reemplazadas las importaciones estáticas `CATEGORIES`/`CATEGORY_MAP` por `useCategories()` del contexto; los componentes ahora reflejan cambios de categorías en tiempo real

---

## [0.2.0] — 2026-03-05

### Agregado
- `Recurring.tsx` — formulario inline para agregar nuevos gastos recurrentes
- `Recurring.tsx` — acciones de editar y eliminar por ítem (visibles al hacer hover)
- `useRecurring.ts` — métodos `add`, `update`, `remove` con estado local (pendiente conexión a Supabase)

---

## [0.1.0] — 2026-03-05

### Agregado
- Scaffold completo con Vite 5 + React 18 + TypeScript 5
- Tailwind CSS 3 con tema oscuro y accent azul (variables CSS en `src/index.css`)
- Componentes shadcn/ui instalados manualmente: `button`, `card`, `tabs`, `input`, `label`, `badge`
- `src/types/index.ts` — interfaces `Expense`, `Budget`, `Recurring`, `Category` y constantes `CATEGORIES` / `CATEGORY_MAP`
- `src/lib/supabase.ts` — cliente singleton de Supabase JS SDK v2
- `src/lib/utils.ts` — helper `cn()` para clases condicionales
- `src/hooks/useExpenses.ts` — hook con datos mock, estructura `{ data, loading, error }`
- `src/hooks/useBudgets.ts` — ídem para presupuestos
- `src/hooks/useRecurring.ts` — ídem para gastos recurrentes
- `src/pages/LoginPage.tsx` — formulario email/password conectado a `supabase.auth` (sign in + sign up)
- `src/pages/AppPage.tsx` — layout principal con 5 tabs y modal de nuevo gasto
- `src/components/app/Dashboard.tsx` — KPIs, barra de progreso de presupuesto, gráfico de barras por categoría y últimos gastos
- `src/components/app/BudgetVsReal.tsx` — gráfico comparativo y tabla de desvíos por categoría
- `src/components/app/ExpenseList.tsx` — lista de gastos con filtro por categoría
- `src/components/app/Recurring.tsx` — gastos fijos con total mensual
- `src/components/app/Projection.tsx` — tendencia acumulada y proyección fin de mes
- `src/components/app/ExpenseForm.tsx` — formulario de carga de gasto (UI completa, sin persistencia aún)
- `supabase/schema.sql` — tablas `expenses`, `budgets`, `recurring` con RLS e índices
- `.env.example` con variables requeridas
- `CLAUDE.md` con contexto del proyecto para futuras sesiones
- Repositorio publicado en GitHub: `ledisalvo/finanzas-pro`

### Pendiente para próxima sesión
- Conectar hooks a Supabase (queries reales con `useEffect`)
- Autenticación persistente con `onAuthStateChange`
- CRUD completo para gastos y presupuestos
- Lógica real de proyección con promedios históricos
