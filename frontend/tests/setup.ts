import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock PocketBase
vi.mock('@/lib/pocketbase', () => ({
  pb: {
    authStore: {
      isValid: false,
      model: null,
      clear: vi.fn(),
      onChange: vi.fn()
    },
    collection: vi.fn().mockReturnValue({
      authWithPassword: vi.fn(),
      authRefresh: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getList: vi.fn(),
      getOne: vi.fn()
    }),
    files: { getURL: vi.fn() }
  }
}))
