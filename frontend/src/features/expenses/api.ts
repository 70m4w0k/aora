import { pb } from '@/lib/pocketbase'
import type { ExpenseRecord, SettlementRecord, ExpenseSplit } from '@/features/types'

type ExpenseInput = {
  description: string
  amount: number
  category: string
  date: string
  paidBy: string
  householdId: string
  splits: ExpenseSplit[]
}

export async function getExpenses(householdId: string): Promise<ExpenseRecord[]> {
  const results = await pb.collection('expenses').getList(1, 200, {
    filter: `householdId = "${householdId}"`,
    sort: '-date',
    expand: 'paidBy'
  })
  return results.items as unknown as ExpenseRecord[]
}

export async function createExpense(data: ExpenseInput): Promise<ExpenseRecord> {
  return pb.collection('expenses').create(data) as unknown as Promise<ExpenseRecord>
}

export async function updateExpense(id: string, data: Partial<ExpenseInput>): Promise<ExpenseRecord> {
  return pb.collection('expenses').update(id, data) as unknown as Promise<ExpenseRecord>
}

export async function deleteExpense(id: string): Promise<void> {
  await pb.collection('expenses').delete(id)
}

export async function getSettlements(householdId: string): Promise<SettlementRecord[]> {
  const results = await pb.collection('expense_settlements').getList(1, 200, {
    filter: `householdId = "${householdId}"`,
    sort: '-date',
    expand: 'fromUser,toUser'
  })
  return results.items as unknown as SettlementRecord[]
}

export async function createSettlement(data: {
  fromUser: string
  toUser: string
  amount: number
  date: string
  notes: string
  householdId: string
}): Promise<SettlementRecord> {
  return pb.collection('expense_settlements').create(data) as unknown as Promise<SettlementRecord>
}

export async function deleteSettlement(id: string): Promise<void> {
  await pb.collection('expense_settlements').delete(id)
}

export function computeBalances(
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[],
  memberIds: string[]
): Map<string, Map<string, number>> {
  // balances[fromId][toId] = amount fromId owes toId
  const balances = new Map<string, Map<string, number>>()
  for (const id of memberIds) {
    balances.set(id, new Map(memberIds.map((m) => [m, 0])))
  }

  for (const expense of expenses) {
    const paidBy = expense.paidBy
    for (const split of expense.splits) {
      if (split.userId === paidBy) continue
      const fromMap = balances.get(split.userId)
      if (fromMap) {
        fromMap.set(paidBy, (fromMap.get(paidBy) ?? 0) + split.amount)
      }
    }
  }

  for (const s of settlements) {
    const fromMap = balances.get(s.fromUser)
    if (fromMap) {
      fromMap.set(s.toUser, (fromMap.get(s.toUser) ?? 0) - s.amount)
    }
  }

  return balances
}
