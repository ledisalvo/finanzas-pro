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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type { Expense } from '@/types'

function MonthSelector() {
  const { label, prev, next } = useMonth()
  return (
    <div className="flex items-center gap-1">
      <button onClick={prev} className="rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">‹</button>
      <span className="text-muted-foreground text-sm min-w-[110px] text-center">{label}</span>
      <button onClick={next} className="rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">›</button>
    </div>
  )
}

export default function AppPage() {
  const { userId, loading } = useAuth()
  const [showForm, setShowForm]            = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  if (loading)  return null
  if (!userId)  return <Navigate to="/login" replace />

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const openNew   = () => { setEditingExpense(null); setShowForm(true) }
  const openEdit  = (e: Expense) => { setEditingExpense(e); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingExpense(null) }

  return (
    <MonthProvider>
    <CategoriesProvider>
      <BudgetsProvider>
        <ExpensesProvider>
          <RecurringProvider>
            <IncomesProvider>
              <GoalsProvider>
                <div className="min-h-screen flex flex-col">
                  {/* Header */}
                  <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-primary">FinanzasPro</span>
                      <span className="hidden sm:block"><MonthSelector /></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={openNew}>+ Nuevo gasto</Button>
                      <Button size="sm" variant="ghost" onClick={handleSignOut}>Salir</Button>
                    </div>
                  </header>

                  <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
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

                    <Tabs defaultValue="dashboard">
                      <TabsList className="mb-6 flex h-auto flex-wrap gap-1 bg-muted p-1">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="budget">Pres. vs Real</TabsTrigger>
                        <TabsTrigger value="expenses">Gastos</TabsTrigger>
                        <TabsTrigger value="recurring">Recurrentes</TabsTrigger>
                        <TabsTrigger value="incomes">Ingresos</TabsTrigger>
                        <TabsTrigger value="goals">Objetivos</TabsTrigger>
                        <TabsTrigger value="projection">Proyección</TabsTrigger>
                        <TabsTrigger value="categories">Categorías</TabsTrigger>
                      </TabsList>

                      <TabsContent value="dashboard">  <Dashboard /> </TabsContent>
                      <TabsContent value="budget">     <BudgetVsReal /> </TabsContent>
                      <TabsContent value="expenses">   <ExpenseList onEdit={openEdit} /> </TabsContent>
                      <TabsContent value="recurring">  <Recurring /> </TabsContent>
                      <TabsContent value="incomes">    <Incomes /> </TabsContent>
                      <TabsContent value="goals">      <Goals /> </TabsContent>
                      <TabsContent value="projection"> <Projection /> </TabsContent>
                      <TabsContent value="categories"> <Categories /> </TabsContent>
                    </Tabs>
                  </main>
                </div>
              </GoalsProvider>
            </IncomesProvider>
          </RecurringProvider>
        </ExpensesProvider>
      </BudgetsProvider>
    </CategoriesProvider>
    </MonthProvider>
  )
}
