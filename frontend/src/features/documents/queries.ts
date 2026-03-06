import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import * as api from './api'

export const documentKeys = {
  all: (householdId: string) => ['documents', householdId] as const
}

export function useDocuments(householdId: string) {
  return useQuery({
    queryKey: documentKeys.all(householdId),
    queryFn: () => api.getDocuments(householdId),
    enabled: !!householdId
  })
}

export function useCreateDocument(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.createDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all(householdId) })
      toast.success(t('documents.documentAdded'))
    }
  })
}

export function useUpdateDocument(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Partial<import('@/features/types').DocumentRecord> }) =>
      api.updateDocument(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all(householdId) })
      toast.success(t('documents.documentUpdated'))
    }
  })
}

export function useDeleteDocument(householdId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: api.deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all(householdId) })
      toast.success(t('documents.documentDeleted'))
    }
  })
}
