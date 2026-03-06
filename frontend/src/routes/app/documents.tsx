import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, Trash2, Pencil, Download, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument } from '@/features/documents/queries'
import { getFileUrl } from '@/features/documents/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatDate } from '@/lib/utils'
import type { DocumentCategory, DocumentRecord } from '@/features/types'

const CATEGORIES: DocumentCategory[] = ['bills', 'insurance', 'contracts', 'receipts', 'other']

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  bills: 'text-orange-400',
  insurance: 'text-blue-400',
  contracts: 'text-purple-400',
  receipts: 'text-green-400',
  other: 'text-slate-400'
}

function daysUntilExpiry(expiresAt: string) {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function DocumentsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const householdId = user?.householdId ?? ''

  const { data: documents = [], isLoading } = useDocuments(householdId)
  const createDoc = useCreateDocument(householdId)
  const updateDoc = useUpdateDocument(householdId)
  const deleteDoc = useDeleteDocument(householdId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all')
  const [form, setForm] = useState({ title: '', category: 'other' as DocumentCategory, description: '', expiresAt: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function openCreate() {
    setEditingDoc(null)
    setForm({ title: '', category: 'other', description: '', expiresAt: '' })
    setSelectedFile(null)
    setModalOpen(true)
  }

  function openEdit(doc: DocumentRecord) {
    setEditingDoc(doc)
    setForm({ title: doc.title, category: doc.category, description: doc.description, expiresAt: doc.expiresAt ? doc.expiresAt.slice(0, 10) : '' })
    setSelectedFile(null)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('category', form.category)
    fd.append('description', form.description)
    fd.append('householdId', householdId)
    fd.append('uploadedBy', user!.id)
    if (form.expiresAt) fd.append('expiresAt', form.expiresAt)
    if (selectedFile) fd.append('fileUrl', selectedFile)

    if (editingDoc) {
      await updateDoc.mutateAsync({ id: editingDoc.id, data: fd })
    } else {
      await createDoc.mutateAsync(fd)
    }
    setModalOpen(false)
  }

  const filtered = categoryFilter === 'all' ? documents : documents.filter((d) => d.category === categoryFilter)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{t('documents.title')}</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {t('documents.addDocument')}
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
            categoryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')}
        >
          {t('common.all')}
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
              categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')}>
            {t(`documents.${c}`)}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex flex-col gap-2">{[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />)}</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <FileText className="w-12 h-12 text-slate-700" />
          <p className="text-slate-500">{t('documents.noDocuments')}</p>
          <Button variant="outline" size="sm" onClick={openCreate}>{t('documents.addDocument')}</Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((doc) => {
          const days = daysUntilExpiry(doc.expiresAt)
          const isExpired = days !== null && days < 0
          const isExpiringSoon = days !== null && days >= 0 && days <= 30
          const fileUrl = getFileUrl(doc)

          return (
            <div key={doc.id} className={cn(
              'flex items-start gap-3 rounded-xl border p-3 transition-colors',
              isExpired ? 'border-red-800/50 bg-red-900/10' :
              isExpiringSoon ? 'border-yellow-800/50 bg-yellow-900/10' :
              'border-slate-700 bg-slate-800/50'
            )}>
              <div className="w-9 h-9 rounded-lg bg-slate-900/80 flex items-center justify-center shrink-0">
                <FileText className={cn('w-4 h-4', CATEGORY_COLORS[doc.category])} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] py-0">{t(`documents.${doc.category}`)}</Badge>
                  {isExpired && (
                    <span className="text-xs text-red-400 flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />{t('documents.expired')}
                    </span>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <span className="text-xs text-yellow-400">
                      {t('documents.expiresIn', { days })}
                    </span>
                  )}
                  {doc.expiresAt && !isExpired && !isExpiringSoon && (
                    <span className="text-xs text-slate-500">{formatDate(doc.expiresAt)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {fileUrl && (
                  <a href={fileUrl} target="_blank" rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => openEdit(doc)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteDoc.mutate(doc.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoc ? t('documents.editDocument') : t('documents.addDocument')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('documents.name')}</Label>
              <Input placeholder={t('documents.namePlaceholder')} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('documents.category')}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as DocumentCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`documents.${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('documents.expiresAt')}</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('documents.description')}</Label>
              <Input placeholder={t('documents.descriptionPlaceholder')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('documents.attachFile')}</Label>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-600 p-3 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-300 transition-colors">
                <FileText className="w-4 h-4" />
                {selectedFile ? selectedFile.name : (editingDoc?.fileUrl ? 'Remplacer le fichier' : 'Choisir un fichier')}
              </button>
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
