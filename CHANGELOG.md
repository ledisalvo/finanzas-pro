# Changelog

Todos los cambios notables de FinanzasPro se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [0.9.0] — 2026-03-10

### Agregado
- `src/components/app/Debts.tsx` — tab "Deudas": CRUD de deudas en cuotas o abiertas, gráfico de evolución mensual, badge de estado activo/pagada, colores personalizables
- `src/context/DebtsContext.tsx` + `src/hooks/useDebts.ts` — contexto Supabase-connected con `add`, `update`, `remove`, `markAsPaid`, `registerPayment`
- `src/components/app/CsvImport.tsx` — importación de gastos desde CSV: parseo inteligente de fechas (DD/MM/YYYY, YYYY-MM-DD) y montos (separador de miles/decimales con punto o coma), preview con validación, carga masiva via `addMany`
- `src/components/app/IpcAlertBanner.tsx` — banner de alertas IPC: detecta gastos recurrentes con actualización vencida, modal de confirmación con preview del nuevo monto, soporte de items compartidos
- `Recurring.tsx` — soporte de gastos compartidos: campos `is_shared`, `shared_ratio`, `total_amount`; configuración de actualización por IPC (`update_type`, `update_frequency`); la lista muestra la parte del usuario y el monto total
- `RecurringContext.tsx` — `overdueItems`: lista memoizada de recurrentes con actualización IPC vencida; `applyIpcUpdate(id, ipcPercent)`: recalcula monto y actualiza fechas de seguimiento

### Modificado
- `src/types/index.ts`:
  - `Expense` — nuevos campos `is_debt_payment`, `debt_id`, `is_savings`, `goal_id`
  - `Recurring` — nuevos campos `is_shared`, `shared_ratio`, `total_amount`, `update_type`, `update_frequency`, `last_updated`, `next_update_date`
  - `Category` — nuevos campos opcionales `description` y `track_budget`
  - `Income` — nuevo campo `month` (YYYY-MM) para asociar ingresos a un mes específico
  - `Debt` — interfaz nueva con `debt_type: 'installments' | 'open'`
  - `CATEGORIES` — renombrada "Comida" → "Supermercado", "Emergencias" → "Imprevistos"; agregados `description` y `track_budget` a cada categoría; "Servicios" marcada con `track_budget: false`
- `ExpenseForm.tsx` — nuevos campos: marcar como pago de deuda (select de deuda activa), marcar como ahorro (select de objetivo); ambos campos opcionales y mutuamente excluyentes
- `ExpenseList.tsx` — badges de "Pago deuda" y "Ahorro" en cada ítem; acciones de editar/eliminar rediseñadas; filtros expandidos
- `BudgetVsReal.tsx` — filtra categorías con `track_budget: false` de la comparativa de presupuesto vs real
- `Dashboard.tsx` — nueva sección "Deudas activas" con barras de progreso de pago; integra `IpcAlertBanner`
- `Goals.tsx` — UI rediseñada con barra de progreso más detallada, estimación de meses, aporte mensual editable inline
- `Incomes.tsx` — asociación de ingresos a mes específico; totales por mes
- `Categories.tsx` — campos `description` y `track_budget` en formulario de creación/edición
- `CategoriesContext.tsx` — sincroniza categorías base con las personalizadas del usuario; soporte de `description` y `track_budget`
- `supabase/schema.sql` — tabla `debts` con RLS; columnas `is_debt_payment`/`debt_id` en `expenses`; columnas IPC/compartido en `recurring`; columna `month` en `incomes`; columnas `description`/`track_budget` en `categories`
- `AppPage.tsx` — nueva tab "Deudas" con `DebtsProvider`; botón "Importar CSV" en tab Gastos

---

## [0.8.0] — 2026-03-05

### Agregado
- `src/context/MonthContext.tsx` — `MonthProvider` + `useMonth()`: estado global del mes seleccionado (YYYY-MM) con navegación `prev`/`next` y label formateado
- `AppPage.tsx` — `MonthSelector` en el header (‹ Marzo 2026 ›); `MonthProvider` en el árbol de providers

### Modificado
- `Dashboard.tsx`, `BudgetVsReal.tsx`, `ExpenseList.tsx` — filtran expenses y budgets por el mes seleccionado en `MonthContext`
- `Projection.tsx` — fecha inicial deja de ser hardcodeada, usa `new Date()` real

---

## [0.7.0] — 2026-03-05

### Agregado
- `src/context/AuthContext.tsx` — `AuthProvider` + `useAuth()`: `userId` y `loading` via `onAuthStateChange` + `getSession`
- `src/context/RecurringContext.tsx` — contexto Supabase-connected para gastos recurrentes (antes era hook local); expone `add`, `update`, `remove` con optimistic updates
- `src/context/BudgetsContext.tsx` — contexto Supabase-connected para presupuestos; expone `upsert` y `remove`
- `src/main.tsx` — `AuthProvider` envuelve la app completa

### Modificado
- `LoginPage.tsx` — usa `useAuth()` en lugar de `getSession` en render body; elimina re-renders infinitos
- `AppPage.tsx` — usa `useAuth()` para auth guard; agrega `RecurringProvider` y `BudgetsProvider`; elimina `useState` de sesión manual
- `ExpensesContext.tsx` — conectado a Supabase: fetch real con `useEffect`, CRUD con optimistic updates y rollback en error
- `IncomesContext.tsx` — ídem, tabla `incomes`
- `GoalsContext.tsx` — ídem, tabla `budget_goals`
- `hooks/useRecurring.ts` — re-exporta desde `RecurringContext` (sin cambio de API para los consumidores)
- `hooks/useBudgets.ts` — re-exporta desde `BudgetsContext`

---

## [0.6.0] — 2026-03-05

### Agregado
- `Income` y `BudgetGoal` en `src/types/index.ts`
- `IncomesContext` + `useIncomes` — CRUD de fuentes de ingreso fijo
- `GoalsContext` + `useGoals` — CRUD de objetivos con aporte mensual, meta opcional y acumulado
- `Incomes.tsx` — tab "Ingresos": lista CRUD de fuentes de ingreso, total mensual en verde
- `Goals.tsx` — tab "Objetivos": barra de progreso por objetivo con meta, estimación de meses, badge de aporte mensual, checkbox para activar meta
- `supabase/schema.sql` — tablas `incomes` y `budget_goals` con RLS

### Modificado
- `Dashboard.tsx` — nueva sección "Objetivos de ahorro" con barras de progreso para metas con tope
- `Projection.tsx` — reescritura completa: balance `Ingresos − Fijos − Objetivos = Libre`, gráfico de barras apiladas (6 meses), tabla mes a mes, sección de estimación de fechas de meta
- `AppPage.tsx` — 2 tabs nuevas (Ingresos, Objetivos), 2 providers (`IncomesProvider`, `GoalsProvider`)

---

## [0.5.0] — 2026-03-05

### Agregado
- `src/context/ExpensesContext.tsx` — contexto compartido para gastos con `add`, `update`, `remove`; mismo patrón que `CategoriesContext`
- `src/components/app/NewCategoryInline.tsx` — componente extraído y reutilizable para crear una categoría inline sin salir del formulario (usa `div`, no `form`, para evitar nesting inválido)
- `ExpenseForm.tsx` — soporte de edición con prop `initial?: Expense`; se conecta al contexto (`add`/`update`); incluye `NewCategoryInline`; botón dinámico "Agregar gasto" / "Guardar cambios"
- `ExpenseList.tsx` — botones Editar y Eliminar por ítem (visibles en hover); emite `onEdit` al padre
- `AppPage.tsx` — estado `editingExpense`, handlers `openNew`/`openEdit`/`closeForm`; título del modal dinámico; `ExpensesProvider` envuelve el layout

### Modificado
- `src/hooks/useExpenses.ts` — ahora re-exporta desde `ExpensesContext` (Dashboard y BudgetVsReal no requirieron cambios)
- `Recurring.tsx` — eliminado `NewCategoryInline` inline; ahora importa el componente extraído

---

## [0.4.0] — 2026-03-05

### Agregado
- `src/components/ui/emoji-picker.tsx` — selector de emojis con dropdown: 10 grupos temáticos (~120 emojis), resaltado del emoji activo, input de texto para emojis personalizados, cierre automático al hacer clic afuera
- `Recurring.tsx` — botón `+ Nueva categoría` dentro del formulario de recurrente; despliega un mini-form inline (nombre, `EmojiPicker`, colores) que crea la categoría y la selecciona automáticamente sin abandonar la tab

### Modificado
- `Categories.tsx` — campo de emoji reemplazado por `EmojiPicker`
- `CategoriesContext` — `add()` ahora devuelve el `id` generado (necesario para auto-seleccionar tras creación inline)

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
