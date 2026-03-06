import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth.store'
import * as api from './api'

export const householdKeys = {
  detail: (id: string) => ['household', id] as const,
  members: (id: string) => ['household', id, 'members'] as const
}

export function useHousehold(id: string) {
  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: () => api.getHousehold(id),
    enabled: !!id
  })
}

export function useHouseholdMembers(householdId: string) {
  return useQuery({
    queryKey: householdKeys.members(householdId),
    queryFn: () => api.getHouseholdMembers(householdId),
    enabled: !!householdId
  })
}

export function useCreateHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, userId }: { name: string; userId: string }) =>
      api.createHousehold(name, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household'] })
  })
}

export function useJoinHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, userId }: { code: string; userId: string }) =>
      api.joinHousehold(code, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household'] })
  })
}

export function useRegenerateInviteCode(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: () => api.regenerateInviteCode(householdId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.detail(householdId) })
      toast.success(t('household.codeRegenerated'))
    }
  })
}

export function useLeaveHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.leaveHousehold(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household'] })
  })
}
