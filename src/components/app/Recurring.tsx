import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRecurring } from '@/hooks/useRecurring'
import { CATEGORY_MAP } from '@/types'

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

export default function Recurring() {
  const { data: recurring } = useRecurring()

  const sorted = useMemo(
    () => [...recurring].sort((a, b) => a.day_of_month - b.day_of_month),
    [recurring],
  )

  const totalMensual = useMemo(
    () => recurring.reduce((sum, r) => sum + r.amount, 0),
    [recurring],
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total mensual fijo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{formatCurrency(totalMensual)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos recurrentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((item) => {
            const cat = CATEGORY_MAP[item.category]
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md px-2 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">
                    {cat?.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.label} · Día {item.day_of_month} de cada mes
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(item.amount)}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
