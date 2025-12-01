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
  householdCollectionId: "692d9aa3002cdbc240cc", // TODO: Create in Appwrite
  // Chores tracker
  taskCollectionId: "66daeaba0012bea61d31",
  tasksDoneCollectionId: "66daebd5003dbbdb0beb",
  // Shopping list
  shoppingItemsCollectionId: "67c5f73b003091bc520c",
  // Expenses
  expensesCollectionId: "67c5f84e0011953452e2",
  expenseSettlementsCollectionId: "67c637aa002f0ba982dc",
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
        done: form.done,
        weekNumber: form.doneDate,
        userId: form.userId,
        taskId: form.taskId,
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
export async function createSettlement(form) {
  try {
    const newSettlement = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expenseSettlementsCollectionId,
      ID.unique(),
      {
        amount: form.amount,
        paidBy: form.paidBy,
        paidTo: form.paidTo,
        date: form.date || new Date().toISOString(),
        notes: form.notes || "",
        householdId: form.householdId, // Scope to household
      }
    );

    if (!newSettlement) throw Error;

    return newSettlement;
  } catch (error) {
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

