import { pb } from '@/lib/pocketbase'
import type { DocumentRecord } from '@/features/types'

export async function getDocuments(householdId: string): Promise<DocumentRecord[]> {
  const results = await pb.collection('documents').getList(1, 200, {
    filter: `householdId = "${householdId}"`,
    sort: '-created',
    expand: 'uploadedBy'
  })
  return results.items as unknown as DocumentRecord[]
}

export async function createDocument(data: FormData): Promise<DocumentRecord> {
  return pb.collection('documents').create(data) as unknown as Promise<DocumentRecord>
}

export async function updateDocument(id: string, data: FormData | Partial<DocumentRecord>): Promise<DocumentRecord> {
  return pb.collection('documents').update(id, data) as unknown as Promise<DocumentRecord>
}

export async function deleteDocument(id: string): Promise<void> {
  await pb.collection('documents').delete(id)
}

export function getFileUrl(record: DocumentRecord): string {
  if (!record.fileUrl) return ''
  return pb.files.getURL(record, record.fileUrl)
}
