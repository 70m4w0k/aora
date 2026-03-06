import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/features/auth/api'
import { useAuthStore } from '@/stores/auth.store'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      toast.error(t('auth.signUp.fillAllFields'))
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.signUp.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      const user = await signUp({
        username: form.username,
        email: form.email,
        password: form.password,
        passwordConfirm: form.confirmPassword
      })
      setUser({
        id: user.id,
        email: user.email,
        username: user.username || form.username,
        avatar: user.avatar,
        color: user.color,
        householdId: user.householdId
      })
      navigate({ to: '/setup' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('email')) {
        toast.error(t('errors.emailAlreadyExists'))
      } else {
        toast.error(t('errors.generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 px-6">
      <div className="flex flex-col justify-center flex-1 gap-8 max-w-sm mx-auto w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{t('auth.signUp.title')}</h1>
          <p className="text-slate-400 mt-1 text-sm">{t('auth.signUp.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">{t('auth.signUp.username')}</Label>
            <Input
              id="username"
              placeholder={t('auth.signUp.usernamePlaceholder')}
              value={form.username}
              onChange={update('username')}
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('auth.signUp.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.signUp.emailPlaceholder')}
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t('auth.signUp.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.signUp.passwordPlaceholder')}
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">{t('auth.signUp.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" size="lg" className="mt-2" disabled={loading}>
            {loading ? t('auth.signUp.signingUp') : t('auth.signUp.signUp')}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          {t('auth.signUp.hasAccount')}{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            {t('auth.signUp.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
