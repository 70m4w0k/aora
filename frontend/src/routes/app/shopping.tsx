import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Check, Trash2, Pencil, ShoppingCart } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useShoppingItems, useCreateShoppingItem, useUpdateShoppingItem, useDeleteShoppingItem, useToggleShoppingItem } from '@/features/shopping/queries'
import { useHouseholdMembers } from '@/features/household/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ShoppingCategory, ShoppingItemRecord } from '@/features/types'

const CATEGORY_COLORS: Record<ShoppingCategory, string> = {
  groceries: 'shopping',
  household: 'secondary',
  personal: 'default',
  other: 'secondary'
}

export function ShoppingPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const householdId = user?.householdId ?? ''

  const { data: items = [], isLoading } = useShoppingItems(householdId)
  const { data: members = [] } = useHouseholdMembers(householdId)
  const createItem = useCreateShoppingItem(householdId)
  const updateItem = useUpdateShoppingItem(householdId)
  const deleteItem = useDeleteShoppingItem(householdId)
  const toggleItem = useToggleShoppingItem(householdId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingItemRecord | null>(null)
  const [form, setForm] = useState({ name: '', quantity: '1', unit: '', category: 'groceries' as ShoppingCategory, assignedTo: '' })
  const [categoryFilter, setCategoryFilter] = useState<ShoppingCategory | 'all'>('all')

  function openCreate() {
    setEditingItem(null)
    setForm({ name: '', quantity: '1', unit: '', category: 'groceries', assignedTo: '' })
    setModalOpen(true)
  }

  function openEdit(item: ShoppingItemRecord) {
    setEditingItem(item)
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
      assignedTo: item.assignedTo
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const data = {
      name: form.name,
      quantity: Number(form.quantity) || 1,
      unit: form.unit,
      category: form.category,
      assignedTo: form.assignedTo || undefined,
      householdId,
      addedBy: user!.id,
      isCompleted: false
    }
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data })
    } else {
      await createItem.mutateAsync(data)
    }
    setModalOpen(false)
  }

  const categories: ShoppingCategory[] = ['groceries', 'household', 'personal', 'other']
  const filtered = categoryFilter === 'all' ? items : items.filter((i) => i.category === categoryFilter)
  const pending = filtered.filter((i) => !i.isCompleted)
  const completed = filtered.filter((i) => i.isCompleted)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{t('shopping.title')}</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {t('shopping.addItem')}
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
            categoryFilter === 'all' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400')}
        >
          {t('common.all')}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
              categoryFilter === c ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400')}
          >
            {t(`shopping.${c}`)}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex flex-col gap-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-800 animate-pulse" />)}</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-700" />
          <p className="text-slate-500">{t('shopping.noItems')}</p>
          <Button variant="outline" size="sm" onClick={openCreate}>{t('shopping.addFirstItem')}</Button>
        </div>
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          {pending.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={() => toggleItem.mutate({ id: item.id, isCompleted: true })}
              onEdit={() => openEdit(item)}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* Completed items */}
      {completed.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">{t('tasks.done')}</p>
          {completed.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={() => toggleItem.mutate({ id: item.id, isCompleted: false })}
              onEdit={() => openEdit(item)}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? t('shopping.editItem') : t('shopping.addItem')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('shopping.itemName')}</Label>
              <Input
                placeholder={t('shopping.itemNamePlaceholder')}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('shopping.quantity')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('shopping.unit')}</Label>
                <Input
                  placeholder="kg, L, pcs..."
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('shopping.category')}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ShoppingCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{t(`shopping.${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShoppingItem({ item, onToggle, onEdit, onDelete }: {
  item: ShoppingItemRecord
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border p-3 transition-colors',
      item.isCompleted ? 'border-slate-800 bg-slate-900/50 opacity-60' : 'border-slate-700 bg-slate-800/50'
    )}>
      <button
        onClick={onToggle}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          item.isCompleted ? 'border-green-500 bg-green-500' : 'border-slate-500 hover:border-green-400'
        )}
      >
        {item.isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', item.isCompleted && 'line-through text-slate-500')}>
          {item.quantity > 1 ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''} ` : ''}{item.name}
        </p>
        <Badge variant={CATEGORY_COLORS[item.category] as 'shopping'} className="mt-0.5 text-[10px] py-0">
          {t(`shopping.${item.category}`)}
        </Badge>
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
