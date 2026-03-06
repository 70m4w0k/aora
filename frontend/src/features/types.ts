// Shared PocketBase types

export interface PBRecord {
  id: string
  created: string
  updated: string
  collectionId: string
  collectionName: string
}

// Auth
export interface UserRecord extends PBRecord {
  email: string
  username: string
  name: string
  avatar: string
  color: string
  householdId: string
  verified: boolean
}

// Household
export interface HouseholdRecord extends PBRecord {
  name: string
  inviteCode: string
  createdBy: string
  expand?: { members?: UserRecord[] }
}

// Tasks
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'
export type TaskStatus = 'todo' | 'done'

export interface TaskRecord extends PBRecord {
  title: string
  description: string
  householdId: string
  assignedTo: string[]
  dueDate: string
  recurrence: TaskRecurrence
  priority: TaskPriority
  status: TaskStatus
  completedAt: string
  completedBy: string
  expand?: { assignedTo?: UserRecord[]; completedBy?: UserRecord }
}

// Events
export type EventCategory = 'meeting' | 'reminder' | 'personal' | 'work' | 'social' | 'other'

export interface EventRecord extends PBRecord {
  title: string
  description: string
  householdId: string
  assignedTo: string[]
  startDate: string
  endDate: string
  category: EventCategory
  isAllDay: boolean
  color: string
  expand?: { assignedTo?: UserRecord[] }
}

// Shopping
export type ShoppingCategory = 'groceries' | 'household' | 'personal' | 'other'

export interface ShoppingItemRecord extends PBRecord {
  name: string
  quantity: number
  unit: string
  category: ShoppingCategory
  isCompleted: boolean
  householdId: string
  addedBy: string
  assignedTo: string
  completedAt: string
  expand?: { addedBy?: UserRecord; assignedTo?: UserRecord }
}

// Expenses
export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'rent'
  | 'utilities'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'other'

export interface ExpenseSplit {
  userId: string
  amount: number
}

export interface ExpenseRecord extends PBRecord {
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  paidBy: string
  householdId: string
  splits: ExpenseSplit[]
  receiptUrl: string
  isSettled: boolean
  expand?: { paidBy?: UserRecord }
}

export interface SettlementRecord extends PBRecord {
  fromUser: string
  toUser: string
  amount: number
  date: string
  notes: string
  householdId: string
  expand?: { fromUser?: UserRecord; toUser?: UserRecord }
}

// Documents
export type DocumentCategory = 'bills' | 'insurance' | 'contracts' | 'receipts' | 'other'

export interface DocumentRecord extends PBRecord {
  title: string
  category: DocumentCategory
  fileUrl: string
  fileName: string
  householdId: string
  uploadedBy: string
  expiresAt: string
  description: string
  expand?: { uploadedBy?: UserRecord }
}
