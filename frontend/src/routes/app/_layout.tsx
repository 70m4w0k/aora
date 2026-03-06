import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Home, CheckSquare, ShoppingCart, Receipt, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

const NAV_ITEMS = [
  { path: '/app/', icon: Home, labelKey: 'navbar.home' },
  { path: '/app/tasks', icon: CheckSquare, labelKey: 'navbar.calendar' },
  { path: '/app/shopping', icon: ShoppingCart, labelKey: 'navbar.shopping' },
  { path: '/app/expenses', icon: Receipt, labelKey: 'navbar.expenses' },
  { path: '/app/documents', icon: FileText, labelKey: 'navbar.documents' },
  { path: '/app/profile', icon: User, labelKey: 'navbar.profile' }
]

export function AppLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
    } else if (!user?.householdId) {
      navigate({ to: '/setup' })
    }
  }, [isAuthenticated, user, navigate])

  if (!isAuthenticated) return null

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
            const isActive =
              path === '/app/'
                ? currentPath === '/app' || currentPath === '/app/'
                : currentPath.startsWith(path)

            return (
              <button
                key={path}
                onClick={() => navigate({ to: path })}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0',
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-indigo-400')} />
                <span className="text-[10px] font-medium truncate">{t(labelKey)}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
