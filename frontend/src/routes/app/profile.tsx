import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Copy, Share2, RefreshCw, LogOut, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useHousehold, useHouseholdMembers, useRegenerateInviteCode, useLeaveHousehold } from '@/features/household/queries'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getInitials, formatDate } from '@/lib/utils'
import i18n from '@/i18n'

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const householdId = user?.householdId ?? ''

  const { data: household } = useHousehold(householdId)
  const { data: members = [] } = useHouseholdMembers(householdId)
  const regenerate = useRegenerateInviteCode(householdId)
  const leaveHousehold = useLeaveHousehold()

  async function handleLogout() {
    await logout()
    navigate({ to: '/login' })
  }

  function copyCode() {
    if (!household) return
    navigator.clipboard.writeText(household.inviteCode)
    toast.success(t('household.inviteCodeCopied'))
  }

  function shareCode() {
    if (!household) return
    const text = t('household.shareInviteMessage', { name: household.name, code: household.inviteCode })
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      toast.success(t('household.inviteCodeCopied'))
    }
  }

  async function handleLeave() {
    if (!confirm(t('household.leaveHousehold') + ' ?')) return
    if (!user) return
    await leaveHousehold.mutateAsync(user.id)
    navigate({ to: '/setup' })
  }

  const currentLang = i18n.language

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4">
      {/* User card */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <Avatar className="w-14 h-14">
          <AvatarFallback
            style={{ backgroundColor: user?.color ?? '#6366f1', fontSize: '1.25rem' }}
          >
            {getInitials(user?.username ?? '?')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold text-white">{user?.username}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Household */}
      {household && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('profile.householdManagement')}</p>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{household.name}</p>
                <p className="text-xs text-slate-400">{members.length} membre{members.length > 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Members */}
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-2 py-1">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback style={{ backgroundColor: m.color ?? '#6366f1', fontSize: '0.6rem' }}>
                      {getInitials(m.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-slate-300">{m.username}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Invite code */}
            <div>
              <p className="text-xs text-slate-500 mb-2">{t('household.inviteCode')}</p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
                <span className="flex-1 font-mono text-lg font-bold tracking-widest text-indigo-400">
                  {household.inviteCode}
                </span>
                <button onClick={copyCode} className="p-1.5 rounded hover:bg-slate-700 text-slate-400">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={shareCode} className="p-1.5 rounded hover:bg-slate-700 text-slate-400">
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => regenerate.mutate()}
                  disabled={regenerate.isPending}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerate.isPending ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paramètres</p>

        {/* Language */}
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <p className="text-sm font-medium text-white">{t('profile.language')}</p>
          </div>
          <div className="flex gap-2">
            {(['fr', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  i18n.changeLanguage(lang)
                  localStorage.setItem('tipi-lang', lang)
                }}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentLang === lang ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {lang === 'fr' ? t('profile.french') : t('profile.english')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="flex flex-col gap-3 mt-2">
        <Button variant="outline" className="w-full border-red-800 text-red-400 hover:bg-red-900/20" onClick={handleLeave}>
          {t('household.leaveHousehold')}
        </Button>
        <Button variant="ghost" className="w-full text-slate-400" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          {t('profile.signOut')}
        </Button>
      </div>
    </div>
  )
}
