import { create } from 'zustand'
import { pb } from '@/lib/pocketbase'

interface UserRecord {
  id: string
  email: string
  username: string
  avatar?: string
  color?: string
  householdId?: string
}

interface AuthState {
  user: UserRecord | null
  isAuthenticated: boolean
  setUser: (user: UserRecord | null) => void
  logout: () => Promise<void>
}

function mapAuthModel(model: ReturnType<typeof pb.authStore.model>): UserRecord | null {
  if (!model) return null
  return {
    id: model.id as string,
    email: model.email as string,
    username: (model.username as string) ?? (model.name as string) ?? '',
    avatar: model.avatar as string | undefined,
    color: model.color as string | undefined,
    householdId: model.householdId as string | undefined
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mapAuthModel(pb.authStore.model),
  isAuthenticated: pb.authStore.isValid,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: async () => {
    pb.authStore.clear()
    set({ user: null, isAuthenticated: false })
  }
}))

// Sync with PocketBase auth changes
pb.authStore.onChange(() => {
  useAuthStore.getState().setUser(mapAuthModel(pb.authStore.model))
})
