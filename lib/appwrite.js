import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

import { getRandomHexColor } from "./utils";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.wok.aora",
  projectId: "66cc7b47003a18bd5600",
  databaseId: "66cc7c760013e5170042",
  userCollectionId: "66cc7c930038937612d7",
  storageId: "66cc7dd9000d1e1e11e0",
  // Household management
  householdCollectionId: "692d9aa3002cdbc240cc",
  // Chores tracker
  taskCollectionId: "66daeaba0012bea61d31",
  tasksDoneCollectionId: "66daebd5003dbbdb0beb",
  // Shopping list
  shoppingItemsCollectionId: "67c5f73b003091bc520c",
  // Expenses
  expensesCollectionId: "67c5f84e0011953452e2",
  expenseSettlementsCollectionId: "67c637aa002f0ba982dc",
  // Documents/Files
  documentsCollectionId: "documents", // TODO: Create in Appwrite
  // Price Tracker
  productsCollectionId: "products", // TODO: Create in Appwrite
  priceHistoryCollectionId: "priceHistory", // TODO: Create in Appwrite
  storesCollectionId: "stores", // TODO: Create in Appwrite
};

// Document categories
export const DocumentCategories = {
  BILLS: "bills",
  INSURANCE: "insurance",
  CONTRACTS: "contracts",
  RECEIPTS: "receipts",
  OTHER: "other",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Register user
export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const color = getRandomHexColor();
    console.log(color);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
        color: color,
      }
    );

    console.log("createUser() - newUser", newUser);

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    console.log("getCurrentUser() - currentAccount", currentAccount);
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    return null;
  }
}

// Get Current User
export async function getAllUsers() {
  try {
    const allUsers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId
    );

    if (!allUsers) throw Error;

    return allUsers.documents;
  } catch (error) {
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// ==================== Household Functions ====================

// Generate a random 6-character invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new household
export async function createHousehold(name, userId) {
  try {
    const inviteCode = generateInviteCode();
    
    const newHousehold = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.householdCollectionId,
      ID.unique(),
      {
        name: name,
        inviteCode: inviteCode,
        createdBy: userId,
      }
    );

    if (!newHousehold) throw Error;

    // Update the user to be part of this household as admin
    await updateUserHousehold(userId, newHousehold.$id, 'admin');

    return newHousehold;
  } catch (error) {
    throw new Error(error);
  }
}

// Get household by ID
export async function getHousehold(householdId) {
  try {
    const household = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.householdCollectionId,
      householdId
    );

    return household;
  } catch (error) {
    console.error("Error getting household:", error);
    return null;
  }
}

// Get household by invite code
export async function getHouseholdByInviteCode(inviteCode) {
  try {
    const households = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.householdCollectionId,
      [Query.equal("inviteCode", inviteCode.toUpperCase())]
    );

    if (households.documents.length === 0) {
      return null;
    }

    return households.documents[0];
  } catch (error) {
    console.error("Error getting household by invite code:", error);
    return null;
  }
}

// Join a household with invite code
export async function joinHousehold(inviteCode, userId) {
  try {
    const household = await getHouseholdByInviteCode(inviteCode);
    
    if (!household) {
      throw new Error("Invalid invite code. Please check and try again.");
    }

    // Update the user to be part of this household as member
    await updateUserHousehold(userId, household.$id, 'member');

    return household;
  } catch (error) {
    throw new Error(error.message || "Failed to join household");
  }
}

// Update user's household and role
export async function updateUserHousehold(userId, householdId, role = 'member') {
  try {
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      {
        householdId: householdId,
        role: role,
      }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all members of a household
export async function getHouseholdMembers(householdId) {
  try {
    const members = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("householdId", householdId)]
    );

    return members.documents;
  } catch (error) {
    console.error("Error getting household members:", error);
    return [];
  }
}

// Leave household
export async function leaveHousehold(userId) {
  try {
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      {
        householdId: null,
        role: null,
      }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Update household name
export async function updateHouseholdName(householdId, newName) {
  try {
    const updatedHousehold = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.householdCollectionId,
      householdId,
      {
        name: newName,
      }
    );

    return updatedHousehold;
  } catch (error) {
    throw new Error(error);
  }
}

// Regenerate invite code
export async function regenerateInviteCode(householdId) {
  try {
    const newCode = generateInviteCode();
    
    const updatedHousehold = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.householdCollectionId,
      householdId,
      {
        inviteCode: newCode,
      }
    );

    return updatedHousehold;
  } catch (error) {
    throw new Error(error);
  }
}

// Kick user from household (admin only)
export async function kickUserFromHousehold(userId) {
  try {
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      {
        householdId: null,
        role: null,
      }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Promote user to admin
export async function promoteToAdmin(userId) {
  try {
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      {
        role: 'admin',
      }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Demote user from admin to member
export async function demoteFromAdmin(userId) {
  try {
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      {
        role: 'member',
      }
    );

    return updatedUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete household (admin only - removes all users first)
export async function deleteHousehold(householdId) {
  try {
    // First, remove all users from the household
    const members = await getHouseholdMembers(householdId);
    for (const member of members) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        member.$id,
        {
          householdId: null,
          role: null,
        }
      );
    }

    // Then delete the household
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.householdCollectionId,
      householdId
    );

    return true;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      // For documents and other files, just get the view URL
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// ==================== Chores/Tasks Functions ====================
export const RecurrenceOptions = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export function convertRecurrenceToString(recurrence) {
  switch (recurrence) {
    case RecurrenceOptions.DAILY:
      return "daily";
    case RecurrenceOptions.WEEKLY:
      return "weekly";
    case RecurrenceOptions.MONTHLY:
      return "monthly";
    default:
      throw new Error("Invalid recurrence value");
  }
}

// Create Task
export async function createTask(form) {
  try {
    const newTask = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.taskCollectionId,
      ID.unique(),
      {
        title: form.title,
        recurrence: form.recurrence,
        householdId: form.householdId, // Scope to household
      }
    );

    if (!newTask) throw Error;

    return newTask;
  } catch (error) {
    throw new Error(error);
  }
}

// Get tasks for a household
export async function getHouseholdTasks(householdId) {
  try {
    const tasks = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.taskCollectionId,
      [Query.equal("householdId", householdId)]
    );

    return tasks.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Legacy: Get all Tasks (deprecated - use getHouseholdTasks)
export async function getAllTasks() {
  try {
    const tasks = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.taskCollectionId
    );

    console.log(tasks);

    return tasks.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Update Task

// Delete Task
export async function deleteTask(id) {
  try {
    const result = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.taskCollectionId,
      id
    );

    if (!result) throw Error;

    return result;
  } catch (error) {
    throw new Error(error);
  }
}

// Update a task
export async function updateTask(taskId, updates) {
  try {
    const updatedTask = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.taskCollectionId,
      taskId,
      updates
    );

    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error(error);
  }
}

export async function getLatestTasksImplByTaskId(taskId) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.tasksDoneCollectionId,
      [Query.equal("taskId", taskId), Query.orderDesc("$createdAt")]
    );

    return result.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Task Done
export async function createTaskDone(form) {
  console.log("create new TaskDone : ", form);
  try {
    const newTaskDone = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.tasksDoneCollectionId,
      ID.unique(),
      {
        done: true, // Boolean field
        weekNumber: form.weekNumber,
        userId: form.userId,
        taskId: form.taskId,
        householdId: form.householdId,
      }
    );

    if (!newTaskDone) throw Error;

    return newTaskDone;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all Tasks Done
export async function getAllTasksDone() {
  try {
    const allTasksDone = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.tasksDoneCollectionId
    );
    return allTasksDone.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get TaskDone by task id
export async function getTaskDoneByTaskId(id) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.tasksDoneCollectionId,
      [Query.equal("taskId", id), Query.orderDesc("$createdAt")]
    );

    console.log("result", result);
    console.log("result", result);

    return result.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete Task Done
export async function deleteTaskDone(taskId, userId, weekIndex) {
  try {
    // First, query the database to find the document with matching taskId, userId, and weekIndex

    console.log("deleteTaskDone() - taskId", taskId);
    console.log("deleteTaskDone() - userId", userId);
    console.log("deleteTaskDone() - weekIndex", weekIndex);

    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.tasksDoneCollectionId,
      [
        Query.equal("taskId", taskId),
        Query.equal("userId", userId),
        Query.equal("weekNumber", weekIndex),
      ]
    );

    console.log("deleteTaskDone() - result", result);

    // Check if a document was found
    if (result.documents.length === 0) {
      throw new Error(
        "No task done record found for this user, task, and week."
      );
    }

    // Extract the document ID
    const documentId = result.documents[0].$id;

    // Delete the document using the documentId
    const deleteResult = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.tasksDoneCollectionId,
      documentId
    );

    if (!deleteResult) {
      throw new Error("Error deleting task done record.");
    }

    return deleteResult;
  } catch (error) {
    console.error("Error deleting task done record:", error);
    throw new Error(error.message);
  }
}

// ==================== Shopping List Functions ====================

// Shopping item categories
export const ShoppingCategories = {
  GROCERIES: "groceries",
  HOUSEHOLD: "household",
  PERSONAL: "personal",
  OTHER: "other"
};

// Create shopping item
export async function createShoppingItem(form) {
  try {
    const newItem = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shoppingItemsCollectionId,
      ID.unique(),
      {
        name: form.name,
        quantity: form.quantity,
        category: form.category || ShoppingCategories.GROCERIES,
        assignedTo: form.assignedTo || null,
        completed: false,
        createdBy: form.userId,
        householdId: form.householdId, // Scope to household
      }
    );

    if (!newItem) throw Error;

    return newItem;
  } catch (error) {
    throw new Error(error);
  }
}

// Get shopping items for a household
export async function getHouseholdShoppingItems(householdId) {
  try {
    const items = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.shoppingItemsCollectionId,
      [
        Query.equal("householdId", householdId),
        Query.orderDesc("$createdAt")
      ]
    );

    return items.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Legacy: Get all shopping items (deprecated - use getHouseholdShoppingItems)
export async function getAllShoppingItems() {
  try {
    const items = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.shoppingItemsCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    return items.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Update shopping item (mark as completed)
export async function updateShoppingItem(id, updates) {
  try {
    const updatedItem = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shoppingItemsCollectionId,
      id,
      updates
    );

    if (!updatedItem) throw Error;

    return updatedItem;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete shopping item
export async function deleteShoppingItem(id) {
  try {
    const result = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shoppingItemsCollectionId,
      id
    );

    if (!result) throw Error;

    return result;
  } catch (error) {
    throw new Error(error);
  }
}

// ==================== Expense Sharing Functions ====================

// Create expense
export async function createExpense(form) {
  try {
    let imageId = null;
    
    // If image is provided, upload it first
    if (form.image) {
      const uploadedFile = await uploadFile(form.image, "image");
      if (uploadedFile) {
        // Extract the file ID from the URL
        const url = new URL(uploadedFile);
        imageId = url.pathname.split('/').pop();
      }
    }
    
    const newExpense = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      ID.unique(),
      {
        title: form.title,
        amount: form.amount,
        paidBy: form.paidBy,
        splitBetween: form.splitBetween,
        category: form.category || "general",
        date: form.date || new Date().toISOString(),
        notes: form.notes || "",
        imageId: imageId,
        householdId: form.householdId, // Scope to household
      }
    );

    if (!newExpense) throw Error;

    return newExpense;
  } catch (error) {
    throw new Error(error);
  }
}

// Get expense image preview URL
export async function getExpenseImageUrl(imageId) {
  if (!imageId) return null;
  
  try {
    const imageUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      imageId,
      1200, 
      900,
      "center",
      100
    );
    
    return imageUrl;
  } catch (error) {
    console.error("Error getting expense image:", error);
    return null;
  }
}

// Get expenses for a household
export async function getHouseholdExpenses(householdId) {
  try {
    const expenses = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      [
        Query.equal("householdId", householdId),
        Query.orderDesc("date")
      ]
    );

    return expenses.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Update an expense
export async function updateExpense(expenseId, updates) {
  try {
    const updatedExpense = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      expenseId,
      updates
    );

    return updatedExpense;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error(error);
  }
}

// Delete an expense
export async function deleteExpense(expenseId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      expenseId
    );

    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw new Error(error);
  }
}

// Legacy: Get all expenses (deprecated - use getHouseholdExpenses)
export async function getAllExpenses() {
  try {
    const expenses = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      [Query.orderDesc("date")]
    );

    console.log("getAllExpenses() - expenses", expenses);

    return expenses.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get expenses by user (either paid by or split with)
export const getUserExpenses = async (userId) => {
  try {
    // First, get expenses paid by the user
    const paidByResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      [
        Query.equal('paidBy', userId),
        Query.orderDesc('$createdAt')
      ]
    );
    console.log(paidByResponse);

    // Then, get all expenses
    const allExpensesResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId
    );

    // Filter expenses where user is in splitBetween
    const splitWithExpenses = allExpensesResponse.documents.filter(expense => 
      expense.splitBetween && 
      expense.splitBetween.some(user => user.$id === userId)
    );

    // Combine and deduplicate the results
    const allExpenses = [...paidByResponse.documents, ...splitWithExpenses];
    const uniqueExpenses = Array.from(new Map(allExpenses.map(item => [item.$id, item])).values());
    
    // Sort by createdAt
    uniqueExpenses.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

    return uniqueExpenses;
  } catch (error) {
    console.error("Error in getUserExpenses:", error);
    throw new Error(error.message);
  }
};

// Create settlement (when a debt is paid)
// paidBy and paidTo are relationship fields (many-to-one to users)
export async function createSettlement(form) {
  try {
    // For relationship fields, we pass the user document ID
    // Appwrite expects the ID string for relationship fields
    const paidById = typeof form.paidBy === 'object' ? form.paidBy.$id : form.paidBy;
    const paidToId = typeof form.paidTo === 'object' ? form.paidTo.$id : form.paidTo;

    const newSettlement = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expenseSettlementsCollectionId,
      ID.unique(),
      {
        amount: form.amount,
        paidBy: paidById,
        paidTo: paidToId,
        date: form.date || new Date().toISOString(),
        notes: form.notes || "",
        householdId: form.householdId,
      }
    );

    if (!newSettlement) throw Error;

    return newSettlement;
  } catch (error) {
    console.error("Error creating settlement:", error);
    throw new Error(error);
  }
}

// Get settlements by user
export async function getUserSettlements(userId) {
  try {
    const settlements = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expenseSettlementsCollectionId,
      [
        Query.or([
          Query.equal("paidBy", userId),
          Query.equal("paidTo", userId)
        ]),
        Query.orderDesc("date")
      ]
    );

    return settlements.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all settlements for a household
export async function getHouseholdSettlements(householdId) {
  try {
    const settlements = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expenseSettlementsCollectionId,
      [
        Query.equal("householdId", householdId),
        Query.orderDesc("date"),
        Query.limit(100)
      ]
    );

    return settlements.documents;
  } catch (error) {
    console.error("Error fetching household settlements:", error);
    throw new Error(error);
  }
}

// Delete a settlement
export async function deleteSettlement(settlementId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expenseSettlementsCollectionId,
      settlementId
    );
    return true;
  } catch (error) {
    console.error("Error deleting settlement:", error);
    throw new Error(error);
  }
}

// ============ DOCUMENTS/FILES ============

// Upload a document file to storage (returns file object with $id)
export async function uploadDocumentFile(file) {
  if (!file) return null;

  const asset = {
    name: file.fileName || file.name,
    type: file.mimeType || file.type,
    size: file.fileSize || file.size,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    return uploadedFile;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(error);
  }
}

// Get file view URL for documents
export async function getDocumentFileUrl(fileId) {
  try {
    const fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    return fileUrl;
  } catch (error) {
    console.error("Error getting file URL:", error);
    return null;
  }
}

// Delete a document file from storage
export async function deleteDocumentFile(fileId) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(error);
  }
}

// Create a document record
export async function createDocument(documentData) {
  try {
    const newDocument = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.documentsCollectionId,
      ID.unique(),
      {
        name: documentData.name,
        category: documentData.category,
        description: documentData.description || "",
        amount: documentData.amount ? parseFloat(documentData.amount) : null,
        date: documentData.date || new Date().toISOString(),
        fileId: documentData.fileId || null,
        fileUrl: documentData.fileUrl || null,
        fileName: documentData.fileName || null,
        householdId: documentData.householdId,
        userId: documentData.userId,
      }
    );

    return newDocument;
  } catch (error) {
    console.error("Error creating document:", error);
    throw new Error(error);
  }
}

// Get all documents for a household
export async function getHouseholdDocuments(householdId) {
  try {
    const documents = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.documentsCollectionId,
      [
        Query.equal("householdId", householdId),
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]
    );

    return documents.documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new Error(error);
  }
}

// Update a document
export async function updateDocument(documentId, updates) {
  try {
    const updatedDocument = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.documentsCollectionId,
      documentId,
      updates
    );

    return updatedDocument;
  } catch (error) {
    console.error("Error updating document:", error);
    throw new Error(error);
  }
}

// Delete a document (and its file)
export async function deleteDocument(documentId, fileId) {
  try {
    // Delete the file from storage if it exists
    if (fileId) {
      try {
        await deleteDocumentFile(fileId);
      } catch (e) {
        console.warn("Could not delete file:", e);
      }
    }

    // Delete the document record
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.documentsCollectionId,
      documentId
    );

    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error(error);
  }
}

// ============================================
// PRICE TRACKER - STORES
// ============================================

// Product categories
export const ProductCategories = {
  GROCERIES: "groceries",
  DAIRY: "dairy",
  MEAT: "meat",
  PRODUCE: "produce",
  FROZEN: "frozen",
  BEVERAGES: "beverages",
  SNACKS: "snacks",
  HOUSEHOLD: "household",
  PERSONAL_CARE: "personal_care",
  OTHER: "other",
};

// Create a new store
export async function createStore(form) {
  try {
    const newStore = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.storesCollectionId,
      ID.unique(),
      {
        name: form.name,
        address: form.address || null,
        householdId: form.householdId,
        createdBy: form.userId,
      }
    );
    return newStore;
  } catch (error) {
    console.error("Error creating store:", error);
    throw new Error(error);
  }
}

// Get all stores for a household
export async function getHouseholdStores(householdId) {
  try {
    const stores = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.storesCollectionId,
      [Query.equal("householdId", householdId), Query.orderAsc("name")]
    );
    return stores.documents;
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw new Error(error);
  }
}

// Update a store
export async function updateStore(storeId, updates) {
  try {
    const updatedStore = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.storesCollectionId,
      storeId,
      updates
    );
    return updatedStore;
  } catch (error) {
    console.error("Error updating store:", error);
    throw new Error(error);
  }
}

// Delete a store
export async function deleteStore(storeId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.storesCollectionId,
      storeId
    );
    return true;
  } catch (error) {
    console.error("Error deleting store:", error);
    throw new Error(error);
  }
}

// ============================================
// PRICE TRACKER - PRODUCTS
// ============================================

// Create a new product
export async function createProduct(form) {
  try {
    const newProduct = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      ID.unique(),
      {
        barcode: form.barcode || null,
        name: form.name,
        brand: form.brand || null,
        category: form.category || ProductCategories.OTHER,
        unit: form.unit || "unit", // unit, kg, L, g, mL, etc.
        weight: form.weight || null, // Weight/volume in grams or mL
        imageUrl: form.imageUrl || null, // Product image from Open Food Facts
        householdId: form.householdId,
        createdBy: form.userId,
      }
    );
    return newProduct;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error(error);
  }
}

// Get all products for a household
export async function getHouseholdProducts(householdId) {
  try {
    const products = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [Query.equal("householdId", householdId), Query.orderAsc("name"), Query.limit(500)]
    );
    return products.documents;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error(error);
  }
}

// Search products by barcode
export async function getProductByBarcode(barcode, householdId) {
  try {
    const products = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [Query.equal("barcode", barcode), Query.equal("householdId", householdId)]
    );
    return products.documents.length > 0 ? products.documents[0] : null;
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    throw new Error(error);
  }
}

// Search products by name
export async function searchProducts(query, householdId) {
  try {
    const products = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [
        Query.equal("householdId", householdId),
        Query.search("name", query),
        Query.limit(20)
      ]
    );
    return products.documents;
  } catch (error) {
    console.error("Error searching products:", error);
    throw new Error(error);
  }
}

// Update a product
export async function updateProduct(productId, updates) {
  try {
    const updatedProduct = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId,
      updates
    );
    return updatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error(error);
  }
}

// Delete a product
export async function deleteProduct(productId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId
    );
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error(error);
  }
}

// ============================================
// PRICE TRACKER - PRICE HISTORY
// ============================================

// Add a price entry
export async function addPriceEntry(form) {
  try {
    const quantity = form.quantity || 1;
    const price = form.price;
    const weight = form.weight || null; // Weight in grams
    
    // Calculate price per unit
    const pricePerUnit = price / quantity;
    
    // Calculate price per kg (if weight provided, assumes weight is in grams)
    const pricePerKg = weight ? (price / (weight * quantity / 1000)) : null;

    const newEntry = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      ID.unique(),
      {
        productId: form.productId,
        storeId: form.storeId,
        price: price,
        quantity: quantity,
        weight: weight,
        pricePerUnit: pricePerUnit,
        pricePerKg: pricePerKg,
        date: form.date || new Date().toISOString(),
        userId: form.userId,
        householdId: form.householdId,
        notes: form.notes || null,
      }
    );
    return newEntry;
  } catch (error) {
    console.error("Error adding price entry:", error);
    throw new Error(error);
  }
}

// Update a price entry
export async function updatePriceEntry(entryId, updates) {
  try {
    // Recalculate derived fields if needed
    if (updates.price !== undefined || updates.quantity !== undefined || updates.weight !== undefined) {
      const price = updates.price;
      const quantity = updates.quantity || 1;
      const weight = updates.weight;
      
      if (price !== undefined) {
        updates.pricePerUnit = price / quantity;
        if (weight) {
          updates.pricePerKg = price / (weight * quantity / 1000);
        }
      }
    }

    const updatedEntry = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      entryId,
      updates
    );
    return updatedEntry;
  } catch (error) {
    console.error("Error updating price entry:", error);
    throw new Error(error);
  }
}

// Get price history for a product
export async function getProductPriceHistory(productId, limit = 50) {
  try {
    const history = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      [
        Query.equal("productId", productId),
        Query.orderDesc("date"),
        Query.limit(limit)
      ]
    );
    return history.documents;
  } catch (error) {
    console.error("Error fetching price history:", error);
    throw new Error(error);
  }
}

// Get all price entries for a household
export async function getHouseholdPriceHistory(householdId, limit = 100) {
  try {
    const history = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      [
        Query.equal("householdId", householdId),
        Query.orderDesc("date"),
        Query.limit(limit)
      ]
    );
    return history.documents;
  } catch (error) {
    console.error("Error fetching household price history:", error);
    throw new Error(error);
  }
}

// Get best price for a product
export async function getProductBestPrice(productId) {
  try {
    const history = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      [
        Query.equal("productId", productId),
        Query.orderAsc("pricePerUnit"),
        Query.limit(1)
      ]
    );
    return history.documents.length > 0 ? history.documents[0] : null;
  } catch (error) {
    console.error("Error fetching best price:", error);
    throw new Error(error);
  }
}

// Get latest prices for a product across all stores
export async function getProductLatestPrices(productId) {
  try {
    // Get recent entries grouped by store (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const history = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      [
        Query.equal("productId", productId),
        Query.greaterThan("date", thirtyDaysAgo.toISOString()),
        Query.orderDesc("date"),
        Query.limit(50)
      ]
    );
    
    // Get latest price per store
    const latestByStore = {};
    history.documents.forEach(entry => {
      const storeId = typeof entry.storeId === 'object' ? entry.storeId.$id : entry.storeId;
      if (!latestByStore[storeId]) {
        latestByStore[storeId] = entry;
      }
    });
    
    return Object.values(latestByStore);
  } catch (error) {
    console.error("Error fetching latest prices:", error);
    throw new Error(error);
  }
}

// Delete a price entry
export async function deletePriceEntry(entryId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.priceHistoryCollectionId,
      entryId
    );
    return true;
  } catch (error) {
    console.error("Error deleting price entry:", error);
    throw new Error(error);
  }
}

// ============================================
// OPEN FOOD FACTS API INTEGRATION
// ============================================

// Map Open Food Facts categories to our categories
const mapOpenFoodFactsCategory = (categories) => {
  if (!categories) return ProductCategories.OTHER;
  const cats = categories.toLowerCase();
  
  if (cats.includes('dairy') || cats.includes('milk') || cats.includes('cheese') || cats.includes('yogurt')) return ProductCategories.DAIRY;
  if (cats.includes('meat') || cats.includes('poultry') || cats.includes('fish') || cats.includes('seafood')) return ProductCategories.MEAT;
  if (cats.includes('fruit') || cats.includes('vegetable') || cats.includes('produce') || cats.includes('fresh')) return ProductCategories.PRODUCE;
  if (cats.includes('frozen')) return ProductCategories.FROZEN;
  if (cats.includes('beverage') || cats.includes('drink') || cats.includes('juice') || cats.includes('soda') || cats.includes('water')) return ProductCategories.BEVERAGES;
  if (cats.includes('snack') || cats.includes('candy') || cats.includes('chocolate') || cats.includes('chips') || cats.includes('biscuit')) return ProductCategories.SNACKS;
  if (cats.includes('cleaning') || cats.includes('household') || cats.includes('detergent')) return ProductCategories.HOUSEHOLD;
  if (cats.includes('beauty') || cats.includes('personal') || cats.includes('cosmetic') || cats.includes('shampoo')) return ProductCategories.PERSONAL_CARE;
  
  return ProductCategories.GROCERIES;
};

// Parse weight from Open Food Facts quantity string
const parseWeight = (quantityStr) => {
  if (!quantityStr) return null;
  
  // Try to extract weight in grams or ml
  const match = quantityStr.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|cl|oz)\b/i);
  if (!match) return null;
  
  let value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  
  // Convert to grams/ml
  switch (unit) {
    case 'kg':
    case 'l':
      value *= 1000;
      break;
    case 'cl':
      value *= 10;
      break;
    case 'oz':
      value *= 28.35;
      break;
  }
  
  return Math.round(value);
};

// Lookup product by barcode in Open Food Facts
export async function lookupBarcode(barcode) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'TipiApp/1.0 (contact@example.com)',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }
    
    const product = data.product;
    
    return {
      found: true,
      barcode: barcode,
      name: product.product_name || product.product_name_en || null,
      brand: product.brands || null,
      category: mapOpenFoodFactsCategory(product.categories),
      weight: parseWeight(product.quantity) || parseWeight(product.serving_size),
      unit: product.quantity?.toLowerCase()?.includes('ml') || product.quantity?.toLowerCase()?.includes('l') ? 'mL' : 'g',
      imageUrl: product.image_front_small_url || product.image_url || null,
      // Extra info for display
      quantity: product.quantity || null,
      ingredients: product.ingredients_text || null,
      nutriScore: product.nutriscore_grade || null,
      categories: product.categories || null,
    };
  } catch (error) {
    console.error("Error looking up barcode:", error);
    return null;
  }
}

// Search products in Open Food Facts
export async function searchOpenFoodFacts(query, page = 1) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=20`,
      {
        headers: {
          'User-Agent': 'TipiApp/1.0 (contact@example.com)',
        },
      }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return [];
    }
    
    return data.products.map(product => ({
      barcode: product.code,
      name: product.product_name || product.product_name_en || 'Unknown',
      brand: product.brands || null,
      category: mapOpenFoodFactsCategory(product.categories),
      weight: parseWeight(product.quantity),
      imageUrl: product.image_front_small_url || null,
      quantity: product.quantity || null,
    })).filter(p => p.name && p.name !== 'Unknown');
  } catch (error) {
    console.error("Error searching Open Food Facts:", error);
    return [];
  }
}

