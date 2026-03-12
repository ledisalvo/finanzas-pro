import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { MonthProvider, useMonth } from '@/context/MonthContext'
import { CategoriesProvider } from '@/context/CategoriesContext'
import { ExpensesProvider }   from '@/context/ExpensesContext'
import { IncomesProvider }    from '@/context/IncomesContext'
import { GoalsProvider }      from '@/context/GoalsContext'
import { RecurringProvider }  from '@/context/RecurringContext'
import { BudgetsProvider }    from '@/context/BudgetsContext'
import { DebtsProvider }          from '@/context/DebtsContext'
import { PlannedEventsProvider }  from '@/context/PlannedEventsContext'
import {
  LayoutDashboard, SlidersHorizontal, Receipt, RefreshCw,
  TrendingUp, Target, BarChart2, CreditCard, Tag, Calendar,
  Wallet, LogOut, Plus, Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Dashboard    from '@/components/app/Dashboard'
import BudgetVsReal from '@/components/app/BudgetVsReal'
import ExpenseList  from '@/components/app/ExpenseList'
import Recurring    from '@/components/app/Recurring'
import Projection   from '@/components/app/Projection'
import ExpenseForm  from '@/components/app/ExpenseForm'
import Categories   from '@/components/app/Categories'
import Incomes      from '@/components/app/Incomes'
import Goals        from '@/components/app/Goals'
import Debts         from '@/components/app/Debts'
import PlannedEvents  from '@/components/app/PlannedEvents'
import type { Expense } from '@/types'

type Tab =
  | 'dashboard' | 'budget' | 'expenses' | 'recurring'
  | 'incomes'   | 'goals'  | 'projection' | 'debts' | 'categories'
  | 'planned-events'

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',       label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
  { id: 'budget',          label: 'Pres. vs Real', icon: <SlidersHorizontal size={18} /> },
  { id: 'expenses',        label: 'Gastos',         icon: <Receipt size={18} /> },
  { id: 'recurring',       label: 'Recurrentes',   icon: <RefreshCw size={18} /> },
  { id: 'incomes',         label: 'Ingresos',       icon: <Wallet size={18} /> },
  { id: 'goals',           label: 'Objetivos',      icon: <Target size={18} /> },
  { id: 'projection',      label: 'Proyección',     icon: <BarChart2 size={18} /> },
  { id: 'debts',           label: 'Deudas',         icon: <CreditCard size={18} /> },
  { id: 'planned-events',  label: 'Eventos',        icon: <Calendar size={18} /> },
  { id: 'categories',      label: 'Categorías',     icon: <Tag size={18} /> },
]

function MonthSelector() {
  const { label, prev, next } = useMonth()
  return (
    <div className="flex items-center gap-1">
      <button onClick={prev} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <ChevronLeft size={15} />
      </button>
      <span className="text-muted-foreground text-sm min-w-[110px] text-center">{label}</span>
      <button onClick={next} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

export default function AppPage() {
  const { userId, loading } = useAuth()
  const [activeTab, setActiveTab]              = useState<Tab>('dashboard')
  const [showForm, setShowForm]                = useState(false)
  const [editingExpense, setEditingExpense]     = useState<Expense | null>(null)
  const [sidebarOpen, setSidebarOpen]          = useState(false)   // mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)  // desktop

  if (loading)  return null
  if (!userId)  return <Navigate to="/login" replace />

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const openNew   = () => { setEditingExpense(null); setShowForm(true) }
  const openEdit  = (e: Expense) => { setEditingExpense(e); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingExpense(null) }

  const navigate = (id: Tab) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? ''

  return (
    <MonthProvider>
    <CategoriesProvider>
      <BudgetsProvider>
        <ExpensesProvider>
          <RecurringProvider>
            <IncomesProvider>
              <GoalsProvider>
              <DebtsProvider>
              <PlannedEventsProvider>
                <div className="min-h-screen flex flex-col">

                  {/* ── Top header ── */}
                  <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between z-30 sticky top-0" style={{ boxShadow: 'var(--shadow-header)' }}>
                    <div className="flex items-center gap-3">
                      {/* Mobile hamburger */}
                      <button
                        className="sm:hidden rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setSidebarOpen((v) => !v)}
                      >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                      </button>
                      {/* Desktop collapse toggle */}
                      <button
                        className="hidden sm:flex rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setSidebarCollapsed((v) => !v)}
                        title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                      >
                        <Menu size={18} />
                      </button>
                      <span className="text-xl font-bold text-primary">FinanzasPro</span>
                      <span className="hidden sm:block text-muted-foreground/40">|</span>
                      <span className="hidden sm:block text-sm text-muted-foreground">{activeLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MonthSelector />
                      <Button size="sm" onClick={openNew} className="hidden sm:flex gap-1">
                        <Plus size={15} /> Nuevo gasto
                      </Button>
                      <Button size="sm" onClick={openNew} className="sm:hidden">
                        <Plus size={15} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleSignOut} title="Salir">
                        <LogOut size={15} />
                      </Button>
                    </div>
                  </header>

                  <div className="flex flex-1 overflow-hidden">

                    {/* ── Mobile overlay ── */}
                    {sidebarOpen && (
                      <div
                        className="fixed inset-0 z-20 bg-black/50 sm:hidden"
                        onClick={() => setSidebarOpen(false)}
                      />
                    )}

                    {/* ── Sidebar ── */}
                    <aside className={`
                      fixed sm:sticky top-[57px] z-20 h-[calc(100vh-57px)]
                      flex flex-col border-r border-border bg-card
                      transition-all duration-200
                      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
                      ${sidebarCollapsed ? 'w-[56px]' : 'w-[245px]'}
                    `}>
                      <nav className="flex-1 pt-4 sm:pt-6 pb-3 overflow-y-auto overflow-x-hidden">
                        {NAV_ITEMS.map(({ id, label, icon }) => {
                          const active = activeTab === id
                          return (
                            <button
                              key={id}
                              onClick={() => navigate(id)}
                              title={sidebarCollapsed ? label : undefined}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors rounded-sm mx-1 w-[calc(100%-8px)]
                                ${active
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                                }`}
                            >
                              <span className="shrink-0">{icon}</span>
                              {!sidebarCollapsed && <span className="truncate">{label}</span>}
                            </button>
                          )
                        })}
                      </nav>

                      {!sidebarCollapsed && (
                        <div className="p-3 border-t border-border">
                          <p className="text-xs text-muted-foreground/50 text-center">FinanzasPro</p>
                        </div>
                      )}
                    </aside>

                    {/* ── Main content ── */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                      {/* Expense form modal */}
                      {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                              <CardTitle>{editingExpense ? 'Editar gasto' : 'Nuevo gasto'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ExpenseForm initial={editingExpense ?? undefined} onClose={closeForm} />
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {activeTab === 'dashboard'  && <Dashboard />}
                      {activeTab === 'budget'     && <BudgetVsReal />}
                      {activeTab === 'expenses'   && <ExpenseList onEdit={openEdit} />}
                      {activeTab === 'recurring'  && <Recurring />}
                      {activeTab === 'incomes'    && <Incomes />}
                      {activeTab === 'goals'      && <Goals />}
                      {activeTab === 'projection' && <Projection />}
                      {activeTab === 'debts'          && <Debts />}
                      {activeTab === 'planned-events' && (
                        <PlannedEvents
                          onNavigateToExpenses={() => setActiveTab('expenses')}
                        />
                      )}
                      {activeTab === 'categories' && <Categories />}
                    </main>
                  </div>
                </div>
              </PlannedEventsProvider>
              </DebtsProvider>
              </GoalsProvider>
            </IncomesProvider>
          </RecurringProvider>
        </ExpensesProvider>
      </BudgetsProvider>
    </CategoriesProvider>
    </MonthProvider>
  )
}
