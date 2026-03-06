/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // households
  const households = new Collection({
    type: "base",
    name: "households",
    indexes: ["CREATE UNIQUE INDEX idx_invite_code ON households (inviteCode)"],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: "@request.auth.id = createdBy",
    deleteRule: "@request.auth.id = createdBy",
  });
  households.fields.add(new TextField({ name: "name", required: true }));
  households.fields.add(new TextField({ name: "inviteCode", required: true }));
  households.fields.add(new RelationField({ name: "createdBy", collectionId: "_pb_users_auth_", cascadeDelete: false }));
  app.save(households);

  // Extend users with householdId, username, color
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({ name: "username" }));
  users.fields.add(new TextField({ name: "color" }));
  users.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: false, required: false }));
  app.save(users);

  // tasks
  const tasks = new Collection({
    type: "base",
    name: "tasks",
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  tasks.fields.add(new TextField({ name: "title", required: true }));
  tasks.fields.add(new TextField({ name: "description" }));
  tasks.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: true, required: true }));
  tasks.fields.add(new RelationField({ name: "assignedTo", collectionId: "_pb_users_auth_", maxSelect: 999 }));
  tasks.fields.add(new DateField({ name: "dueDate" }));
  tasks.fields.add(new SelectField({ name: "recurrence", maxSelect: 1, values: ["none", "daily", "weekly", "monthly"] }));
  tasks.fields.add(new SelectField({ name: "priority", maxSelect: 1, values: ["low", "medium", "high"] }));
  tasks.fields.add(new SelectField({ name: "status", maxSelect: 1, values: ["todo", "done"] }));
  tasks.fields.add(new DateField({ name: "completedAt" }));
  tasks.fields.add(new RelationField({ name: "completedBy", collectionId: "_pb_users_auth_", cascadeDelete: false }));
  app.save(tasks);

  // events
  const events = new Collection({
    type: "base",
    name: "events",
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  events.fields.add(new TextField({ name: "title", required: true }));
  events.fields.add(new TextField({ name: "description" }));
  events.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: true, required: true }));
  events.fields.add(new RelationField({ name: "assignedTo", collectionId: "_pb_users_auth_", maxSelect: 999 }));
  events.fields.add(new DateField({ name: "startDate", required: true }));
  events.fields.add(new DateField({ name: "endDate" }));
  events.fields.add(new SelectField({ name: "category", maxSelect: 1, values: ["meeting", "reminder", "personal", "work", "social", "other"] }));
  events.fields.add(new BoolField({ name: "isAllDay" }));
  events.fields.add(new TextField({ name: "color" }));
  app.save(events);

  // shopping_items
  const shopping = new Collection({
    type: "base",
    name: "shopping_items",
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  shopping.fields.add(new TextField({ name: "name", required: true }));
  shopping.fields.add(new NumberField({ name: "quantity" }));
  shopping.fields.add(new TextField({ name: "unit" }));
  shopping.fields.add(new SelectField({ name: "category", maxSelect: 1, values: ["groceries", "household", "personal", "other"] }));
  shopping.fields.add(new BoolField({ name: "isCompleted" }));
  shopping.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: true, required: true }));
  shopping.fields.add(new RelationField({ name: "addedBy", collectionId: "_pb_users_auth_", cascadeDelete: false }));
  shopping.fields.add(new RelationField({ name: "assignedTo", collectionId: "_pb_users_auth_", cascadeDelete: false }));
  shopping.fields.add(new DateField({ name: "completedAt" }));
  app.save(shopping);

  // expenses
  const expenses = new Collection({
    type: "base",
    name: "expenses",
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  expenses.fields.add(new TextField({ name: "description", required: true }));
  expenses.fields.add(new NumberField({ name: "amount", required: true }));
  expenses.fields.add(new SelectField({ name: "category", maxSelect: 1, values: ["food", "groceries", "rent", "utilities", "transport", "entertainment", "shopping", "health", "other"] }));
  expenses.fields.add(new DateField({ name: "date", required: true }));
  expenses.fields.add(new RelationField({ name: "paidBy", collectionId: "_pb_users_auth_", cascadeDelete: false, required: true }));
  expenses.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: true, required: true }));
  expenses.fields.add(new JSONField({ name: "splits" }));
  expenses.fields.add(new FileField({ name: "receiptUrl", maxSelect: 1, mimeTypes: ["image/jpeg", "image/png", "application/pdf"] }));
  expenses.fields.add(new BoolField({ name: "isSettled" }));
  app.save(expenses);

  // expense_settlements
  const settlements = new Collection({
    type: "base",
    name: "expense_settlements",
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  settlements.fields.add(new RelationField({ name: "fromUser", collectionId: "_pb_users_auth_", cascadeDelete: false, required: true }));
  settlements.fields.add(new RelationField({ name: "toUser", collectionId: "_pb_users_auth_", cascadeDelete: false, required: true }));
  settlements.fields.add(new NumberField({ name: "amount", required: true }));
  settlements.fields.add(new DateField({ name: "date", required: true }));
  settlements.fields.add(new TextField({ name: "notes" }));
  settlements.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: true, required: true }));
  app.save(settlements);

  // documents
  const documents = new Collection({
    type: "base",
    name: "documents",
    listRule: "@request.auth.householdId = householdId",
    viewRule: "@request.auth.householdId = householdId",
    createRule: "@request.auth.householdId = householdId",
    updateRule: "@request.auth.householdId = householdId",
    deleteRule: "@request.auth.householdId = householdId",
  });
  documents.fields.add(new TextField({ name: "title", required: true }));
  documents.fields.add(new SelectField({ name: "category", maxSelect: 1, values: ["bills", "insurance", "contracts", "receipts", "other"] }));
  documents.fields.add(new FileField({ name: "fileUrl", maxSelect: 1, mimeTypes: ["image/jpeg", "image/png", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] }));
  documents.fields.add(new RelationField({ name: "householdId", collectionId: households.id, cascadeDelete: true, required: true }));
  documents.fields.add(new RelationField({ name: "uploadedBy", collectionId: "_pb_users_auth_", cascadeDelete: false, required: true }));
  documents.fields.add(new DateField({ name: "expiresAt" }));
  documents.fields.add(new TextField({ name: "description" }));
  app.save(documents);

}, (app) => {
  for (const name of [
    "documents", "expense_settlements", "expenses",
    "shopping_items", "events", "tasks", "households",
  ]) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
  }

  // Remove added fields from users
  try {
    const users = app.findCollectionByNameOrId("users");
    for (const fname of ["username", "color", "householdId"]) {
      const f = users.fields.getByName(fname);
      if (f) users.fields.remove(f);
    }
    app.save(users);
  } catch (_) {}
});
