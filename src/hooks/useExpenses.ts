// El estado de gastos vive en ExpensesContext para ser compartido entre componentes.
// Este archivo re-exporta el hook para mantener compatibilidad con imports existentes.
export { useExpenses } from '@/context/ExpensesContext'
