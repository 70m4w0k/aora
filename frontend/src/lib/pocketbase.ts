import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL ?? 'http://localhost:8090'

export const pb = new PocketBase(pbUrl)

// Keep auth store in sync
pb.authStore.onChange(() => {
  // noop — components subscribe via useAuthStore
})

export type AuthModel = typeof pb.authStore.model
