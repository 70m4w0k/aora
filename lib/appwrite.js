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
import { parseAppwriteError } from "./errorHandler";

// Load environment variables
// Note: Expo requires EXPO_PUBLIC_ prefix for client-side environment variables
// These should be defined in your .env file as:
// EXPO_PUBLIC_APPWRITE_ENDPOINT=http://192.168.1.46/v1
// EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
// EXPO_PUBLIC_APPWRITE_API_KEY=your_api_key (optional, for server-side operations)
// EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
// EXPO_PUBLIC_APPWRITE_PLATFORM=com.wok.tipi

// Debug: Log environment variable values (without exposing sensitive data)
const debugEnv = {
  hasEndpoint: !!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  hasProjectId: !!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  hasDatabaseId: !!process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  hasPlatform: !!process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  projectIdLength: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID?.length || 0,
};

console.log("[Appwrite Config] Environment variables check:", debugEnv);

export const appwriteConfig = {
  // Default endpoint for local development
  // For production/self-hosted: Set EXPO_PUBLIC_APPWRITE_ENDPOINT in .env file
  // Example: https://appwrite.yourdomain.com/v1 (via Cloudflare Tunnel)
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || "http://192.168.1.46/v1",
  platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || "com.wok.tipi",
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || "",
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID || "",
  
  // Collection IDs - Updated to match DB_SCHEMA_CORRECTED.md (snake_case naming)
  // These will be set when you run the init-appwrite-db.js script
  userCollectionId: "users",
  householdCollectionId: "households",
  taskCollectionId: "tasks",
  tasksDoneCollectionId: "tasks_done",
  shoppingItemsCollectionId: "shopping_items",
  expensesCollectionId: "expenses",
  expenseSettlementsCollectionId: "expense_settlements",
  documentsCollectionId: "documents",
  productsCollectionId: "products",
  priceHistoryCollectionId: "price_history",
  storesCollectionId: "stores",
  eventsCollectionId: "events",
  habitsArcsCollectionId: "habits_arcs",
  habitsQuestsCollectionId: "habits_quests",
  habitsQuestsCompletionsCollectionId: "habits_quests_completions",
  habitsTiersCollectionId: "habits_tiers",
  habitsTiersCompletionsCollectionId: "habits_tiers_completions",
  habitsUserProgressCollectionId: "habits_user_progress",
  habitsXpHistoryCollectionId: "habits_xp_history",
};

// Validate required configuration
if (!appwriteConfig.projectId || appwriteConfig.projectId.trim() === "") {
  const errorMessage = 
    "❌ Appwrite Project ID is missing!\n\n" +
    "Please set EXPO_PUBLIC_APPWRITE_PROJECT_ID in your .env file.\n" +
    "See APPWRITE_CONFIG_SETUP.md for instructions.\n\n" +
    "⚠️  IMPORTANT: After creating/updating .env file:\n" +
    "   1. Stop your Expo dev server (Ctrl+C)\n" +
    "   2. Clear cache: npx expo start --clear\n" +
    "   3. Restart the dev server\n\n" +
    "Current config:\n" +
    `  Endpoint: ${appwriteConfig.endpoint}\n` +
    `  Project ID: ${appwriteConfig.projectId || "(empty)"}\n` +
    `  Platform: ${appwriteConfig.platform}\n` +
    `  Env var loaded: ${debugEnv.hasProjectId ? "YES" : "NO"}\n` +
    `  Project ID length: ${debugEnv.projectIdLength}\n`;
  
  console.error(errorMessage);
  throw new Error("Appwrite Project ID is required. Please set EXPO_PUBLIC_APPWRITE_PROJECT_ID in your .env file and restart the Expo dev server.");
}

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
    console.log("createUser() - Starting user creation...");
    console.log("createUser() - Config:", {
      databaseId: appwriteConfig.databaseId,
      userCollectionId: appwriteConfig.userCollectionId,
    });

    // Step 1: Create Appwrite Auth account
    console.log("createUser() - Step 1: Creating Appwrite Auth account...");
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) {
      throw new Error("Failed to create Appwrite account");
    }

    console.log("createUser() - Auth account created:", newAccount.$id);

    // Step 2: Sign in to get session
    console.log("createUser() - Step 2: Signing in...");
    const session = await signIn(email, password);
    console.log("createUser() - Signed in successfully, session:", session.$id);
    
    // Step 2.5: Verify session is active by getting account
    console.log("createUser() - Step 2.5: Verifying session...");
    const verifyAccount = await getAccount();
    if (!verifyAccount || verifyAccount.$id !== newAccount.$id) {
      throw new Error("Session verification failed - account mismatch");
    }
    console.log("createUser() - Session verified, account ID:", verifyAccount.$id);

    // Step 3: Prepare user data
    const avatarUrl = avatars.getInitials(username);
    const color = getRandomHexColor();
    console.log("createUser() - User data prepared:", {
      accountId: newAccount.$id,
      email,
      username,
      avatar: avatarUrl,
      color,
    });

    // Step 4: Create database user document
    console.log("createUser() - Step 4: Creating database user document...");
    console.log("createUser() - Using:", {
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.userCollectionId,
    });
    
    try {
      const userData = {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
        color: color,
      };
      
      console.log("createUser() - User data to create:", userData);
      
      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        userData
      );

      console.log("createUser() - Database user created successfully:", newUser.$id);
      return newUser;
    } catch (dbError) {
      console.error("createUser() - Error creating database user:", dbError);
      console.error("createUser() - Error details:", {
        message: dbError.message,
        code: dbError.code,
        type: dbError.type,
        response: dbError.response,
      });
      
      // If database user creation fails, we should still have the auth account
      // But we need to inform the user about the issue
      throw new Error(
        `Account created but failed to create user profile: ${dbError.message || 'Unknown error'}. ` +
        `Please contact support. Error code: ${dbError.code || 'N/A'}`
      );
    }
  } catch (error) {
    console.error("createUser() - Fatal error:", error);
    console.error("createUser() - Error stack:", error.stack);
    
    // Preserve the original error message if it's already an Error object
    if (error instanceof Error) {
      throw error;
    }
    
    // Otherwise, wrap it
    throw new Error(error.message || "Failed to create user account");
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
    // Handle "guests" role error gracefully - this means user is not authenticated
    if (error.message && error.message.includes('missing scopes')) {
      console.log("getAccount() - User not authenticated (guests role)");
      return null;
    }
    
    // Handle project not found error - this indicates configuration issue
    if (error.message && (
      error.message.includes('Project with the requested ID could not be found') ||
      error.message.includes('project_not_found') ||
      (error.type && error.type === 'project_not_found')
    )) {
      const configError = 
        "❌ Appwrite Project Configuration Error!\n\n" +
        "The Project ID in your configuration doesn't match any project in your Appwrite instance.\n\n" +
        "Please check:\n" +
        `  1. Project ID: ${appwriteConfig.projectId ? `${appwriteConfig.projectId.substring(0, 20)}...` : "(empty)"}\n` +
        `  2. Endpoint: ${appwriteConfig.endpoint}\n` +
        `  3. Verify the Project ID in your Appwrite console\n` +
        `  4. Make sure EXPO_PUBLIC_APPWRITE_PROJECT_ID in .env matches your Appwrite project\n` +
        `  5. Restart Expo dev server after updating .env: npx expo start --clear\n`;
      
      console.error(configError);
      throw new Error("Invalid Appwrite Project ID. Please check your .env file and Appwrite console.");
    }
    
    console.error("getAccount() - Error:", error);
    throw error;
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    
    // If getAccount returns null, user is not authenticated
    if (!currentAccount) {
      console.log("getCurrentUser() - No current account found (user not authenticated)");
      return null;
    }
    
    console.log("getCurrentUser() - currentAccount", currentAccount);

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    console.log("getCurrentUser() - Query result:", currentUser);

    if (!currentUser || !currentUser.documents || currentUser.documents.length === 0) {
      console.log("getCurrentUser() - No user document found for account:", currentAccount.$id);
      return null;
    }

    const user = currentUser.documents[0];
    console.log("getCurrentUser() - Found user:", {
      id: user.$id,
      email: user.email,
      username: user.username,
      householdId: user.householdId,
    });
    
    // Handle householdId relationship - if it's a relationship object, extract the ID
    if (user.householdId && typeof user.householdId === 'object') {
      user.householdId = user.householdId.$id || user.householdId;
    }

    return user;
  } catch (error) {
    // Handle "guests" role error gracefully
    if (error.message && error.message.includes('missing scopes')) {
      console.log("getCurrentUser() - User not authenticated (guests role)");
      return null;
    }
    
    // Handle project not found error - re-throw to show configuration error
    if (error.message && (
      error.message.includes('Project with the requested ID could not be found') ||
      error.message.includes('project_not_found') ||
      error.message.includes('Invalid Appwrite Project ID') ||
      (error.type && error.type === 'project_not_found')
    )) {
      throw error; // Re-throw to show the configuration error message
    }
    
    console.error("getCurrentUser() - Error:", error);
    console.error("getCurrentUser() - Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
    });
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
        createdAt: new Date().toISOString(),
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
    if (!householdId) {
      console.log("getHouseholdMembers() - No household ID provided");
      return [];
    }
    
    // Extract ID if householdId is a relationship object
    const householdIdValue = typeof householdId === 'object' ? (householdId.$id || householdId) : householdId;
    
    console.log("getHouseholdMembers() - Querying for household:", householdIdValue);
    
    const members = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("householdId", householdIdValue)]
    );

    console.log("getHouseholdMembers() - Found members:", members.documents?.length || 0);
    return members.documents || [];
  } catch (error) {
    console.error("Error getting household members:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    // Return empty array for graceful degradation
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

// ==================== User Profile Functions ====================

// Update user profile (username, color, avatar)
export async function updateUserProfile(userId, updates) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      updates
    );

    return updatedUser;
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to update profile");
  }
}

// Update account email
export async function updateAccountEmail(newEmail, password) {
  try {
    if (!newEmail || !password) {
      throw new Error("Email and password are required");
    }

    // Update email requires password verification
    await account.updateEmail(newEmail, password);
    return true;
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to update email");
  }
}

// Update account password
export async function updateAccountPassword(oldPassword, newPassword) {
  try {
    if (!oldPassword || !newPassword) {
      throw new Error("Both old and new passwords are required");
    }

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    await account.updatePassword(newPassword, oldPassword);
    return true;
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to update password");
  }
}

// Update account name
export async function updateAccountName(name) {
  try {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }

    await account.updateName(name);
    return true;
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to update name");
  }
}

// Upload profile picture
export async function uploadProfilePicture(file) {
  try {
    if (!file) {
      throw new Error("File is required");
    }

    const { mimeType, ...rest } = file;
    const asset = { type: mimeType, ...rest };

    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    // Get preview URL for the image
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      uploadedFile.$id,
      400,
      400,
      "top",
      100
    );

    return {
      fileId: uploadedFile.$id,
      url: fileUrl,
    };
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to upload profile picture");
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
        name: form.name || form.title, // Support both old and new field names
        description: form.description || null,
        dueDate: form.dueDate || null,
        priority: form.priority || null,
        status: form.status || "pending",
        householdId: form.householdId, // Scope to household
        assignedTo: form.assignedTo || null,
        createdBy: form.createdBy || form.userId, // Support both old and new field names
        createdAt: new Date().toISOString(),
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
    if (!householdId) {
      throw new Error("Household ID is required");
    }
    
    const tasks = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.taskCollectionId,
      [Query.equal("householdId", householdId)]
    );

    return tasks.documents || [];
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to fetch tasks");
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
        taskId: form.taskId,
        userId: form.userId,
        householdId: form.householdId,
        completedAt: form.completedAt || new Date().toISOString(),
        notes: form.notes || null,
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
    return allTasksDone.documents || [];
  } catch (error) {
    const message = parseAppwriteError(error);
    throw new Error(message || "Failed to fetch completed tasks");
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
        quantity: form.quantity || 1,
        unit: form.unit || null,
        category: form.category || null,
        notes: form.notes || null,
        isCompleted: false,
        addedBy: form.addedBy || form.userId, // Support both old and new field names
        householdId: form.householdId, // Scope to household
        createdAt: new Date().toISOString(),
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
        description: form.description || form.title, // Support both old and new field names
        amount: form.amount,
        category: form.category || null,
        expenseDate: form.expenseDate || form.date || new Date().toISOString(), // Support both old and new field names
        paidBy: form.paidBy,
        householdId: form.householdId, // Scope to household
        createdBy: form.createdBy || form.userId, // Support both old and new field names
        createdAt: new Date().toISOString(),
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
        Query.orderDesc("expenseDate")
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
      [Query.orderDesc("expenseDate")]
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
// fromUser and toUser are relationship fields (many-to-one to users)
export async function createSettlement(form) {
  try {
    // For relationship fields, we pass the user document ID
    // Appwrite expects the ID string for relationship fields
    const fromUserId = typeof form.fromUser === 'object' ? form.fromUser.$id : (form.fromUser || form.paidBy);
    const toUserId = typeof form.toUser === 'object' ? form.toUser.$id : (form.toUser || form.paidTo);

    const newSettlement = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.expenseSettlementsCollectionId,
      ID.unique(),
      {
        expenseId: form.expenseId || null,
        fromUser: fromUserId,
        toUser: toUserId,
        amount: form.amount,
        isSettled: form.isSettled || false,
        settledAt: form.settledAt || null,
        householdId: form.householdId,
        createdAt: new Date().toISOString(),
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
          Query.equal("fromUser", userId),
          Query.equal("toUser", userId)
        ]),
        Query.orderDesc("createdAt")
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
        Query.orderDesc("createdAt"),
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
        documentDate: documentData.documentDate || documentData.date || new Date().toISOString(), // Support both old and new field names
        fileId: documentData.fileId || null,
        fileUrl: documentData.fileUrl || null,
        fileName: documentData.fileName || null,
        householdId: documentData.householdId,
        uploadedBy: documentData.uploadedBy || documentData.userId, // Support both old and new field names
        createdAt: new Date().toISOString(),
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

// Event categories
export const EventCategories = {
  CHORE: "chore",
  MEETING: "meeting",
  SOCIAL: "social",
  WORK: "work",
  PERSONAL: "personal",
  REMINDER: "reminder",
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
        createdBy: form.createdBy || form.userId, // Support both old and new field names
        createdAt: new Date().toISOString(),
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
        createdBy: form.createdBy || form.userId, // Support both old and new field names
        createdAt: new Date().toISOString(),
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
        recordedAt: form.recordedAt || form.date || new Date().toISOString(), // Support both old and new field names
        recordedBy: form.recordedBy || form.userId, // Support both old and new field names
        householdId: form.householdId,
        notes: form.notes || null,
        createdAt: new Date().toISOString(),
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
        Query.orderDesc("recordedAt"),
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
        Query.orderDesc("recordedAt"),
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
        Query.greaterThan("recordedAt", thirtyDaysAgo.toISOString()),
        Query.orderDesc("recordedAt"),
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
// CALENDAR EVENTS FUNCTIONS
// ============================================

// Create event
export async function createEvent(form) {
  try {
    const event = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      ID.unique(),
      {
        title: form.title,
        description: form.description || null,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        allDay: form.allDay || false,
        category: form.category || EventCategories.OTHER,
        householdId: form.householdId,
        createdBy: form.createdBy || form.userId, // Support both old and new field names
        assignedTo: form.assignedTo || null,
        color: form.color || null,
        createdAt: new Date().toISOString(),
      }
    );
    return event;
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error(error);
  }
}

// Get household events
export async function getHouseholdEvents(householdId, startDate = null, endDate = null) {
  try {
    let queries = [Query.equal("householdId", householdId)];
    
    if (startDate && endDate) {
      // Query events that overlap with the date range
      // Event overlaps if: event.startDate <= endDate AND event.endDate >= startDate
      queries.push(Query.lessThanEqual("startDate", endDate));
      queries.push(Query.greaterThanEqual("endDate", startDate));
    }
    
    const events = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      queries,
      [Query.orderAsc("startDate")]
    );
    return events.documents || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    // Return empty array if collection doesn't exist yet (graceful degradation)
    const message = error?.message?.toLowerCase() || '';
    if (message.includes('collection') || message.includes('not found')) {
      console.warn("Events collection not found. Please create it in Appwrite.");
      return [];
    }
    // Re-throw for other errors
    const parsedError = parseAppwriteError(error);
    throw new Error(parsedError || "Failed to fetch events");
    throw new Error(error);
  }
}

// Update event
export async function updateEvent(eventId, updates) {
  try {
    const event = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      eventId,
      updates
    );
    return event;
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error(error);
  }
}

// Delete event
export async function deleteEvent(eventId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      eventId
    );
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
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

// ==================== Habits Tracker (NEOSYSTEM) Functions ====================

// Quest Frequencies
export const QuestFrequencies = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  ANNUAL: "annual",
  UNIQUE: "unique",
};

// Target Types
export const TargetTypes = {
  DAYS: "days",
  COUNT: "count",
  AMOUNT: "amount",
};

// Progression Types
export const ProgressionTypes = {
  LINEAR: "linear",
  PROGRESSIVE: "progressive",
};

// Create Arc
export async function createArc(form) {
  try {
    const newArc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsArcsCollectionId,
      ID.unique(),
      {
        name: form.name,
        color: form.color || "#8B5CF6",
        icon: form.icon || null,
        description: form.description || null,
        householdId: form.householdId,
        createdBy: form.userId,
      }
    );
    return newArc;
  } catch (error) {
    console.error("Error creating arc:", error);
    throw parseAppwriteError(error);
  }
}

// Get Household Arcs
export async function getHouseholdArcs(householdId) {
  try {
    const arcs = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.habitsArcsCollectionId,
      [Query.equal("householdId", householdId), Query.orderAsc("name")]
    );
    return arcs.documents;
  } catch (error) {
    console.error("Error fetching arcs:", error);
    throw parseAppwriteError(error);
  }
}

// Update Arc
export async function updateArc(arcId, updates) {
  try {
    const updatedArc = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsArcsCollectionId,
      arcId,
      updates
    );
    return updatedArc;
  } catch (error) {
    console.error("Error updating arc:", error);
    throw parseAppwriteError(error);
  }
}

// Delete Arc
export async function deleteArc(arcId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsArcsCollectionId,
      arcId
    );
    return true;
  } catch (error) {
    console.error("Error deleting arc:", error);
    throw parseAppwriteError(error);
  }
}

// Create Quest
export async function createQuest(form) {
  try {
    const newQuest = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsQuestsCollectionId,
      ID.unique(),
      {
        name: form.name,
        arcId: form.arcId,
        frequency: form.frequency || QuestFrequencies.DAILY,
        repetitionPerPeriod: form.repetitionPerPeriod || 1,
        intensity: form.intensity || 1,
        xpPerCompletion: form.xpPerCompletion || 10,
        accessLevel: form.accessLevel || null,
        householdId: form.householdId,
        createdBy: form.userId,
      }
    );
    return newQuest;
  } catch (error) {
    console.error("Error creating quest:", error);
    throw parseAppwriteError(error);
  }
}

// Get Household Quests
export async function getHouseholdQuests(householdId, arcId = null) {
  try {
    const queries = [Query.equal("householdId", householdId)];
    if (arcId) {
      queries.push(Query.equal("arcId", arcId));
    }
    queries.push(Query.orderAsc("name"));
    
    const quests = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.habitsQuestsCollectionId,
      queries
    );
    return quests.documents;
  } catch (error) {
    console.error("Error fetching quests:", error);
    throw parseAppwriteError(error);
  }
}

// Update Quest
export async function updateQuest(questId, updates) {
  try {
    const updatedQuest = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsQuestsCollectionId,
      questId,
      updates
    );
    return updatedQuest;
  } catch (error) {
    console.error("Error updating quest:", error);
    throw parseAppwriteError(error);
  }
}

// Delete Quest
export async function deleteQuest(questId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsQuestsCollectionId,
      questId
    );
    return true;
  } catch (error) {
    console.error("Error deleting quest:", error);
    throw parseAppwriteError(error);
  }
}

// Complete Quest
export async function completeQuest(form) {
  try {
    // Calculate current streak (simplified - would need to check last completion)
    const streakCount = form.streakCount || form.streak || 1;
    const penaltyXP = form.penaltyXP || 0;
    const netXP = (form.xpEarned || 10) - penaltyXP;
    
    const completion = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsQuestsCompletionsCollectionId,
      ID.unique(),
      {
        questId: form.questId,
        userId: form.userId,
        completedAt: form.completedAt || new Date().toISOString(),
        streakCount: streakCount,
        xpEarned: form.xpEarned || 10,
        householdId: form.householdId,
        penaltyXP: penaltyXP,
      }
    );
    
    // Log XP gain (net XP after penalty)
    await logXpGain({
      userId: form.userId,
      householdId: form.householdId,
      xpAmount: netXP,
      sourceType: 'quest',
      sourceId: form.questId,
      arcId: form.arcId,
      questName: form.questName,
      arcName: form.arcName,
      penaltyXP: penaltyXP,
      earnedAt: form.completedAt || new Date().toISOString(),
    });
    
    // Update user progress (with penalty and title/achievement unlocks)
    await updateUserProgress(
      form.userId, 
      form.householdId, 
      form.xpEarned || 10, 
      form.arcId, 
      'quest', 
      penaltyXP,
      form.newTitles || [],
      form.newAchievements || []
    );
    
    return completion;
  } catch (error) {
    console.error("Error completing quest:", error);
    throw parseAppwriteError(error);
  }
}

// Get Quest Completions
export async function getQuestCompletions(questId, userId = null, startDate = null, endDate = null) {
  try {
    if (!questId) {
      console.error("getQuestCompletions: questId is required");
      return [];
    }
    const queries = [Query.equal("questId", questId)];
    if (userId) {
      queries.push(Query.equal("userId", userId));
    }
    if (startDate) {
      queries.push(Query.greaterThanEqual("completedAt", startDate));
    }
    if (endDate) {
      queries.push(Query.lessThanEqual("completedAt", endDate));
    }
    queries.push(Query.orderDesc("completedAt"));
    
    const completions = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.habitsQuestsCompletionsCollectionId,
      queries
    );
    return completions.documents;
  } catch (error) {
    console.error("Error fetching quest completions:", error);
    throw parseAppwriteError(error);
  }
}

// Create Tier
export async function createTier(form) {
  try {
    const newTier = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsTiersCollectionId,
      ID.unique(),
      {
        name: form.name,
        arcId: form.arcId,
        targetValue: form.targetValue,
        targetType: form.targetType || TargetTypes.COUNT,
        xpReward: form.xpReward || 100,
        titleReward: form.titleReward || null,
        householdId: form.householdId,
        createdBy: form.userId,
      }
    );
    return newTier;
  } catch (error) {
    console.error("Error creating tier:", error);
    throw parseAppwriteError(error);
  }
}

// Get Household Tiers
export async function getHouseholdTiers(householdId, arcId = null) {
  try {
    const queries = [Query.equal("householdId", householdId)];
    if (arcId) {
      queries.push(Query.equal("arcId", arcId));
    }
    queries.push(Query.orderAsc("targetValue"));
    
    const tiers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.habitsTiersCollectionId,
      queries
    );
    return tiers.documents;
  } catch (error) {
    console.error("Error fetching tiers:", error);
    throw parseAppwriteError(error);
  }
}

// Update Tier
export async function updateTier(tierId, updates) {
  try {
    const updatedTier = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsTiersCollectionId,
      tierId,
      updates
    );
    return updatedTier;
  } catch (error) {
    console.error("Error updating tier:", error);
    throw parseAppwriteError(error);
  }
}

// Delete Tier
export async function deleteTier(tierId) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsTiersCollectionId,
      tierId
    );
    return true;
  } catch (error) {
    console.error("Error deleting tier:", error);
    throw parseAppwriteError(error);
  }
}

// Log XP Gain
export async function logXpGain(form) {
  try {
    const xpLog = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsXpHistoryCollectionId,
      ID.unique(),
      {
        userId: form.userId,
        householdId: form.householdId,
        xpAmount: form.xpAmount,
        sourceType: form.sourceType, // 'quest' or 'tier'
        sourceId: form.sourceId, // questId or tierId
        arcId: form.arcId || null,
        questName: form.questName || null,
        tierName: form.tierName || null,
        arcName: form.arcName || null,
        penaltyXP: form.penaltyXP || 0,
        earnedAt: form.earnedAt || new Date().toISOString(),
      }
    );
    return xpLog;
  } catch (error) {
    console.error("Error logging XP gain:", error);
    // Don't throw - XP logging shouldn't break quest/tier completion
    return null;
  }
}

// Get XP History
export async function getXpHistory(userId, householdId, filters = {}) {
  try {
    const queries = [
      Query.equal("userId", userId),
      Query.equal("householdId", householdId),
    ];
    
    // Filter by arc
    if (filters.arcId) {
      queries.push(Query.equal("arcId", filters.arcId));
    }
    
    // Filter by source type
    if (filters.sourceType) {
      queries.push(Query.equal("sourceType", filters.sourceType));
    }
    
    // Filter by date range
    if (filters.startDate) {
      queries.push(Query.greaterThanEqual("earnedAt", filters.startDate));
    }
    if (filters.endDate) {
      queries.push(Query.lessThanEqual("earnedAt", filters.endDate));
    }
    
    // Order by date (most recent first)
    queries.push(Query.orderDesc("earnedAt"));
    
    // Limit results
    if (filters.limit) {
      queries.push(Query.limit(filters.limit));
    }
    
    const history = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.habitsXpHistoryCollectionId,
      queries
    );
    
    return history.documents;
  } catch (error) {
    console.error("Error fetching XP history:", error);
    throw parseAppwriteError(error);
  }
}

// Complete Tier
export async function completeTier(form) {
  try {
    const completion = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsTiersCompletionsCollectionId,
      ID.unique(),
      {
        tierId: form.tierId,
        userId: form.userId,
        completedAt: form.completedAt || new Date().toISOString(),
        xpEarned: form.xpEarned || 100,
        householdId: form.householdId,
      }
    );
    
    // Log XP gain
    await logXpGain({
      userId: form.userId,
      householdId: form.householdId,
      xpAmount: form.xpEarned || 100,
      sourceType: 'tier',
      sourceId: form.tierId,
      arcId: form.arcId,
      tierName: form.tierName,
      arcName: form.arcName,
      earnedAt: form.completedAt || new Date().toISOString(),
    });
    
    // Update user progress (with title/achievement unlocks)
    await updateUserProgress(
      form.userId, 
      form.householdId, 
      form.xpEarned || 100, 
      form.arcId, 
      'tier',
      0,
      form.newTitles || [],
      form.newAchievements || []
    );
    
    return completion;
  } catch (error) {
    console.error("Error completing tier:", error);
    throw parseAppwriteError(error);
  }
}

// Get User Progress
export async function getUserProgress(userId, householdId) {
  try {
    const progress = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.habitsUserProgressCollectionId,
      [Query.equal("userId", userId), Query.equal("householdId", householdId)]
    );
    
    if (progress.documents.length > 0) {
      return progress.documents[0];
    }
    
    // Create default progress if doesn't exist
    return await createUserProgress(userId, householdId);
  } catch (error) {
    console.error("Error fetching user progress:", error);
    throw parseAppwriteError(error);
  }
}

// Create User Progress
export async function createUserProgress(userId, householdId) {
  try {
    const progress = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsUserProgressCollectionId,
      ID.unique(),
      {
        userId: userId,
        householdId: householdId,
        totalXP: 0,
        globalLevel: 1,
        progressionType: ProgressionTypes.PROGRESSIVE,
        penaltySystemActive: true,
        gameDurationYears: 1,
        classId: null,
        unlockedTitles: [],
        unlockedAchievements: [],
        arcProgress: "{}",
        totalPenalties: 0,
        totalPenaltyXP: 0,
      }
    );
    return progress;
  } catch (error) {
    console.error("Error creating user progress:", error);
    throw parseAppwriteError(error);
  }
}

// Calculate missed recurrences for a quest
export function calculateMissedRecurrences(quest, completions, currentDate = new Date()) {
  if (!quest || !completions) return 0;
  
  const frequency = quest.frequency || QuestFrequencies.DAILY;
  const repetitionPerPeriod = quest.repetitionPerPeriod || 1;
  
  // Sort completions by date (most recent first)
  const sortedCompletions = [...completions].sort((a, b) => {
    const dateA = new Date(a.completedAt || a.$createdAt);
    const dateB = new Date(b.completedAt || b.$createdAt);
    return dateB - dateA;
  });
  
  let missedCount = 0;
  const now = new Date(currentDate);
  now.setHours(23, 59, 59, 999);
  
  if (frequency === QuestFrequencies.DAILY) {
    // For daily quests, check each day since last completion
    const lastCompletion = sortedCompletions.length > 0 
      ? new Date(sortedCompletions[0].completedAt || sortedCompletions[0].$createdAt)
      : null;
    
    if (!lastCompletion) {
      // Never completed - count all days since quest creation or a reasonable start date
      const startDate = quest.$createdAt ? new Date(quest.$createdAt) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      missedCount = Math.max(0, daysDiff * repetitionPerPeriod);
    } else {
      // Count days since last completion
      const daysSince = Math.floor((now - lastCompletion) / (1000 * 60 * 60 * 24));
      if (daysSince > 1) {
        // Expected completions = days since last completion * repetition per day
        const expectedCompletions = (daysSince - 1) * repetitionPerPeriod;
        missedCount = Math.max(0, expectedCompletions - sortedCompletions.length);
      }
    }
  } else if (frequency === QuestFrequencies.WEEKLY) {
    // For weekly quests, check each week
    const lastCompletion = sortedCompletions.length > 0 
      ? new Date(sortedCompletions[0].completedAt || sortedCompletions[0].$createdAt)
      : null;
    
    if (!lastCompletion) {
      const startDate = quest.$createdAt ? new Date(quest.$createdAt) : new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);
      const weeksDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 7));
      missedCount = Math.max(0, weeksDiff * repetitionPerPeriod);
    } else {
      const weeksSince = Math.floor((now - lastCompletion) / (1000 * 60 * 60 * 24 * 7));
      if (weeksSince > 1) {
        const expectedCompletions = (weeksSince - 1) * repetitionPerPeriod;
        missedCount = Math.max(0, expectedCompletions - sortedCompletions.length);
      }
    }
  } else if (frequency === QuestFrequencies.MONTHLY) {
    // For monthly quests, check each month
    const lastCompletion = sortedCompletions.length > 0 
      ? new Date(sortedCompletions[0].completedAt || sortedCompletions[0].$createdAt)
      : null;
    
    if (!lastCompletion) {
      const startDate = quest.$createdAt ? new Date(quest.$createdAt) : new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
      const monthsDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 30));
      missedCount = Math.max(0, monthsDiff * repetitionPerPeriod);
    } else {
      const monthsSince = Math.floor((now - lastCompletion) / (1000 * 60 * 60 * 24 * 30));
      if (monthsSince > 1) {
        const expectedCompletions = (monthsSince - 1) * repetitionPerPeriod;
        missedCount = Math.max(0, expectedCompletions - sortedCompletions.length);
      }
    }
  }
  
  return missedCount;
}

// Calculate penalty XP for missed recurrences
export function calculatePenaltyXP(quest, missedRecurrences) {
  if (!quest || missedRecurrences <= 0) return 0;
  
  const xpPerCompletion = quest.xpPerCompletion || 10;
  // Penalty is 50% of the XP that would have been earned
  const penaltyPerMiss = Math.floor(xpPerCompletion * 0.5);
  
  return missedRecurrences * penaltyPerMiss;
}

// Toggle Penalty System
export async function togglePenaltySystem(userId, householdId, isActive) {
  try {
    const progress = await getUserProgress(userId, householdId);
    
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsUserProgressCollectionId,
      progress.$id,
      {
        penaltySystemActive: isActive,
      }
    );
    
    return { penaltySystemActive: isActive };
  } catch (error) {
    console.error("Error toggling penalty system:", error);
    throw parseAppwriteError(error);
  }
}

// Override Penalty (manual override)
export async function overridePenalty(userId, householdId, questId, arcId) {
  try {
    const progress = await getUserProgress(userId, householdId);
    
    let arcProgressData = {};
    try {
      arcProgressData = progress.arcProgress ? JSON.parse(progress.arcProgress) : {};
    } catch (e) {
      arcProgressData = {};
    }
    
    if (arcId && arcProgressData[arcId]) {
      // Reduce missed recurrences and penalty XP
      arcProgressData[arcId].missedRecurrences = Math.max(0, (arcProgressData[arcId].missedRecurrences || 0) - 1);
      // Restore some penalty XP (50% back)
      const restoredXP = Math.floor((arcProgressData[arcId].penaltyXP || 0) * 0.5);
      arcProgressData[arcId].penaltyXP = Math.max(0, (arcProgressData[arcId].penaltyXP || 0) - restoredXP);
      arcProgressData[arcId].totalXP = (arcProgressData[arcId].totalXP || 0) + restoredXP;
      
      const newTotalXP = Math.max(0, (progress.totalXP || 0) + restoredXP);
      const newLevel = calculateLevel(newTotalXP, progress.progressionType || ProgressionTypes.PROGRESSIVE);
      
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.habitsUserProgressCollectionId,
        progress.$id,
        {
          totalXP: newTotalXP,
          globalLevel: newLevel,
          arcProgress: JSON.stringify(arcProgressData),
          totalPenalties: Math.max(0, (progress.totalPenalties || 0) - 1),
          totalPenaltyXP: Math.max(0, (progress.totalPenaltyXP || 0) - restoredXP),
        }
      );
      
      return { success: true, restoredXP };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error overriding penalty:", error);
    throw parseAppwriteError(error);
  }
}

// Update User Progress
export async function updateUserProgress(userId, householdId, xpEarned, arcId = null, completionType = null, penaltyXP = 0, newTitles = [], newAchievements = []) {
  try {
    const progress = await getUserProgress(userId, householdId);
    
    // Apply penalty if penalty system is active
    const finalXP = progress.penaltySystemActive && penaltyXP > 0 
      ? xpEarned - penaltyXP 
      : xpEarned;
    
    const newTotalXP = Math.max(0, (progress.totalXP || 0) + finalXP);
    const newLevel = calculateLevel(newTotalXP, progress.progressionType || ProgressionTypes.PROGRESSIVE);
    
    let arcProgressData = {};
    try {
      arcProgressData = progress.arcProgress ? JSON.parse(progress.arcProgress) : {};
    } catch (e) {
      arcProgressData = {};
    }
    
    // Track penalties
    const totalPenalties = (progress.totalPenalties || 0) + (penaltyXP > 0 ? 1 : 0);
    const totalPenaltyXP = (progress.totalPenaltyXP || 0) + penaltyXP;
    
    // Update unlocked titles and achievements
    const currentTitles = progress.unlockedTitles || [];
    const currentAchievements = progress.unlockedAchievements || [];
    const updatedTitles = [...new Set([...currentTitles, ...newTitles])];
    const updatedAchievements = [...new Set([...currentAchievements, ...newAchievements])];
    
    if (arcId) {
      if (!arcProgressData[arcId]) {
        arcProgressData[arcId] = {
          totalXP: 0,
          level: 1,
          questsCompleted: 0,
          tiersCompleted: 0,
          missedRecurrences: 0,
          penaltyXP: 0,
        };
      }
      
      const arcFinalXP = progress.penaltySystemActive && penaltyXP > 0 
        ? xpEarned - penaltyXP 
        : xpEarned;
      
      arcProgressData[arcId].totalXP = Math.max(0, (arcProgressData[arcId].totalXP || 0) + arcFinalXP);
      arcProgressData[arcId].level = calculateLevel(arcProgressData[arcId].totalXP, progress.progressionType || ProgressionTypes.PROGRESSIVE);
      
      // Increment completion counters
      if (completionType === 'quest') {
        arcProgressData[arcId].questsCompleted = (arcProgressData[arcId].questsCompleted || 0) + 1;
      } else if (completionType === 'tier') {
        arcProgressData[arcId].tiersCompleted = (arcProgressData[arcId].tiersCompleted || 0) + 1;
      }
      
      if (penaltyXP > 0) {
        arcProgressData[arcId].missedRecurrences = (arcProgressData[arcId].missedRecurrences || 0) + 1;
        arcProgressData[arcId].penaltyXP = (arcProgressData[arcId].penaltyXP || 0) + penaltyXP;
      }
    }
    
    const updatedProgress = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsUserProgressCollectionId,
      progress.$id,
      {
        totalXP: newTotalXP,
        globalLevel: newLevel,
        arcProgress: JSON.stringify(arcProgressData),
        totalPenalties: totalPenalties,
        totalPenaltyXP: totalPenaltyXP,
        unlockedTitles: updatedTitles,
        unlockedAchievements: updatedAchievements,
      }
    );
    
    return updatedProgress;
  } catch (error) {
    console.error("Error updating user progress:", error);
    throw parseAppwriteError(error);
  }
}

// Update Progression Type
export async function updateProgressionType(userId, householdId, progressionType) {
  try {
    const progress = await getUserProgress(userId, householdId);
    
    // Recalculate levels with new progression type
    const newLevel = calculateLevel(progress.totalXP || 0, progressionType);
    
    // Recalculate arc levels
    let arcProgressData = {};
    try {
      arcProgressData = progress.arcProgress ? JSON.parse(progress.arcProgress) : {};
    } catch (e) {
      arcProgressData = {};
    }
    
    // Update all arc levels
    for (const arcId in arcProgressData) {
      if (arcProgressData[arcId]) {
        arcProgressData[arcId].level = calculateLevel(arcProgressData[arcId].totalXP || 0, progressionType);
      }
    }
    
    const updatedProgress = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.habitsUserProgressCollectionId,
      progress.$id,
      {
        progressionType: progressionType,
        globalLevel: newLevel,
        arcProgress: JSON.stringify(arcProgressData),
      }
    );
    
    return updatedProgress;
  } catch (error) {
    console.error("Error updating progression type:", error);
    throw parseAppwriteError(error);
  }
}

// Calculate Level from XP
export function calculateLevel(xp, progressionType) {
  if (progressionType === ProgressionTypes.LINEAR) {
    // Linear: 100 XP per level
    return Math.floor(xp / 100) + 1;
  } else {
    // Progressive: exponential growth
    // Level 1: 0-50 XP
    // Level 2: 51-150 XP
    // Level 3: 151-300 XP
    // Level 4: 301-500 XP
    // etc.
    let level = 1;
    let requiredXP = 50;
    let currentXP = xp;
    
    while (currentXP >= requiredXP) {
      level++;
      currentXP -= requiredXP;
      requiredXP = Math.floor(requiredXP * 1.5);
    }
    
    return level;
  }
}

// Calculate total XP needed to reach a level
export function getTotalXPForLevel(level, progressionType) {
  if (progressionType === ProgressionTypes.LINEAR) {
    return (level - 1) * 100;
  } else {
    // Progressive: sum of XP needed for each level
    let totalXP = 0;
    let xpForLevel = 50;
    for (let i = 1; i < level; i++) {
      totalXP += xpForLevel;
      xpForLevel = Math.floor(xpForLevel * 1.5);
    }
    return totalXP;
  }
}

// Calculate XP needed for next level (from current level)
export function getXPForNextLevel(currentLevel, progressionType) {
  if (progressionType === ProgressionTypes.LINEAR) {
    return 100;
  } else {
    // Progressive: XP needed to go from currentLevel to currentLevel+1
    let xpForLevel = 50;
    for (let i = 1; i < currentLevel; i++) {
      xpForLevel = Math.floor(xpForLevel * 1.5);
    }
    return xpForLevel;
  }
}

// Import Example Data
export async function importExampleData(userId, householdId) {
  try {
    const { EXAMPLE_ARCS, EXAMPLE_QUESTS, EXAMPLE_TIERS } = await import('../app/(tools)/habits/data/examples');
    
    const results = {
      arcs: [],
      quests: [],
      tiers: [],
      errors: [],
    };

    // Step 1: Create Arcs
    const arcMap = {}; // Map arcName -> arcId
    
    for (const arcData of EXAMPLE_ARCS) {
      try {
        const arc = await createArc({
          name: arcData.name,
          color: arcData.color,
          icon: arcData.icon,
          description: arcData.description,
          householdId: householdId,
          userId: userId,
        });
        arcMap[arcData.name] = arc.$id;
        results.arcs.push(arc);
      } catch (error) {
        console.error(`Error creating arc ${arcData.name}:`, error);
        results.errors.push(`Arc "${arcData.name}": ${error.message}`);
      }
    }

    // Step 2: Create Quests (linked to arcs)
    for (const questData of EXAMPLE_QUESTS) {
      const arcId = arcMap[questData.arcName];
      if (!arcId) {
        results.errors.push(`Quest "${questData.name}": Arc "${questData.arcName}" not found`);
        continue;
      }

      try {
        const quest = await createQuest({
          name: questData.name,
          arcId: arcId,
          frequency: questData.frequency,
          repetitionPerPeriod: questData.repetitionPerPeriod,
          intensity: questData.intensity,
          xpPerCompletion: questData.xpPerCompletion,
          householdId: householdId,
          userId: userId,
        });
        results.quests.push(quest);
      } catch (error) {
        console.error(`Error creating quest ${questData.name}:`, error);
        results.errors.push(`Quest "${questData.name}": ${error.message}`);
      }
    }

    // Step 3: Create Tiers (linked to arcs)
    for (const tierData of EXAMPLE_TIERS) {
      const arcId = arcMap[tierData.arcName];
      if (!arcId) {
        results.errors.push(`Tier "${tierData.name}": Arc "${tierData.arcName}" not found`);
        continue;
      }

      try {
        const tier = await createTier({
          name: tierData.name,
          arcId: arcId,
          targetValue: tierData.targetValue,
          targetType: tierData.targetType,
          xpReward: tierData.xpReward,
          titleReward: tierData.titleReward,
          householdId: householdId,
          userId: userId,
        });
        results.tiers.push(tier);
      } catch (error) {
        console.error(`Error creating tier ${tierData.name}:`, error);
        results.errors.push(`Tier "${tierData.name}": ${error.message}`);
      }
    }

    return {
      success: results.errors.length === 0,
      summary: {
        arcsCreated: results.arcs.length,
        questsCreated: results.quests.length,
        tiersCreated: results.tiers.length,
        errors: results.errors,
      },
    };
  } catch (error) {
    console.error('Error importing example data:', error);
    throw parseAppwriteError(error);
  }
}

