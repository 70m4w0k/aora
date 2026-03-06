import { create } from 'zustand'

interface UIState {
  // Modal visibility
  taskModalOpen: boolean
  taskModalId: string | null
  shoppingModalOpen: boolean
  shoppingModalId: string | null
  expenseModalOpen: boolean
  expenseModalId: string | null
  documentModalOpen: boolean
  documentModalId: string | null
  eventModalOpen: boolean
  eventModalId: string | null

  openTaskModal: (id?: string) => void
  closeTaskModal: () => void
  openShoppingModal: (id?: string) => void
  closeShoppingModal: () => void
  openExpenseModal: (id?: string) => void
  closeExpenseModal: () => void
  openDocumentModal: (id?: string) => void
  closeDocumentModal: () => void
  openEventModal: (id?: string) => void
  closeEventModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  taskModalOpen: false,
  taskModalId: null,
  shoppingModalOpen: false,
  shoppingModalId: null,
  expenseModalOpen: false,
  expenseModalId: null,
  documentModalOpen: false,
  documentModalId: null,
  eventModalOpen: false,
  eventModalId: null,

  openTaskModal: (id) => set({ taskModalOpen: true, taskModalId: id ?? null }),
  closeTaskModal: () => set({ taskModalOpen: false, taskModalId: null }),
  openShoppingModal: (id) => set({ shoppingModalOpen: true, shoppingModalId: id ?? null }),
  closeShoppingModal: () => set({ shoppingModalOpen: false, shoppingModalId: null }),
  openExpenseModal: (id) => set({ expenseModalOpen: true, expenseModalId: id ?? null }),
  closeExpenseModal: () => set({ expenseModalOpen: false, expenseModalId: null }),
  openDocumentModal: (id) => set({ documentModalOpen: true, documentModalId: id ?? null }),
  closeDocumentModal: () => set({ documentModalOpen: false, documentModalId: null }),
  openEventModal: (id) => set({ eventModalOpen: true, eventModalId: id ?? null }),
  closeEventModal: () => set({ eventModalOpen: false, eventModalId: null })
}))
