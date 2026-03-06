import { pb } from '@/lib/pocketbase'
import type { TaskRecord } from '@/features/types'

type TaskInput = Partial<Omit<TaskRecord, keyof import('@/features/types').PBRecord>>

export async function getTasks(householdId: string): Promise<TaskRecord[]> {
  const results = await pb.collection('tasks').getList(1, 200, {
    filter: `householdId = "${householdId}"`,
    sort: '-created',
    expand: 'assignedTo,completedBy'
  })
  return results.items as unknown as TaskRecord[]
}

export async function createTask(data: TaskInput): Promise<TaskRecord> {
  return pb.collection('tasks').create(data) as unknown as Promise<TaskRecord>
}

export async function updateTask(id: string, data: TaskInput): Promise<TaskRecord> {
  return pb.collection('tasks').update(id, data) as unknown as Promise<TaskRecord>
}

export async function deleteTask(id: string): Promise<void> {
  await pb.collection('tasks').delete(id)
}

export async function completeTask(id: string, userId: string): Promise<TaskRecord> {
  return pb.collection('tasks').update(id, {
    status: 'done',
    completedAt: new Date().toISOString(),
    completedBy: userId
  }) as unknown as Promise<TaskRecord>
}

export async function reopenTask(id: string): Promise<TaskRecord> {
  return pb.collection('tasks').update(id, {
    status: 'todo',
    completedAt: '',
    completedBy: ''
  }) as unknown as Promise<TaskRecord>
}
