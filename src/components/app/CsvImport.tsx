import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useExpenses } from '@/hooks/useExpenses'

// ─── CSV parsing ──────────────────────────────────────────────────────────────

type ParsedRow = {
  date:        string
  description: string
  amount:      number
  valid:       boolean
  error?:      string
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current  = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(raw: string): string | null {
  const s = raw.trim()
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/[$\s]/g, '')

  // Detect format:
  // - "41800.00"  → dot is decimal separator (only one dot, followed by 1-2 digits at end)
  // - "4.180.000" → dots are thousands separators (multiple dots OR dot not near end)
  // - "41.800,00" → dot=thousands, comma=decimal
  // - "41800,00"  → comma is decimal separator

  const dotsCount   = (s.match(/\./g) ?? []).length
  const commasCount = (s.match(/,/g)  ?? []).length

  if (dotsCount === 1 && commasCount === 0) {
    // Could be decimal ("41800.00") or thousands ("41.800")
    // If the dot is followed by exactly 1 or 2 digits → decimal
    // If followed by exactly 3 digits → thousands separator
    const afterDot = s.split('.')[1]
    if (afterDot && afterDot.length === 3) {
      // "41.800" → thousands separator, no decimal part
      s = s.replace(/\./g, '')
    }
    // else: "41800.00" or "418.5" → keep dot as decimal, do nothing
  } else if (dotsCount > 1) {
    // "4.180.000" or "4.180.000,00" → dots are thousands separators
    s = s.replace(/\./g, '')
    s = s.replace(',', '.')
  } else if (commasCount === 1 && dotsCount === 0) {
    // "41800,00" → comma is decimal separator
    s = s.replace(',', '.')
  } else if (dotsCount >= 1 && commasCount === 1) {
    // "41.800,00" → dot=thousands, comma=decimal
    s = s.replace(/\./g, '').replace(',', '.')
  }

  const n = parseFloat(s)
  return isNaN(n) || n < 0 ? null : n
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: ParsedRow[] = []

  for (let i = 0; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])

    // Skip header: first row where the amount column isn't numeric
    if (i === 0 && cols.length >= 3 && parseAmount(cols[2]) === null) continue

    if (cols.length < 3) {
      rows.push({ date: '', description: cols[1] ?? '', amount: 0, valid: false, error: 'Faltan columnas' })
      continue
    }

    const date        = parseDate(cols[0])
    const description = cols[1]
    const amount      = parseAmount(cols[2])

    if (!date) {
      rows.push({ date: cols[0], description, amount: 0, valid: false, error: `Fecha inválida: "${cols[0]}"` })
    } else if (amount === null) {
      rows.push({ date, description, amount: 0, valid: false, error: `Monto inválido: "${cols[2]}"` })
    } else if (!description) {
      rows.push({ date, description, amount, valid: false, error: 'Descripción vacía' })
    } else {
      rows.push({ date, description, amount, valid: true })
    }
  }

  return rows
}

function formatCurrency(v: number) {
  return `$${v.toLocaleString('es-AR')}`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CsvImportProps {
  onClose: () => void
}

export function CsvImport({ onClose }: CsvImportProps) {
  const { addMany }         = useExpenses()
  const fileInputRef        = useRef<HTMLInputElement>(null)
  const [rows, setRows]     = useState<ParsedRow[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  const validRows   = rows?.filter((r) => r.valid) ?? []
  const invalidRows = rows?.filter((r) => !r.valid) ?? []

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsv(text))
      setDone(false)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    if (validRows.length === 0) return
    setSaving(true)
    await addMany(
      validRows.map((r) => ({
        date:            r.date,
        description:     r.description,
        amount:          r.amount,
        category:        '',
        recurring:       false,
        is_debt_payment: false,
        debt_id:         null,
      })),
    )
    setSaving(false)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Importar gastos desde CSV</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Columnas esperadas: <span className="font-mono">Fecha, Descripción, Monto</span>
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* File picker */}
          {!done && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {rows ? '📄 Cambiar archivo…' : '📂 Seleccionar archivo CSV…'}
              </button>
            </div>
          )}

          {/* Success state */}
          {done && (
            <div className="rounded-lg bg-green-400/10 border border-green-400/30 p-4 space-y-2">
              <p className="text-green-400 font-medium">
                ✓ {validRows.length} gasto{validRows.length !== 1 ? 's' : ''} importado{validRows.length !== 1 ? 's' : ''} correctamente
              </p>
              {(() => {
                const months = [...new Set(validRows.map((r) => r.date.slice(0, 7)))].sort()
                const fmt = (m: string) => {
                  const [y, mo] = m.split('-')
                  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(mo,10)-1] + ' ' + y
                }
                return (
                  <p className="text-xs text-muted-foreground">
                    Meses importados: <span className="font-medium text-foreground">{months.map(fmt).join(', ')}</span>.
                    Usá el selector de mes para verlos.
                  </p>
                )
              })()}
              <p className="text-xs text-muted-foreground">
                Las categorías quedaron sin asignar. Podés editarlas desde la lista de gastos.
              </p>
            </div>
          )}

          {/* Preview */}
          {rows !== null && !done && (
            <>
              {/* Summary */}
              <div className="flex gap-3 text-sm">
                <span className="text-green-400 font-medium">✓ {validRows.length} válidos</span>
                {invalidRows.length > 0 && (
                  <span className="text-destructive font-medium">✗ {invalidRows.length} con error</span>
                )}
              </div>

              {rows.length === 0 && (
                <p className="text-sm text-muted-foreground">No se encontraron filas en el archivo.</p>
              )}

              {rows.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden text-sm">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Descripción</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Monto</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-t border-border ${row.valid ? '' : 'bg-destructive/5'}`}
                        >
                          <td className="px-3 py-2 text-xs font-mono">{row.date || '—'}</td>
                          <td className="px-3 py-2 max-w-[200px] truncate">{row.description || '—'}</td>
                          <td className="px-3 py-2 text-right">
                            {row.valid ? formatCurrency(row.amount) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {row.valid
                              ? <span className="text-green-400 text-xs">✓</span>
                              : <span className="text-destructive text-xs">{row.error}</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {validRows.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Las categorías quedarán sin asignar. Podés editarlas después desde la lista de gastos.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>{done ? 'Cerrar' : 'Cancelar'}</Button>
          {!done && validRows.length > 0 && (
            <Button onClick={handleImport} disabled={saving}>
              {saving ? 'Importando…' : `Importar ${validRows.length} gasto${validRows.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
