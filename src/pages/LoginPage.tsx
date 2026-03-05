import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const { userId, loading } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isLogin, setIsLogin]   = useState(true)
  const [message, setMessage]   = useState<string | null>(null)

  if (loading) return null
  if (userId)  return <Navigate to="/app" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/app'
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Revisá tu email para confirmar el registro.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">FinanzasPro</h1>
          <p className="text-muted-foreground text-sm">Control de gastos personales</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Ingresá con tu cuenta para continuar.' : 'Registrate para empezar a controlar tus gastos.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {message && (
                <p className="text-sm text-green-400">{message}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrarse'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null) }}
                className="text-primary hover:underline"
              >
                {isLogin ? 'Registrate' : 'Iniciá sesión'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
