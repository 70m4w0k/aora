import { pb } from '@/lib/pocketbase'
import { generateInviteCode } from '@/lib/utils'
import type { HouseholdRecord, UserRecord } from '@/features/types'

export async function createHousehold(name: string, userId: string): Promise<HouseholdRecord> {
  const household = await pb.collection('households').create({
    name,
    inviteCode: generateInviteCode(),
    createdBy: userId
  }) as unknown as HouseholdRecord

  await pb.collection('users').update(userId, { householdId: household.id })
  return household
}

export async function joinHousehold(code: string, userId: string): Promise<HouseholdRecord> {
  const results = await pb.collection('households').getList(1, 1, {
    filter: `inviteCode = "${code.toUpperCase()}"`
  })
  if (results.items.length === 0) throw new Error('Invalid invite code')
  const household = results.items[0] as unknown as HouseholdRecord
  await pb.collection('users').update(userId, { householdId: household.id })
  return household
}

export async function getHousehold(id: string): Promise<HouseholdRecord> {
  return pb.collection('households').getOne(id) as unknown as Promise<HouseholdRecord>
}

export async function getHouseholdMembers(householdId: string): Promise<UserRecord[]> {
  const results = await pb.collection('users').getList(1, 50, {
    filter: `householdId = "${householdId}"`
  })
  return results.items as unknown as UserRecord[]
}

export async function regenerateInviteCode(householdId: string): Promise<HouseholdRecord> {
  return pb.collection('households').update(householdId, {
    inviteCode: generateInviteCode()
  }) as unknown as Promise<HouseholdRecord>
}

export async function leaveHousehold(userId: string): Promise<void> {
  await pb.collection('users').update(userId, { householdId: '' })
}
