import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/features/auth/api'
import { useAuthStore } from '@/stores/auth.store'
import { pb } from '@/lib/pocketbase'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error(t('auth.signIn.fillAllFields'))
      return
    }
    setLoading(true)
    try {
      const user = await signIn(email, password)
      setUser({
        id: user.id,
        email: user.email,
        username: user.username || user.name,
        avatar: user.avatar,
        color: user.color,
        householdId: user.householdId
      })
      if (!user.householdId) {
        navigate({ to: '/setup' })
      } else {
        navigate({ to: '/app/' })
      }
    } catch {
      toast.error(t('auth.signIn.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 px-6">
      <div className="flex flex-col justify-center flex-1 gap-8 max-w-sm mx-auto w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{t('auth.signIn.title')}</h1>
          <p className="text-slate-400 mt-1 text-sm">{t('auth.signIn.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('auth.signIn.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.signIn.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('auth.signIn.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.signIn.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" size="lg" className="mt-2" disabled={loading}>
            {loading ? t('auth.signIn.signingIn') : t('auth.signIn.signIn')}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          {t('auth.signIn.noAccount')}{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            {t('auth.signIn.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
