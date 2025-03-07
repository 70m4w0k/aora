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
  videoCollectionId: "66cc7caa003330047163",
  storageId: "66cc7dd9000d1e1e11e0",
  choresCollectionId: "66d6e734002977ed7f08",
  choresImplementationCollectionId: "66d6e7ba003aeba974d1",
  taskCollectionId: "66daeaba0012bea61d31",
  tasksDoneCollectionId: "66daebd5003dbbdb0beb",
  // New collections for household management app
  shoppingItemsCollectionId: "67c5f73b003091bc520c", // You'll need to create this in Appwrite and add the ID
  expensesCollectionId: "67c5f84e0011953452e2", // You'll need to create this in Appwrite and add the ID
  expenseSettlementsCollectionId: "67c637aa002f0ba982dc", // You'll need to create this in Appwrite and add the ID
  // Garden calendar tracker collections
  plantsCollectionId: "67cb1c92003ce7f03311", // You'll need to create this in Appwrite and add the ID
  plantEventsCollectionId: "67cb1d17002e647e5d97", // You'll need to create this in Appwrite and add the ID
  plantRemindersCollectionId: "67cb1e0d001fe81de7fb", // You'll need to create this in Appwrite and add the ID
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
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Chores Utils
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

// Create chore
export async function createChore(form) {
  try {
    const newChore = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.choresCollectionId,
      ID.unique(),
      {
        title: form.title,
        // iconUrl: "",
        recurrence: form.recurrence,
      }
    );

    if (!newChore) throw Error;

    return newChore;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all Chores
export async function getChores() {
  try {
    const chores = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.choresCollectionId
    );

    return chores.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Create chore
export async function createChoreImplementation(form) {
  try {
    const newChoreImpl = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.choresImplementationCollectionId,
      ID.unique(),
      {
        percentageDone: form.percentageDone,
        authorId: form.userId,
        choreId: form.choreId,
      }
    );

    if (!newChoreImpl) throw Error;

    return newChoreImpl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all Chores Impl
export async function getAllChoreImpl() {
  try {
    const allChoreImpl = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.choresImplementationCollectionId
    );
    return allChoreImpl.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest Chores Impl
export async function getLatestChoresImplByChoreId(choreId) {
  try {
    const latestChoreImpl = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.choresImplementationCollectionId,
      [
        Query.equal("choreId", choreId),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ]
    );
    return latestChoreImpl.documents;
  } catch (error) {
    throw new Error(error);
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
      }
    );

    if (!newTask) throw Error;

    return newTask;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all Tasks
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

// Update Task Done

// Delete Task Done
// export async function deleteTaskDone(id) {
//   console.log(id);
//   try {
//     const result = await databases.deleteDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.tasksDoneCollectionId,
//       id
//     );

//     if (!result) throw Error;

//     return result;
//   } catch (error) {
//     throw new Error(error);
//   }
// }

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
      }
    );

    if (!newItem) throw Error;

    return newItem;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all shopping items
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

// Get all expenses
export async function getAllExpenses() {
  try {
    const expenses = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      [Query.orderDesc("date")]
    );

    return expenses.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get expenses by user (either paid by or split with)
export async function getUserExpenses(userId) {
  try {
    const expenses = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.expensesCollectionId,
      [
        Query.logicalOr(
          Query.equal("paidBy", userId),
          Query.search("splitBetween", userId)
        ),
        Query.orderDesc("date")
      ]
    );

    return expenses.documents;
  } catch (error) {
    throw new Error(error);
  }
}

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
        Query.logicalOr(
          Query.equal("paidBy", userId),
          Query.equal("paidTo", userId)
        ),
        Query.orderDesc("date")
      ]
    );

    return settlements.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// ==================== Garden Calendar Tracker Functions ====================

// Plant types
export const PlantTypes = {
  VEGETABLE: "vegetable",
  HERB: "herb",
  FRUIT: "fruit",
  FLOWER: "flower",
  TREE: "tree",
  OTHER: "other"
};

// Plant event types
export const PlantEventTypes = {
  SOW: "sow",
  PLANT: "plant",
  WATER: "water",
  FERTILIZE: "fertilize",
  PRUNE: "prune",
  HARVEST: "harvest",
  TRANSPLANT: "transplant",
  CUTTING: "cutting",
  NOTE: "note",
};

// Create new plant
export async function createPlant(form) {
  try {
    let mainImageId = null;
    
    // If image is provided, upload it first
    if (form.image) {
      const uploadedFile = await uploadFile(form.image, "image");
      if (uploadedFile) {
        // Extract the file ID from the URL
        const url = new URL(uploadedFile);
        mainImageId = url.pathname.split('/').pop();
      }
    }
    
    const newPlant = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.plantsCollectionId,
      ID.unique(),
      {
        name: form.name,
        type: form.type || PlantTypes.VEGETABLE,
        variety: form.variety || "",
        owner: form.userId,
        notes: form.notes || "",
        mainImageId: mainImageId,
      }
    );

    if (!newPlant) throw Error;

    return newPlant;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all plants
export async function getAllPlants() {
  try {
    const plants = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantsCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    return plants.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get plants by user
export async function getUserPlants(userId) {
  try {
    const plants = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantsCollectionId,
      [Query.equal("owner", userId)]
    );

    return plants.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get plant image preview URL
export async function getPlantImageUrl(imageId) {
  if (!imageId) return null;
  
  try {
    const imageUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      imageId,
      800, 
      600,
      "center",
      100
    );
    
    return imageUrl;
  } catch (error) {
    console.error("Error getting plant image:", error);
    return null;
  }
}

// Create plant event
export async function createPlantEvent(form) {
  try {
    let imageIds = [];
    
    // If images are provided, upload them first
    if (form.images && Array.isArray(form.images)) {
      for (const image of form.images) {
        const uploadedFile = await uploadFile(image, "image");
        if (uploadedFile) {
          // Extract the file ID from the URL
          const url = new URL(uploadedFile);
          imageIds.push(url.pathname.split('/').pop());
        }
      }
    }
    
    // Get weather data if available (this would be integrated with a weather API)
    let weatherData = {};
    if (form.includeWeather) {
      try {
        // This would be replaced with actual weather API implementation
        // For now, we'll just add placeholder data
        weatherData = {
          temperature: 22,
          conditions: "Sunny",
          humidity: 45
        };
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    }
    
    const newEvent = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.plantEventsCollectionId,
      ID.unique(),
      {
        plantId: form.plantId,
        eventType: form.eventType || PlantEventTypes.NOTE,
        date: form.date || new Date().toISOString(),
        notes: form.notes || "",
        imageIds: imageIds.toString(),
        weather: weatherData.toString(),
      }
    );

    if (!newEvent) throw Error;

    return newEvent;
  } catch (error) {
    throw new Error(error);
  }
}

// Get plant events
export async function getPlantEvents(plantId) {
  try {
    const events = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantEventsCollectionId,
      [
        Query.equal("plantId", plantId),
        Query.orderDesc("date")
      ]
    );

    return events.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get plant events by type
export async function getPlantEventsByType(plantId, eventType) {
  try {
    const events = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantEventsCollectionId,
      [
        Query.equal("plantId", plantId),
        Query.equal("eventType", eventType),
        Query.orderDesc("date")
      ]
    );

    return events.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get plant events by date range
export async function getPlantEventsByDateRange(plantId, startDate, endDate) {
  try {
    const events = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantEventsCollectionId,
      [
        Query.equal("plantId", plantId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.orderDesc("date")
      ]
    );

    return events.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Create plant reminder
export async function createPlantReminder(form) {
  try {
    const newReminder = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.plantRemindersCollectionId,
      ID.unique(),
      {
        plantId: form.plantId,
        eventType: form.eventType || PlantEventTypes.WATER,
        scheduledDate: form.scheduledDate || new Date().toISOString(),
        notes: form.notes || "",
        recurring: form.recurring || false,
        recurrencePattern: form.recurrencePattern || "weekly",
        isActive: true,
        createdBy: form.userId,
      }
    );

    if (!newReminder) throw Error;

    return newReminder;
  } catch (error) {
    throw new Error(error);
  }
}

// Get active reminders for a plant
export async function getActivePlantReminders(plantId) {
  try {
    const reminders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantRemindersCollectionId,
      [
        Query.equal("plantId", plantId),
        Query.equal("isActive", true),
        Query.orderAsc("scheduledDate")
      ]
    );

    return reminders.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Update plant reminder
export async function updatePlantReminder(id, updates) {
  try {
    const updatedReminder = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.plantRemindersCollectionId,
      id,
      updates
    );

    if (!updatedReminder) throw Error;

    return updatedReminder;
  } catch (error) {
    throw new Error(error);
  }
}

// Get upcoming reminders for all plants
export async function getUpcomingReminders(userId, days = 7) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    // Get all plants for this user
    const userPlants = await getUserPlants(userId);
    const plantIds = userPlants.map(plant => plant.$id);
    
    if (plantIds.length === 0) {
      return [];
    }
    
    // Get reminders for these plants that are upcoming
    const reminders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.plantRemindersCollectionId,
      [
        Query.equal("isActive", true),
        Query.greaterThanEqual("scheduledDate", now.toISOString()),
        Query.lessThanEqual("scheduledDate", futureDate.toISOString()),
        plantIds.length > 0 ? Query.in("plantId", plantIds) : null,
        Query.orderAsc("scheduledDate")
      ].filter(Boolean) // Remove null queries
    );

    return reminders.documents;
  } catch (error) {
    throw new Error(error);
  }
}
