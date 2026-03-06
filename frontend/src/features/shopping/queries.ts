import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import * as api from './api'
import type { ShoppingItemRecord } from '@/features/types'

export const shoppingKeys = {
  all: (householdId: string) => ['shopping', householdId] as const
}

export function useShoppingItems(householdId: string) {
  return useQuery({
    queryKey: shoppingKeys.all(householdId),
    queryFn: () => api.getShoppingItems(householdId),
    enabled: !!householdId
  })
}

export function useCreateShoppingItem(householdId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createShoppingItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.all(householdId) })
  })
}

export function useUpdateShoppingItem(householdId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShoppingItemRecord> }) =>
      api.updateShoppingItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.all(householdId) })
  })
}

export function useDeleteShoppingItem(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.deleteShoppingItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shoppingKeys.all(householdId) })
    }
  })
}

export function useToggleShoppingItem(householdId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      api.toggleShoppingItem(id, isCompleted),
    onSuccess: () => qc.invalidateQueries({ queryKey: shoppingKeys.all(householdId) })
  })
}
