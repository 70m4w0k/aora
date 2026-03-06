import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Home, ShoppingCart, Receipt, FileText, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'

export function LandingPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      if (!user?.householdId) {
        navigate({ to: '/setup' })
      } else {
        navigate({ to: '/app/' })
      }
    }
  }, [isAuthenticated, user, navigate])

  const features = [
    { icon: CheckSquare, label: t('landing.featureChores'), color: 'text-indigo-400' },
    { icon: ShoppingCart, label: t('landing.featureShopping'), color: 'text-green-400' },
    { icon: Receipt, label: t('landing.featureExpenses'), color: 'text-orange-400' },
    { icon: FileText, label: t('landing.featureDocuments'), color: 'text-blue-400' }
  ]

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 px-6">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 gap-8 pt-16 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">{t('landing.appName')}</h1>
        </div>

        <p className="text-xl text-slate-400 text-center max-w-xs leading-relaxed">
          {t('landing.tagline')}
        </p>

        <ul className="flex flex-col gap-3 w-full max-w-xs">
          {features.map(({ icon: Icon, label, color }) => (
            <li key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-slate-300 text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 pb-12 pt-4 max-w-sm w-full mx-auto">
        <Button size="lg" className="w-full" onClick={() => navigate({ to: '/register' })}>
          {t('landing.getStarted')}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full text-slate-400"
          onClick={() => navigate({ to: '/login' })}
        >
          {t('landing.alreadyHaveAccount')}
        </Button>
      </div>
    </div>
  )
}
