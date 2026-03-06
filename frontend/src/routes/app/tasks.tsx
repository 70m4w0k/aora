import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, CheckCircle2, Circle, Trash2, Pencil, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask } from '@/features/tasks/queries'
import { useHouseholdMembers } from '@/features/household/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatDate, formatRelativeDate } from '@/lib/utils'
import type { TaskRecord, TaskPriority, TaskRecurrence } from '@/features/types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-slate-400',
  medium: 'text-yellow-400',
  high: 'text-red-400'
}

export function TasksPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const householdId = user?.householdId ?? ''

  const { data: tasks = [], isLoading } = useTasks(householdId)
  const { data: members = [] } = useHouseholdMembers(householdId)
  const createTask = useCreateTask(householdId)
  const updateTask = useUpdateTask(householdId)
  const deleteTask = useDeleteTask(householdId)
  const completeTask = useCompleteTask(householdId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null)
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    dueDate: '',
    priority: 'medium' as TaskPriority,
    recurrence: 'none' as TaskRecurrence
  })

  function openCreate() {
    setEditingTask(null)
    setForm({ title: '', description: '', assignedTo: [], dueDate: '', priority: 'medium', recurrence: 'none' })
    setModalOpen(true)
  }

  function openEdit(task: TaskRecord) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      priority: task.priority,
      recurrence: task.recurrence
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Titre requis'); return }
    const data = { ...form, householdId, status: 'todo' as const }
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, data })
    } else {
      await createTask.mutateAsync(data)
    }
    setModalOpen(false)
  }

  async function handleComplete(task: TaskRecord) {
    if (task.status === 'done') {
      await updateTask.mutateAsync({ id: task.id, data: { status: 'todo', completedAt: '', completedBy: '' } })
    } else {
      await completeTask.mutateAsync({ id: task.id, userId: user!.id })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('tasks.deleteConfirm', { title: '' }))) return
    await deleteTask.mutateAsync(id)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
  const todo = filtered.filter((t) => t.status === 'todo')
  const done = filtered.filter((t) => t.status === 'done')

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{t('tasks.title')}</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {t('tasks.addTask')}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'todo', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            {f === 'all' ? t('common.all') : f === 'todo' ? t('tasks.todo') : t('tasks.done')}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-700" />
          <p className="text-slate-500">{t('tasks.noTasks')}</p>
          <Button variant="outline" size="sm" onClick={openCreate}>{t('tasks.createFirstTask')}</Button>
        </div>
      )}

      {/* Todo tasks */}
      {todo.length > 0 && (
        <div className="flex flex-col gap-2">
          {todo.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              members={members}
              onComplete={() => handleComplete(task)}
              onEdit={() => openEdit(task)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}

      {/* Done tasks */}
      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">{t('tasks.done')}</p>
          {done.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              members={members}
              onComplete={() => handleComplete(task)}
              onEdit={() => openEdit(task)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? t('tasks.editTask') : t('tasks.addTask')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('tasks.taskName')}</Label>
              <Input
                placeholder={t('tasks.taskNamePlaceholder')}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('tasks.description')}</Label>
              <Input
                placeholder={t('tasks.descriptionPlaceholder')}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('tasks.priority')}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('tasks.low')}</SelectItem>
                    <SelectItem value="medium">{t('tasks.medium')}</SelectItem>
                    <SelectItem value="high">{t('tasks.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('tasks.recurrence')}</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm((f) => ({ ...f, recurrence: v as TaskRecurrence }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('tasks.none')}</SelectItem>
                    <SelectItem value="daily">{t('tasks.daily')}</SelectItem>
                    <SelectItem value="weekly">{t('tasks.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('tasks.monthly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('tasks.dueDate')}</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskItem({
  task,
  members,
  onComplete,
  onEdit,
  onDelete
}: {
  task: TaskRecord
  members: import('@/features/types').UserRecord[]
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const isDone = task.status === 'done'

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border p-3 transition-colors',
      isDone ? 'border-slate-800 bg-slate-900/50 opacity-60' : 'border-slate-700 bg-slate-800/50'
    )}>
      <button onClick={onComplete} className="mt-0.5 shrink-0">
        {isDone
          ? <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          : <Circle className="w-5 h-5 text-slate-500" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isDone && 'line-through text-slate-500')}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs text-slate-500 mt-0.5">{formatRelativeDate(task.dueDate)}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {task.priority !== 'medium' && (
            <span className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
              {task.priority === 'high' ? '↑' : '↓'} {t(`tasks.${task.priority}`)}
            </span>
          )}
          {task.recurrence !== 'none' && (
            <Badge variant="secondary" className="text-[10px] py-0">↻ {t(`tasks.${task.recurrence}`)}</Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
