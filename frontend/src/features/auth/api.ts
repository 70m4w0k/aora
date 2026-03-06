import { pb } from '@/lib/pocketbase'
import type { UserRecord } from '@/features/types'

export async function signIn(email: string, password: string) {
  const result = await pb.collection('users').authWithPassword(email, password)
  return result.record as unknown as UserRecord
}

export async function signUp(data: {
  username: string
  email: string
  password: string
  passwordConfirm: string
}) {
  const record = await pb.collection('users').create(data)
  await pb.collection('users').authWithPassword(data.email, data.password)
  return record as unknown as UserRecord
}

export async function getMe() {
  const record = await pb.collection('users').authRefresh()
  return record.record as unknown as UserRecord
}

export async function updateProfile(id: string, data: FormData | Partial<UserRecord>) {
  return pb.collection('users').update(id, data) as unknown as Promise<UserRecord>
}
