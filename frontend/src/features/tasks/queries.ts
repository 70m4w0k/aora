import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import * as api from './api'
import type { TaskRecord } from '@/features/types'

export const taskKeys = {
  all: (householdId: string) => ['tasks', householdId] as const,
}

export function useTasks(householdId: string) {
  return useQuery({
    queryKey: taskKeys.all(householdId),
    queryFn: () => api.getTasks(householdId),
    enabled: !!householdId
  })
}

export function useCreateTask(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(householdId) })
      toast.success(t('tasks.taskCreated'))
    }
  })
}

export function useUpdateTask(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskRecord> }) => api.updateTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(householdId) })
      toast.success(t('tasks.taskUpdated'))
    }
  })
}

export function useDeleteTask(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(householdId) })
      toast.success(t('tasks.taskDeleted'))
    }
  })
}

export function useCompleteTask(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => api.completeTask(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(householdId) })
      toast.success(t('tasks.taskCompleted'))
    }
  })
}
