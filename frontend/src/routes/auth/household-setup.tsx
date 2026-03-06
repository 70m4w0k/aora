import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Home, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { useCreateHousehold, useJoinHousehold } from '@/features/household/queries'

type Mode = 'choose' | 'create' | 'join'

export function HouseholdSetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [mode, setMode] = useState<Mode>('choose')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const createMutation = useCreateHousehold()
  const joinMutation = useJoinHousehold()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!householdName.trim() || !user) return
    try {
      const household = await createMutation.mutateAsync({ name: householdName, userId: user.id })
      setUser({ ...user, householdId: household.id })
      navigate({ to: '/app/' })
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (code.length !== 6 || !user) {
      toast.error(t('household.enterValidCode'))
      return
    }
    try {
      const household = await joinMutation.mutateAsync({ code, userId: user.id })
      setUser({ ...user, householdId: household.id })
      navigate({ to: '/app/' })
    } catch {
      toast.error(t('household.enterValidCode'))
    }
  }

  if (mode === 'choose') {
    return (
      <div className="flex flex-col min-h-dvh bg-slate-950 px-6">
        <div className="flex flex-col justify-center flex-1 gap-8 max-w-sm mx-auto w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{t('household.setupTitle')}</h1>
            <p className="text-slate-400 mt-1 text-sm">{t('household.setupSubtitle')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setMode('create')}
              className="flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-colors hover:border-indigo-500 hover:bg-slate-800"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="font-semibold text-white">{t('household.createTitle')}</div>
                <div className="text-sm text-slate-400 mt-0.5">{t('household.createDescription')}</div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-colors hover:border-green-500 hover:bg-slate-800"
            >
              <div className="w-10 h-10 rounded-lg bg-green-900/50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white">{t('household.joinTitle')}</div>
                <div className="text-sm text-slate-400 mt-0.5">{t('household.joinDescription')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex flex-col min-h-dvh bg-slate-950 px-6">
        <div className="flex flex-col justify-center flex-1 gap-8 max-w-sm mx-auto w-full">
          <button onClick={() => setMode('choose')} className="text-indigo-400 text-sm text-left">← Retour</button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('household.createTitle')}</h1>
          </div>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="householdName">{t('household.householdName')}</Label>
              <Input
                id="householdName"
                placeholder={t('household.namePlaceholder')}
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('household.creating') : t('household.createHousehold')}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 px-6">
      <div className="flex flex-col justify-center flex-1 gap-8 max-w-sm mx-auto w-full">
        <button onClick={() => setMode('choose')} className="text-indigo-400 text-sm text-left">← Retour</button>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('household.joinTitle')}</h1>
        </div>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inviteCode">{t('household.inviteCode')}</Label>
            <Input
              id="inviteCode"
              placeholder="ABCD12"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="tracking-widest text-center text-lg uppercase"
            />
          </div>
          <Button type="submit" size="lg" disabled={joinMutation.isPending}>
            {joinMutation.isPending ? t('household.joining') : t('household.joinHousehold')}
          </Button>
        </form>
      </div>
    </div>
  )
}
