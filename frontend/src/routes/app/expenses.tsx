import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Pencil, Receipt, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import {
  useExpenses, useSettlements, useCreateExpense, useUpdateExpense,
  useDeleteExpense, useCreateSettlement
} from '@/features/expenses/queries'
import { useHouseholdMembers } from '@/features/household/queries'
import { computeBalances } from '@/features/expenses/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { ExpenseCategory, ExpenseRecord, ExpenseSplit } from '@/features/types'

const CATEGORIES: ExpenseCategory[] = ['food', 'groceries', 'rent', 'utilities', 'transport', 'entertainment', 'shopping', 'health', 'other']

export function ExpensesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const householdId = user?.householdId ?? ''

  const { data: expenses = [], isLoading } = useExpenses(householdId)
  const { data: settlements = [] } = useSettlements(householdId)
  const { data: members = [] } = useHouseholdMembers(householdId)
  const createExpense = useCreateExpense(householdId)
  const updateExpense = useUpdateExpense(householdId)
  const deleteExpense = useDeleteExpense(householdId)
  const createSettlement = useCreateSettlement(householdId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null)
  const [settlementModalOpen, setSettlementModalOpen] = useState(false)
  const [settlementTarget, setSettlementTarget] = useState<{ fromId: string; toId: string; max: number } | null>(null)

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    date: new Date().toISOString().slice(0, 10),
    paidBy: user?.id ?? '',
    splitIds: members.map((m) => m.id)
  })

  function openCreate() {
    setEditingExpense(null)
    setForm({ description: '', amount: '', category: 'other', date: new Date().toISOString().slice(0, 10), paidBy: user?.id ?? '', splitIds: members.map((m) => m.id) })
    setModalOpen(true)
  }

  function openEdit(expense: ExpenseRecord) {
    setEditingExpense(expense)
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.slice(0, 10),
      paidBy: expense.paidBy,
      splitIds: expense.splits.map((s) => s.userId)
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.description || isNaN(amount) || amount <= 0) { return }
    const perPerson = amount / form.splitIds.length
    const splits: ExpenseSplit[] = form.splitIds.map((id) => ({ userId: id, amount: parseFloat(perPerson.toFixed(2)) }))
    const data = { description: form.description, amount, category: form.category, date: form.date, paidBy: form.paidBy, householdId, splits }
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, data })
    } else {
      await createExpense.mutateAsync(data)
    }
    setModalOpen(false)
  }

  const memberIds = members.map((m) => m.id)
  const balances = computeBalances(expenses, settlements, memberIds)

  // Compute net balances for current user
  const myBalances: { memberId: string; amount: number }[] = []
  if (user) {
    for (const m of members) {
      if (m.id === user.id) continue
      const iOwe = balances.get(user.id)?.get(m.id) ?? 0
      const theyOwe = balances.get(m.id)?.get(user.id) ?? 0
      const net = iOwe - theyOwe
      if (Math.abs(net) > 0.01) {
        myBalances.push({ memberId: m.id, amount: net })
      }
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{t('expenses.title')}</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {t('expenses.addExpense')}
        </Button>
      </div>

      {/* Total */}
      <div className="rounded-xl border border-orange-800/50 bg-orange-900/20 p-4">
        <div className="text-xs text-orange-400 font-medium">{t('expenses.totalExpenses')}</div>
        <div className="text-2xl font-bold text-white mt-1">{formatCurrency(totalExpenses)}</div>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="w-full">
          <TabsTrigger value="expenses" className="flex-1">{t('expenses.title')}</TabsTrigger>
          <TabsTrigger value="balances">{t('expenses.balance')}</TabsTrigger>
        </TabsList>

        {/* Expenses list */}
        <TabsContent value="expenses">
          {isLoading && <div className="flex flex-col gap-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />)}</div>}
          {!isLoading && expenses.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Receipt className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500">{t('expenses.noExpenses')}</p>
              <Button variant="outline" size="sm" onClick={openCreate}>{t('expenses.addFirstExpense')}</Button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {expenses.map((expense) => {
              const payer = members.find((m) => m.id === expense.paidBy)
              return (
                <div key={expense.id} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-900/40 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{expense.description}</p>
                    <p className="text-xs text-slate-500">{payer?.username ?? 'Inconnu'} · {formatDate(expense.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-white">{formatCurrency(expense.amount)}</span>
                    <button onClick={() => openEdit(expense)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteExpense.mutate(expense.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Balances */}
        <TabsContent value="balances">
          {myBalances.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center">
                <Minus className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-medium text-white">{t('expenses.allSettled')}</p>
              <p className="text-sm text-slate-500">{t('expenses.noOutstandingBalances')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('expenses.whoOwesWhom')}</p>
              {myBalances.map(({ memberId, amount }) => {
                const member = members.find((m) => m.id === memberId)
                const iOwe = amount > 0
                return (
                  <div key={memberId} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback style={{ backgroundColor: member?.color ?? '#6366f1' }}>
                        {getInitials(member?.username ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{member?.username ?? 'Inconnu'}</p>
                      <p className={cn('text-xs', iOwe ? 'text-red-400' : 'text-green-400')}>
                        {iOwe ? `Vous devez ${formatCurrency(Math.abs(amount))}` : `Vous doit ${formatCurrency(Math.abs(amount))}`}
                      </p>
                    </div>
                    {iOwe && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setSettlementTarget({ fromId: user!.id, toId: memberId, max: Math.abs(amount) })
                        setSettlementModalOpen(true)
                      }}>
                        Régler
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Expense modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? t('expenses.editExpense') : t('expenses.addExpense')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('expenses.description')}</Label>
              <Input placeholder={t('expenses.descriptionPlaceholder')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('expenses.amount')} (€)</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('expenses.category')}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`expenses.${c}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t('expenses.paidBy')}</Label>
                <Select value={form.paidBy} onValueChange={(v) => setForm((f) => ({ ...f, paidBy: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.username}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t('calendar.start')}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('expenses.splitBetween')}</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const isSelected = form.splitIds.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        splitIds: isSelected ? f.splitIds.filter((id) => id !== m.id) : [...f.splitIds, m.id]
                      }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        isSelected ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
                      )}
                    >
                      {m.username}
                    </button>
                  )
                })}
              </div>
              {form.splitIds.length > 0 && form.amount && (
                <p className="text-xs text-slate-400">
                  {formatCurrency(parseFloat(form.amount) / form.splitIds.length)} par personne
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settlement modal */}
      {settlementTarget && (
        <SettlementModal
          open={settlementModalOpen}
          onOpenChange={setSettlementModalOpen}
          fromId={settlementTarget.fromId}
          toId={settlementTarget.toId}
          maxAmount={settlementTarget.max}
          members={members}
          onConfirm={async (amount, notes) => {
            await createSettlement.mutateAsync({
              fromUser: settlementTarget.fromId,
              toUser: settlementTarget.toId,
              amount,
              date: new Date().toISOString().slice(0, 10),
              notes,
              householdId
            })
            setSettlementModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function SettlementModal({ open, onOpenChange, fromId, toId, maxAmount, members, onConfirm }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  fromId: string
  toId: string
  maxAmount: number
  members: import('@/features/types').UserRecord[]
  onConfirm: (amount: number, notes: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState(maxAmount.toFixed(2))
  const [notes, setNotes] = useState('')
  const toMember = members.find((m) => m.id === toId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('expenses.recordSettlement')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Règlement à <span className="text-white font-medium">{toMember?.username}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            <Label>{t('expenses.amountToSettle')} (€)</Label>
            <Input type="number" step="0.01" min="0" max={maxAmount} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes (optionnel)</Label>
            <Input placeholder="ex: Virement, Espèces..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => onConfirm(parseFloat(amount), notes)}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
