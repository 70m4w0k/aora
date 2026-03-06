import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import * as api from './api'

export const expenseKeys = {
  all: (householdId: string) => ['expenses', householdId] as const,
  settlements: (householdId: string) => ['settlements', householdId] as const
}

export function useExpenses(householdId: string) {
  return useQuery({
    queryKey: expenseKeys.all(householdId),
    queryFn: () => api.getExpenses(householdId),
    enabled: !!householdId
  })
}

export function useSettlements(householdId: string) {
  return useQuery({
    queryKey: expenseKeys.settlements(householdId),
    queryFn: () => api.getSettlements(householdId),
    enabled: !!householdId
  })
}

export function useCreateExpense(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all(householdId) })
      toast.success(t('expenses.expenseAdded'))
    }
  })
}

export function useUpdateExpense(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateExpense>[1] }) =>
      api.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all(householdId) })
      toast.success(t('expenses.expenseUpdated'))
    }
  })
}

export function useDeleteExpense(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all(householdId) })
      toast.success(t('expenses.expenseDeleted'))
    }
  })
}

export function useCreateSettlement(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.createSettlement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.settlements(householdId) })
      qc.invalidateQueries({ queryKey: expenseKeys.all(householdId) })
      toast.success(t('expenses.settlementRecorded'))
    }
  })
}

export function useDeleteSettlement(householdId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteSettlement,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.settlements(householdId) })
  })
}
