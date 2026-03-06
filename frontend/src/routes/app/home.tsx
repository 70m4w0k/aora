import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { CheckSquare, ShoppingCart, Receipt, FileText } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useTasks } from '@/features/tasks/queries'
import { useShoppingItems } from '@/features/shopping/queries'
import { useExpenses } from '@/features/expenses/queries'
import { useDocuments } from '@/features/documents/queries'
import { useHousehold } from '@/features/household/queries'
import { cn } from '@/lib/utils'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'greetingMorning'
  if (h < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const householdId = user?.householdId ?? ''

  const { data: tasks = [] } = useTasks(householdId)
  const { data: shopping = [] } = useShoppingItems(householdId)
  const { data: expenses = [] } = useExpenses(householdId)
  const { data: documents = [] } = useDocuments(householdId)
  const { data: household } = useHousehold(householdId)

  const pendingTasks = tasks.filter((t) => t.status === 'todo')
  const shoppingPending = shopping.filter((s) => !s.isCompleted)
  const expiringDocs = documents.filter((d) => {
    if (!d.expiresAt) return false
    const days = Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 30 && days >= 0
  })

  const quickCards = [
    {
      label: t('navbar.calendar'),
      icon: CheckSquare,
      color: 'text-indigo-400',
      bg: 'bg-indigo-900/30',
      border: 'border-indigo-800/50',
      path: '/app/tasks',
      count: pendingTasks.length,
      countLabel: pendingTasks.length > 0 ? t('home.tasksPending') : t('home.allCaughtUp')
    },
    {
      label: t('navbar.shopping'),
      icon: ShoppingCart,
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-800/50',
      path: '/app/shopping',
      count: shoppingPending.length,
      countLabel: shoppingPending.length > 0 ? t('home.itemsToBuy') : t('home.listIsEmpty')
    },
    {
      label: t('navbar.expenses'),
      icon: Receipt,
      color: 'text-orange-400',
      bg: 'bg-orange-900/30',
      border: 'border-orange-800/50',
      path: '/app/expenses',
      count: expenses.length,
      countLabel: expenses.length > 0 ? t('navbar.expenses').toLowerCase() : t('home.noExpenses')
    },
    {
      label: t('navbar.documents'),
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-900/30',
      border: 'border-blue-800/50',
      path: '/app/documents',
      count: documents.length,
      countLabel: expiringDocs.length > 0 ? `${expiringDocs.length} expire bientôt` : `${documents.length} doc${documents.length !== 1 ? 's' : ''}`
    }
  ]

  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-4">
      {/* Header */}
      <div>
        <p className="text-slate-400 text-sm">{t(`home.${greeting()}`)}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">
          {user?.username ?? 'Utilisateur'} 👋
        </h1>
        {household && (
          <p className="text-slate-500 text-sm mt-1">{household.name}</p>
        )}
      </div>

      {/* Quick access grid */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {t('home.quickActions')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {quickCards.map(({ label, icon: Icon, color, bg, border, path, count, countLabel }) => (
            <button
              key={path}
              onClick={() => navigate({ to: path })}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors active:scale-95',
                bg, border
              )}
            >
              <div className={cn('w-9 h-9 rounded-lg bg-slate-900/50 flex items-center justify-center')}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <div>
                <div className="text-xs text-slate-400">{label}</div>
                <div className="text-lg font-bold text-white">{count}</div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{countLabel}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expiring documents alert */}
      {expiringDocs.length > 0 && (
        <button
          onClick={() => navigate({ to: '/app/documents' })}
          className="flex items-center gap-3 rounded-xl border border-yellow-800/50 bg-yellow-900/20 p-4 text-left"
        >
          <FileText className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <div className="text-sm font-medium text-yellow-300">
              {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expire{expiringDocs.length > 1 ? 'nt' : ''} bientôt
            </div>
            <div className="text-xs text-yellow-500 mt-0.5">Cliquez pour voir</div>
          </div>
        </button>
      )}
    </div>
  )
}
