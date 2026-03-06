import { pb } from '@/lib/pocketbase'
import type { ShoppingItemRecord } from '@/features/types'

type ShoppingInput = Partial<Omit<ShoppingItemRecord, keyof import('@/features/types').PBRecord>>

export async function getShoppingItems(householdId: string): Promise<ShoppingItemRecord[]> {
  const results = await pb.collection('shopping_items').getList(1, 200, {
    filter: `householdId = "${householdId}"`,
    sort: 'isCompleted,name',
    expand: 'addedBy,assignedTo'
  })
  return results.items as unknown as ShoppingItemRecord[]
}

export async function createShoppingItem(data: ShoppingInput): Promise<ShoppingItemRecord> {
  return pb.collection('shopping_items').create(data) as unknown as Promise<ShoppingItemRecord>
}

export async function updateShoppingItem(id: string, data: ShoppingInput): Promise<ShoppingItemRecord> {
  return pb.collection('shopping_items').update(id, data) as unknown as Promise<ShoppingItemRecord>
}

export async function deleteShoppingItem(id: string): Promise<void> {
  await pb.collection('shopping_items').delete(id)
}

export async function toggleShoppingItem(id: string, isCompleted: boolean): Promise<ShoppingItemRecord> {
  return pb.collection('shopping_items').update(id, {
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : ''
  }) as unknown as Promise<ShoppingItemRecord>
}
