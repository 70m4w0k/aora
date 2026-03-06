import { Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { pb } from '@/lib/pocketbase'

export function RootLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Refresh auth on mount
    if (pb.authStore.isValid) {
      pb.collection('users').authRefresh().catch(() => {
        pb.authStore.clear()
      })
    }
  }, [])

  return (
    <>
      <Outlet />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc'
          }
        }}
      />
    </>
  )
}
