/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  // households
  const householdsCollection = new Collection({
    id: 'households',
    name: 'households',
    type: 'base',
    system: false,
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'inviteCode', type: 'text', required: true },
      { name: 'createdBy', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false } }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_invite_code ON households (inviteCode)'],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id = createdBy',
    deleteRule: '@request.auth.id = createdBy'
  })
  db.saveCollection(householdsCollection)

  // Extend users collection with householdId and extra fields
  const usersCollection = db.findCollectionByNameOrId('users')
  usersCollection.schema.addField(new SchemaField({ name: 'username', type: 'text', required: false }))
  usersCollection.schema.addField(new SchemaField({ name: 'color', type: 'text', required: false }))
  usersCollection.schema.addField(new SchemaField({
    name: 'householdId',
    type: 'relation',
    required: false,
    options: { collectionId: 'households', cascadeDelete: false }
  }))
  db.saveCollection(usersCollection)

  // tasks
  const tasksCollection = new Collection({
    id: 'tasks',
    name: 'tasks',
    type: 'base',
    system: false,
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'householdId', type: 'relation', required: true, options: { collectionId: 'households', cascadeDelete: true } },
      { name: 'assignedTo', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: null } },
      { name: 'dueDate', type: 'date', required: false },
      { name: 'recurrence', type: 'select', options: { maxSelect: 1, values: ['none', 'daily', 'weekly', 'monthly'] } },
      { name: 'priority', type: 'select', options: { maxSelect: 1, values: ['low', 'medium', 'high'] } },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['todo', 'done'] } },
      { name: 'completedAt', type: 'date', required: false },
      { name: 'completedBy', type: 'relation', required: false, options: { collectionId: '_pb_users_auth_', cascadeDelete: false } }
    ],
    listRule: '@request.auth.householdId = householdId',
    viewRule: '@request.auth.householdId = householdId',
    createRule: '@request.auth.householdId = householdId',
    updateRule: '@request.auth.householdId = householdId',
    deleteRule: '@request.auth.householdId = householdId'
  })
  db.saveCollection(tasksCollection)

  // events
  const eventsCollection = new Collection({
    id: 'events',
    name: 'events',
    type: 'base',
    system: false,
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'householdId', type: 'relation', required: true, options: { collectionId: 'households', cascadeDelete: true } },
      { name: 'assignedTo', type: 'relation', options: { collectionId: '_pb_users_auth_', maxSelect: null } },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: false },
      { name: 'category', type: 'select', options: { maxSelect: 1, values: ['meeting', 'reminder', 'personal', 'work', 'social', 'other'] } },
      { name: 'isAllDay', type: 'bool' },
      { name: 'color', type: 'text', required: false }
    ],
    listRule: '@request.auth.householdId = householdId',
    viewRule: '@request.auth.householdId = householdId',
    createRule: '@request.auth.householdId = householdId',
    updateRule: '@request.auth.householdId = householdId',
    deleteRule: '@request.auth.householdId = householdId'
  })
  db.saveCollection(eventsCollection)

  // shopping_items
  const shoppingCollection = new Collection({
    id: 'shopping_items',
    name: 'shopping_items',
    type: 'base',
    system: false,
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'quantity', type: 'number', required: false },
      { name: 'unit', type: 'text', required: false },
      { name: 'category', type: 'select', options: { maxSelect: 1, values: ['groceries', 'household', 'personal', 'other'] } },
      { name: 'isCompleted', type: 'bool' },
      { name: 'householdId', type: 'relation', required: true, options: { collectionId: 'households', cascadeDelete: true } },
      { name: 'addedBy', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false } },
      { name: 'assignedTo', type: 'relation', required: false, options: { collectionId: '_pb_users_auth_', cascadeDelete: false } },
      { name: 'completedAt', type: 'date', required: false }
    ],
    listRule: '@request.auth.householdId = householdId',
    viewRule: '@request.auth.householdId = householdId',
    createRule: '@request.auth.householdId = householdId',
    updateRule: '@request.auth.householdId = householdId',
    deleteRule: '@request.auth.householdId = householdId'
  })
  db.saveCollection(shoppingCollection)

  // expenses
  const expensesCollection = new Collection({
    id: 'expenses',
    name: 'expenses',
    type: 'base',
    system: false,
    schema: [
      { name: 'description', type: 'text', required: true },
      { name: 'amount', type: 'number', required: true },
      { name: 'category', type: 'select', options: { maxSelect: 1, values: ['food', 'groceries', 'rent', 'utilities', 'transport', 'entertainment', 'shopping', 'health', 'other'] } },
      { name: 'date', type: 'date', required: true },
      { name: 'paidBy', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false } },
      { name: 'householdId', type: 'relation', required: true, options: { collectionId: 'households', cascadeDelete: true } },
      { name: 'splits', type: 'json', required: false },
      { name: 'receiptUrl', type: 'file', required: false, options: { maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] } },
      { name: 'isSettled', type: 'bool' }
    ],
    listRule: '@request.auth.householdId = householdId',
    viewRule: '@request.auth.householdId = householdId',
    createRule: '@request.auth.householdId = householdId',
    updateRule: '@request.auth.householdId = householdId',
    deleteRule: '@request.auth.householdId = householdId'
  })
  db.saveCollection(expensesCollection)

  // expense_settlements
  const settlementsCollection = new Collection({
    id: 'expense_settlements',
    name: 'expense_settlements',
    type: 'base',
    system: false,
    schema: [
      { name: 'fromUser', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false } },
      { name: 'toUser', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false } },
      { name: 'amount', type: 'number', required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'notes', type: 'text', required: false },
      { name: 'householdId', type: 'relation', required: true, options: { collectionId: 'households', cascadeDelete: true } }
    ],
    listRule: '@request.auth.householdId = householdId',
    viewRule: '@request.auth.householdId = householdId',
    createRule: '@request.auth.householdId = householdId',
    updateRule: '@request.auth.householdId = householdId',
    deleteRule: '@request.auth.householdId = householdId'
  })
  db.saveCollection(settlementsCollection)

  // documents
  const documentsCollection = new Collection({
    id: 'documents',
    name: 'documents',
    type: 'base',
    system: false,
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'category', type: 'select', options: { maxSelect: 1, values: ['bills', 'insurance', 'contracts', 'receipts', 'other'] } },
      { name: 'fileUrl', type: 'file', required: false, options: { maxSelect: 1, mimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] } },
      { name: 'householdId', type: 'relation', required: true, options: { collectionId: 'households', cascadeDelete: true } },
      { name: 'uploadedBy', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false } },
      { name: 'expiresAt', type: 'date', required: false },
      { name: 'description', type: 'text', required: false }
    ],
    listRule: '@request.auth.householdId = householdId',
    viewRule: '@request.auth.householdId = householdId',
    createRule: '@request.auth.householdId = householdId',
    updateRule: '@request.auth.householdId = householdId',
    deleteRule: '@request.auth.householdId = householdId'
  })
  db.saveCollection(documentsCollection)

}, (db) => {
  // Rollback
  for (const name of ['documents', 'expense_settlements', 'expenses', 'shopping_items', 'events', 'tasks', 'households']) {
    try { db.deleteCollection(db.findCollectionByNameOrId(name)) } catch (_) {}
  }
})
