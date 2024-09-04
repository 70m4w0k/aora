import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

// export const appwriteConfigSelfHosted = {
//   endpoint: "http://172.20.0.20/v1",
//   platform: "com.neonzed.aora",
//   projectId: "66d5c65800381a9ecf0f",
//   databaseId: "66d5c7b0000725c81594",
//   userCollectionId: "66d5c7cc0005a285d522",
//   videoCollectionId: "66d5c7de003ad7e2bb9d",
//   storageId: "66d5c8d00012e94572f1",
// };

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

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

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
