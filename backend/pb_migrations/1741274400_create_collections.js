/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // households
  const households = new Collection({
    type: "base",
    name: "households",
    fields: [
      { type: "text", name: "name", required: true },
      { type: "text", name: "inviteCode", required: true },
      {
        type: "relation",
        name: "createdBy",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_invite_code ON households (inviteCode)"],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: "@request.auth.id = createdBy",
    deleteRule: "@request.auth.id = createdBy",
  });
  app.save(households);

  // Extend users with householdId, username, color
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({ name: "username", required: false }));
  users.fields.add(new TextField({ name: "color", required: false }));
  users.fields.add(
    new RelationField({
      name: "householdId",
      collectionId: households.id,
      cascadeDelete: false,
      required: false,
    })
  );
  app.save(users);

  // tasks
  const tasks = new Collection({
    type: "base",
    name: "tasks",
    fields: [
      { type: "text", name: "title", required: true },
      { type: "text", name: "description" },
      {
        type: "relation",
        name: "householdId",
        collectionId: households.id,
        cascadeDelete: true,
        required: true,
      },
      {
        type: "relation",
        name: "assignedTo",
        collectionId: "_pb_users_auth_",
        maxSelect: 999,
      },
      { type: "date", name: "dueDate" },
      {
        type: "select",
        name: "recurrence",
        maxSelect: 1,
        values: ["none", "daily", "weekly", "monthly"],
      },
      {
        type: "select",
        name: "priority",
        maxSelect: 1,
        values: ["low", "medium", "high"],
      },
      {
        type: "select",
        name: "status",
        maxSelect: 1,
        values: ["todo", "done"],
      },
      { type: "date", name: "completedAt" },
      {
        type: "relation",
        name: "completedBy",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
    ],
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  app.save(tasks);

  // events
  const events = new Collection({
    type: "base",
    name: "events",
    fields: [
      { type: "text", name: "title", required: true },
      { type: "text", name: "description" },
      {
        type: "relation",
        name: "householdId",
        collectionId: households.id,
        cascadeDelete: true,
        required: true,
      },
      {
        type: "relation",
        name: "assignedTo",
        collectionId: "_pb_users_auth_",
        maxSelect: 999,
      },
      { type: "date", name: "startDate", required: true },
      { type: "date", name: "endDate" },
      {
        type: "select",
        name: "category",
        maxSelect: 1,
        values: ["meeting", "reminder", "personal", "work", "social", "other"],
      },
      { type: "bool", name: "isAllDay" },
      { type: "text", name: "color" },
    ],
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  app.save(events);

  // shopping_items
  const shopping = new Collection({
    type: "base",
    name: "shopping_items",
    fields: [
      { type: "text", name: "name", required: true },
      { type: "number", name: "quantity" },
      { type: "text", name: "unit" },
      {
        type: "select",
        name: "category",
        maxSelect: 1,
        values: ["groceries", "household", "personal", "other"],
      },
      { type: "bool", name: "isCompleted" },
      {
        type: "relation",
        name: "householdId",
        collectionId: households.id,
        cascadeDelete: true,
        required: true,
      },
      {
        type: "relation",
        name: "addedBy",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
      {
        type: "relation",
        name: "assignedTo",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
      },
      { type: "date", name: "completedAt" },
    ],
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  app.save(shopping);

  // expenses
  const expenses = new Collection({
    type: "base",
    name: "expenses",
    fields: [
      { type: "text", name: "description", required: true },
      { type: "number", name: "amount", required: true },
      {
        type: "select",
        name: "category",
        maxSelect: 1,
        values: [
          "food",
          "groceries",
          "rent",
          "utilities",
          "transport",
          "entertainment",
          "shopping",
          "health",
          "other",
        ],
      },
      { type: "date", name: "date", required: true },
      {
        type: "relation",
        name: "paidBy",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
        required: true,
      },
      {
        type: "relation",
        name: "householdId",
        collectionId: households.id,
        cascadeDelete: true,
        required: true,
      },
      { type: "json", name: "splits" },
      {
        type: "file",
        name: "receiptUrl",
        maxSelect: 1,
        mimeTypes: ["image/jpeg", "image/png", "application/pdf"],
      },
      { type: "bool", name: "isSettled" },
    ],
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  app.save(expenses);

  // expense_settlements
  const settlements = new Collection({
    type: "base",
    name: "expense_settlements",
    fields: [
      {
        type: "relation",
        name: "fromUser",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
        required: true,
      },
      {
        type: "relation",
        name: "toUser",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
        required: true,
      },
      { type: "number", name: "amount", required: true },
      { type: "date", name: "date", required: true },
      { type: "text", name: "notes" },
      {
        type: "relation",
        name: "householdId",
        collectionId: households.id,
        cascadeDelete: true,
        required: true,
      },
    ],
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  app.save(settlements);

  // documents
  const documents = new Collection({
    type: "base",
    name: "documents",
    fields: [
      { type: "text", name: "title", required: true },
      {
        type: "select",
        name: "category",
        maxSelect: 1,
        values: ["bills", "insurance", "contracts", "receipts", "other"],
      },
      {
        type: "file",
        name: "fileUrl",
        maxSelect: 1,
        mimeTypes: [
          "image/jpeg",
          "image/png",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      },
      {
        type: "relation",
        name: "householdId",
        collectionId: households.id,
        cascadeDelete: true,
        required: true,
      },
      {
        type: "relation",
        name: "uploadedBy",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
        required: true,
      },
      { type: "date", name: "expiresAt" },
      { type: "text", name: "description" },
    ],
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  app.save(documents);
}, (app) => {
  for (const name of [
    "documents",
    "expense_settlements",
    "expenses",
    "shopping_items",
    "events",
    "tasks",
    "households",
  ]) {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch (_) {}
  }
});
