import { describe, it, expect } from 'vitest'
import { computeBalances } from '@/features/expenses/api'
import type { ExpenseRecord, SettlementRecord } from '@/features/types'

function makeExpense(overrides: Partial<ExpenseRecord>): ExpenseRecord {
  return {
    id: 'e1',
    created: '',
    updated: '',
    collectionId: '',
    collectionName: '',
    description: 'Test',
    amount: 0,
    category: 'other',
    date: '2024-01-01',
    paidBy: '',
    householdId: '',
    splits: [],
    receiptUrl: '',
    isSettled: false,
    ...overrides
  }
}

function makeSettlement(overrides: Partial<SettlementRecord>): SettlementRecord {
  return {
    id: 's1',
    created: '',
    updated: '',
    collectionId: '',
    collectionName: '',
    fromUser: '',
    toUser: '',
    amount: 0,
    date: '2024-01-01',
    notes: '',
    householdId: '',
    ...overrides
  }
}

describe('computeBalances', () => {
  const alice = 'alice'
  const bob = 'bob'
  const members = [alice, bob]

  it('alice pays 100, split equally → bob owes alice 50', () => {
    const expenses = [
      makeExpense({
        paidBy: alice,
        amount: 100,
        splits: [
          { userId: alice, amount: 50 },
          { userId: bob, amount: 50 }
        ]
      })
    ]
    const balances = computeBalances(expenses, [], members)
    expect(balances.get(bob)?.get(alice)).toBe(50)
    expect(balances.get(alice)?.get(bob)).toBe(0)
  })

  it('settlement reduces debt', () => {
    const expenses = [
      makeExpense({
        paidBy: alice,
        amount: 100,
        splits: [{ userId: alice, amount: 50 }, { userId: bob, amount: 50 }]
      })
    ]
    const settlements = [makeSettlement({ fromUser: bob, toUser: alice, amount: 30 })]
    const balances = computeBalances(expenses, settlements, members)
    expect(balances.get(bob)?.get(alice)).toBe(20)
  })

  it('full settlement clears debt', () => {
    const expenses = [
      makeExpense({
        paidBy: alice,
        amount: 100,
        splits: [{ userId: alice, amount: 50 }, { userId: bob, amount: 50 }]
      })
    ]
    const settlements = [makeSettlement({ fromUser: bob, toUser: alice, amount: 50 })]
    const balances = computeBalances(expenses, settlements, members)
    expect(balances.get(bob)?.get(alice)).toBe(0)
  })
})
