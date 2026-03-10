#!/usr/bin/env node

/**
 * Appwrite to PostgreSQL Migration Script
 * Migrates 23 collections from Appwrite to PostgreSQL
 */

const {
  Client: AppwriteClient,
  Databases: AppwriteDatabases,
  Query: AppwriteQuery,
} = require("node-appwrite");
const { Client: PGClient } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnvFromCandidates() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, ".env"),
    path.resolve(__dirname, "../.env"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return candidate;
    }
  }

  return null;
}

// Load env early so config picks up real values.
loadEnvFromCandidates();

// Configuration
function buildConfig() {
  return {
    // Appwrite Configuration
    appwrite: {
      endpoint:
        process.env.APPWRITE_ENDPOINT ||
        process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ||
        "https://cloud.appwrite.io/v1",
      projectId:
        process.env.APPWRITE_PROJECT_ID ||
        process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ||
        "YOUR_PROJECT_ID",
      apiKey: process.env.APPWRITE_API_KEY || "YOUR_API_KEY",
      databaseId:
        process.env.APPWRITE_DATABASE_ID ||
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ||
        "66cc7c760013e5170042",
    },

    // PostgreSQL Configuration
    postgres: {
      host: process.env.PG_HOST || "localhost",
      port: parseInt(process.env.PG_PORT || "5432"),
      database: process.env.PG_DATABASE || "household_app",
      user: process.env.PG_USER || "postgres",
      password: process.env.PG_PASSWORD || "password",
    },

    // Migration Settings
    migration: {
      batchSize: 100,
      maxRetries: 3,
      logLevel: "info", // 'debug', 'info', 'warn', 'error'
    },
  };
}

let config = buildConfig();

// Logger
class Logger {
  constructor(level = "info") {
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.currentLevel = this.levels[level];
  }

  log(level, message, data = null) {
    if (this.levels[level] >= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      console.log(logMessage);
      if (data) {
        if (data instanceof Error) {
          console.log(
            JSON.stringify(
              {
                name: data.name,
                message: data.message,
                stack: data.stack,
                code: data.code,
                response: data.response,
              },
              null,
              2,
            ),
          );
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      }
    }
  }

  debug(message, data) {
    this.log("debug", message, data);
  }
  info(message, data) {
    this.log("info", message, data);
  }
  warn(message, data) {
    this.log("warn", message, data);
  }
  error(message, data) {
    this.log("error", message, data);
  }
}

const logger = new Logger(config.migration.logLevel);

// Migration Manager
class MigrationManager {
  constructor(appwriteConfig, postgresConfig) {
    this.appwriteConfig = appwriteConfig;
    this.postgresConfig = postgresConfig;
    this.appwriteClient = null;
    this.appwriteDatabases = null;
    this.pgClient = null;
    this.collectionIdByName = new Map();
    this.tableColumnMeta = new Map();

    this.stats = {
      totalCollections: 0,
      totalDocuments: 0,
      migratedDocuments: 0,
      errors: [],
      startTime: null,
      endTime: null,
    };

    this.collectionMappings = {
      // Appwrite collection name -> PostgreSQL table name
      users: "users",
      households: "households",
      tasks: "tasks",
      task_done: "task_completions",
      shopping_items: "shopping_items",
      expenses: "expenses",
      expense_settlements: "expense_settlements",
      plants: "plants",
      plant_events: "plant_events",
      plant_reminders: "plant_reminders",
      documents: "documents",
      stores: "stores",
      products: "products",
      pricehistory: "price_history",
      events: "events",
      habits_arcs: "habits_arcs",
      habits_quests: "habits_quests",
      habits_quests_completions: "habits_quests_completions",
      habits_tiers: "habits_tiers",
      habits_tiers_completions: "habits_tiers_completions",
      habits_user_progress: "habits_user_progress",
      habits_xp_history: "habits_xp_history",
      videos: "videos",
    };

    // Migration order (respecting foreign key dependencies)
    this.migrationOrder = [
      "households",
      "users",
      "tasks",
      "task_done",
      "stores",
      "products",
      "shopping_items",
      "expenses",
      "expense_settlements",
      "pricehistory",
      "plants",
      "plant_events",
      "plant_reminders",
      "documents",
      "events",
      "habits_arcs",
      "habits_quests",
      "habits_quests_completions",
      "habits_tiers",
      "habits_tiers_completions",
      "habits_user_progress",
      "habits_xp_history",
      "videos",
    ];
  }

  async initialize() {
    try {
      logger.info("Initializing migration...");

      // Initialize Appwrite client
      this.appwriteClient = new AppwriteClient()
        .setEndpoint(this.appwriteConfig.endpoint)
        .setProject(this.appwriteConfig.projectId)
        .setKey(this.appwriteConfig.apiKey);

      this.appwriteDatabases = new AppwriteDatabases(this.appwriteClient);
      logger.info("✅ Appwrite client initialized");

      // Cache Appwrite collection name -> id mapping so migration can
      // target real collection IDs even when they differ from labels.
      const collectionsResponse = await this.appwriteDatabases.listCollections(
        this.appwriteConfig.databaseId,
      );
      for (const collection of collectionsResponse.collections || []) {
        this.collectionIdByName.set(collection.name, collection.$id);
        this.collectionIdByName.set(collection.$id, collection.$id);
      }
      logger.info(
        `Loaded ${this.collectionIdByName.size} Appwrite collection mappings`,
      );

      // Initialize PostgreSQL client
      this.pgClient = new PGClient(this.postgresConfig);
      await this.pgClient.connect();
      logger.info("✅ PostgreSQL client connected");

      // Create migration tracking table if not exists
      await this.createMigrationTrackingTable();

      return true;
    } catch (error) {
      logger.error("Failed to initialize migration", error);
      throw error;
    }
  }

  async createMigrationTrackingTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migration_tracking (
        id SERIAL PRIMARY KEY,
        appwrite_collection VARCHAR(100) NOT NULL,
        migrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        records_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        UNIQUE(appwrite_collection)
      );
    `;

    await this.pgClient.query(query);
    await this.pgClient.query(`
      ALTER TABLE migration_tracking
      ADD COLUMN IF NOT EXISTS error_message TEXT
    `);
    await this.pgClient.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS migration_tracking_appwrite_collection_key
      ON migration_tracking (appwrite_collection)
    `);
    logger.info("Migration tracking table ready");
  }

  async getMigrationStatus(collectionName) {
    const query = `
      SELECT status, records_count, error_message 
      FROM migration_tracking 
      WHERE appwrite_collection = $1
    `;

    const result = await this.pgClient.query(query, [collectionName]);
    return result.rows[0] || null;
  }

  async updateMigrationStatus(
    collectionName,
    status,
    recordsCount = 0,
    errorMessage = null,
  ) {
    const query = `
      INSERT INTO migration_tracking (appwrite_collection, status, records_count, error_message)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (appwrite_collection) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        records_count = EXCLUDED.records_count,
        error_message = EXCLUDED.error_message,
        migrated_at = CASE 
          WHEN EXCLUDED.status = 'completed' THEN CURRENT_TIMESTAMP
          ELSE migration_tracking.migrated_at
        END
    `;

    await this.pgClient.query(query, [
      collectionName,
      status,
      recordsCount,
      errorMessage,
    ]);
  }

  async migrateCollection(collectionName) {
    const tableName = this.collectionMappings[collectionName];
    if (!tableName) {
      throw new Error(
        `No table mapping found for collection: ${collectionName}`,
      );
    }

    logger.info(`Starting migration of ${collectionName} to ${tableName}`);

    // Check if already migrated
    const status = await this.getMigrationStatus(collectionName);
    if (status && status.status === "completed") {
      logger.info(
        `Collection ${collectionName} already migrated (${status.records_count} records)`,
      );
      return status.records_count;
    }

    await this.updateMigrationStatus(collectionName, "in_progress");

    try {
      // Get all documents from Appwrite
      let allDocuments = [];
      let cursor = null;
      let totalDocuments = 0;

      const appwriteCollectionId = this.resolveAppwriteCollectionId(collectionName);

      do {
        const response = await this.appwriteDatabases.listDocuments(
          this.appwriteConfig.databaseId,
          appwriteCollectionId,
          cursor ? [AppwriteQuery.cursorAfter(cursor)] : [],
        );

        allDocuments = allDocuments.concat(response.documents);
        totalDocuments = response.total;
        cursor =
          response.documents.length > 0
            ? response.documents[response.documents.length - 1].$id
            : null;

        logger.debug(
          `Fetched ${allDocuments.length}/${totalDocuments} documents from ${collectionName}`,
        );
      } while (cursor && allDocuments.length < totalDocuments);

      logger.info(`Found ${totalDocuments} documents in ${collectionName}`);

      // Process documents in batches
      let migratedCount = 0;
      const batchSize = config.migration.batchSize;

      for (let i = 0; i < allDocuments.length; i += batchSize) {
        const batch = allDocuments.slice(i, i + batchSize);
        const processedBatch = await this.processDocuments(
          collectionName,
          tableName,
          batch,
        );

        migratedCount += processedBatch.length;
        logger.info(
          `Processed ${migratedCount}/${totalDocuments} documents from ${collectionName}`,
        );
      }

      await this.updateMigrationStatus(
        collectionName,
        "completed",
        migratedCount,
      );
      logger.info(
        `✅ Completed migration of ${collectionName}: ${migratedCount} documents`,
      );

      return migratedCount;
    } catch (error) {
      await this.updateMigrationStatus(
        collectionName,
        "failed",
        0,
        error.message,
      );
      logger.error(`Failed to migrate ${collectionName}`, error);
      throw error;
    }
  }

  resolveAppwriteCollectionId(collectionName) {
    // Prefer exact key match (handles both raw ID and exact Appwrite name)
    if (this.collectionIdByName.has(collectionName)) {
      return this.collectionIdByName.get(collectionName);
    }

    // Fallback: case-insensitive compare to tolerate naming differences
    const lowered = collectionName.toLowerCase();
    for (const [name, id] of this.collectionIdByName.entries()) {
      if (name.toLowerCase() === lowered) {
        return id;
      }
    }

    const available = [...this.collectionIdByName.keys()].slice(0, 20).join(", ");
    throw new Error(
      `Collection '${collectionName}' not found in Appwrite mapping. Available names/ids include: ${available}`,
    );
  }

  async processDocuments(collectionName, tableName, documents) {
    const processedDocs = [];

    for (const doc of documents) {
      try {
        const processedDoc = await this.transformDocument(collectionName, doc);
        await this.insertDocument(tableName, processedDoc);
        processedDocs.push(doc.$id);
      } catch (error) {
        logger.warn(
          `Failed to process document ${doc.$id} from ${collectionName}`,
          {
            error: error.message,
            documentId: doc.$id,
          },
        );
        // Continue with other documents
      }
    }

    return processedDocs;
  }

  async transformDocument(collectionName, appwriteDoc) {
    // Base transformation - preserve Appwrite ID and metadata
    const transformed = {
      appwrite_id: appwriteDoc.$id,
      metadata: {
        appwrite_created_at: appwriteDoc.$createdAt,
        appwrite_updated_at: appwriteDoc.$updatedAt,
        appwrite_permissions: appwriteDoc.$permissions,
        original_data: { ...appwriteDoc },
      },
    };

    // Remove Appwrite system fields
    delete transformed.metadata.original_data.$id;
    delete transformed.metadata.original_data.$createdAt;
    delete transformed.metadata.original_data.$updatedAt;
    delete transformed.metadata.original_data.$permissions;
    delete transformed.metadata.original_data.$databaseId;
    delete transformed.metadata.original_data.$collectionId;

    // Collection-specific transformations
    switch (collectionName) {
      case "users":
        transformed.email = appwriteDoc.email;
        transformed.username = appwriteDoc.username;
        transformed.avatar_url = appwriteDoc.avatar;
        transformed.role = appwriteDoc.role;
        transformed.preferences = {};
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // household_id will be resolved later
        break;

      case "households":
        transformed.name = appwriteDoc.name;
        transformed.description = "";
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        transformed.settings = {};
        break;

      case "tasks":
        transformed.title = appwriteDoc.title;
        transformed.recurrence = appwriteDoc.recurrence;
        transformed.status = "pending";
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // household_id will be resolved later
        break;

      case "task_done":
        transformed.completed_at = appwriteDoc.completedAt;
        transformed.notes = "";
        transformed.xp_earned = 0;
        // task_id and completed_by will be resolved later
        break;

      case "shopping_items":
        transformed.name = appwriteDoc.name;
        transformed.category = appwriteDoc.category;
        transformed.status = appwriteDoc.completed ? "purchased" : "pending";
        transformed.quantity = parseFloat(appwriteDoc.quantity) || 1;
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // household_id and other relationships resolved later
        break;

      case "expenses":
        transformed.title = appwriteDoc.title;
        transformed.amount = appwriteDoc.amount;
        transformed.category = appwriteDoc.category;
        transformed.expense_date = appwriteDoc.date;
        transformed.notes = appwriteDoc.notes;
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // household_id and user_id resolved later
        break;

      case "plants":
        transformed.name = appwriteDoc.name;
        transformed.species = appwriteDoc.type;
        transformed.variety = appwriteDoc.variety;
        transformed.care_instructions = appwriteDoc.notes;
        transformed.image_url = appwriteDoc.mainImageId;
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        break;

      case "plant_events":
        transformed.event_type = appwriteDoc.eventType;
        transformed.performed_at = appwriteDoc.date;
        transformed.notes = appwriteDoc.notes;
        transformed.xp_earned = 0;
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // plant_id resolved later
        break;

      case "documents":
        transformed.title = appwriteDoc.name;
        transformed.description = appwriteDoc.description;
        transformed.file_url = appwriteDoc.fileUrl;
        transformed.file_type = appwriteDoc.fileName?.split(".").pop();
        transformed.category = appwriteDoc.category;
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // household_id and uploaded_by resolved later
        break;

      case "videos":
        transformed.title = appwriteDoc.title;
        transformed.description = appwriteDoc.prompt;
        transformed.video_url = appwriteDoc.video;
        transformed.thumbnail_url = appwriteDoc.thumbnail;
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
        // household_id resolved later
        break;

      // Add more collection-specific transformations as needed
      default:
        // For collections without specific transformation, map fields generically
        Object.keys(appwriteDoc).forEach((key) => {
          if (!key.startsWith("$")) {
            transformed[key] = appwriteDoc[key];
          }
        });
        transformed.created_at = appwriteDoc.$createdAt;
        transformed.updated_at = appwriteDoc.$updatedAt;
    }

    // Store householdId for later resolution
    if (appwriteDoc.householdId) {
      transformed.metadata.household_id = appwriteDoc.householdId;
    }

    // Store relationship references for later resolution
    if (
      appwriteDoc.creator ||
      appwriteDoc.userId ||
      appwriteDoc.taskId ||
      appwriteDoc.plantId ||
      appwriteDoc.arcId ||
      appwriteDoc.questId ||
      appwriteDoc.tierId ||
      appwriteDoc.paidBy ||
      appwriteDoc.paidTo ||
      appwriteDoc.assignedTo ||
      appwriteDoc.createdBy ||
      appwriteDoc.owner
    ) {
      transformed.metadata.relationships = {
        creator: appwriteDoc.creator?.$id,
        user_id: appwriteDoc.userId?.$id,
        task_id: appwriteDoc.taskId?.$id,
        plant_id: appwriteDoc.plantId?.$id,
        arc_id: appwriteDoc.arcId?.$id,
        quest_id: appwriteDoc.questId?.$id,
        tier_id: appwriteDoc.tierId?.$id,
        paid_by: appwriteDoc.paidBy?.$id,
        paid_to: appwriteDoc.paidTo?.$id,
        assigned_to: appwriteDoc.assignedTo?.$id,
        created_by: appwriteDoc.createdBy?.$id,
        owner: appwriteDoc.owner?.$id,
      };
    }

    return transformed;
  }

  async insertDocument(tableName, document) {
    const meta = await this.getTableColumnMeta(tableName);
    const entries = Object.entries(document).filter(([column]) => meta[column]);

    if (entries.length === 0) {
      throw new Error(`No matching columns found for table '${tableName}'`);
    }

    const columns = entries.map(([column]) => column);
    const values = entries.map(([column, value]) =>
      this.normalizeValueForColumn(value, meta[column]),
    );
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const query = `
      INSERT INTO ${tableName} (${columns.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (appwrite_id) DO NOTHING
    `;

    await this.pgClient.query(query, values);
  }

  async getTableColumnMeta(tableName) {
    if (this.tableColumnMeta.has(tableName)) {
      return this.tableColumnMeta.get(tableName);
    }

    const result = await this.pgClient.query(
      `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
    `,
      [tableName],
    );

    const meta = {};
    for (const row of result.rows) {
      meta[row.column_name] = {
        dataType: row.data_type,
        udtName: row.udt_name,
      };
    }

    this.tableColumnMeta.set(tableName, meta);
    return meta;
  }

  normalizeValueForColumn(value, columnMeta) {
    if (value === undefined) return null;
    if (value === null) return null;

    if (
      (columnMeta.dataType === "json" || columnMeta.dataType === "jsonb") &&
      typeof value === "string"
    ) {
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed);
      } catch {
        // Keep scalar strings as valid JSON values.
        return JSON.stringify(value);
      }
    }

    return value;
  }

  async resolveForeignKeys() {
    logger.info("Resolving foreign key relationships...");

    // Resolve household_id references
    await this.resolveHouseholdReferences();

    // Resolve user_id references
    await this.resolveUserReferences();

    // Resolve other relationships
    await this.resolveTaskReferences();
    await this.resolvePlantReferences();
    await this.resolveHabitReferences();

    logger.info("✅ Foreign key relationships resolved");
  }

  async resolveHouseholdReferences() {
    // Get mapping of Appwrite household IDs to PostgreSQL IDs
    const householdMap = await this.getReferenceMap(
      "households",
      "appwrite_id",
      "id",
    );

    // Update tables that reference households
    const tablesWithHouseholdRef = [
      "users",
      "tasks",
      "shopping_items",
      "expenses",
      "expense_settlements",
      "plants",
      "documents",
      "events",
      "habits_arcs",
      "videos",
    ];

    for (const table of tablesWithHouseholdRef) {
      const rows = await this.pgClient.query(`
        SELECT id, metadata->>'household_id' as appwrite_household_id 
        FROM ${table} 
        WHERE metadata->>'household_id' IS NOT NULL
      `);

      for (const row of rows.rows) {
        const pgHouseholdId = householdMap[row.appwrite_household_id];
        if (pgHouseholdId) {
          await this.pgClient.query(
            `UPDATE ${table} SET household_id = $1 WHERE id = $2`,
            [pgHouseholdId, row.id],
          );
        }
      }
    }
  }

  async resolveUserReferences() {
    const userMap = await this.getReferenceMap("users", "appwrite_id", "id");

    // Update various tables that reference users
    const updateQueries = [
      // tasks table
      {
        table: "tasks",
        column: "created_by",
        metadataKey: "relationships.created_by",
      },
      {
        table: "tasks",
        column: "assigned_to",
        metadataKey: "relationships.assigned_to",
      },
      // task_completions table
      {
        table: "task_completions",
        column: "completed_by",
        metadataKey: "relationships.user_id",
      },
      // shopping_items table
      {
        table: "shopping_items",
        column: "added_by",
        metadataKey: "relationships.created_by",
      },
      {
        table: "shopping_items",
        column: "purchased_by",
        metadataKey: "relationships.assigned_to",
      },
      // expenses table
      {
        table: "expenses",
        column: "user_id",
        metadataKey: "relationships.paid_by",
      },
      // expense_settlements table
      {
        table: "expense_settlements",
        column: "from_user_id",
        metadataKey: "relationships.paid_by",
      },
      {
        table: "expense_settlements",
        column: "to_user_id",
        metadataKey: "relationships.paid_to",
      },
      // documents table
      {
        table: "documents",
        column: "uploaded_by",
        metadataKey: "relationships.created_by",
      },
      // events table
      {
        table: "events",
        column: "created_by",
        metadataKey: "relationships.created_by",
      },
      {
        table: "events",
        column: "assigned_to",
        metadataKey: "relationships.assigned_to",
      },
      // plants table
      {
        table: "plants",
        column: "metadata",
        metadataKey: "relationships.owner",
      }, // Note: owner stored in metadata
      // plant_events table
      {
        table: "plant_events",
        column: "performed_by",
        metadataKey: "relationships.creator",
      },
      // videos table
      {
        table: "videos",
        column: "uploaded_by",
        metadataKey: "relationships.creator",
      },
      // habits tables
      {
        table: "habits_quests_completions",
        column: "user_id",
        metadataKey: "relationships.user_id",
      },
      {
        table: "habits_tiers_completions",
        column: "user_id",
        metadataKey: "relationships.user_id",
      },
      {
        table: "habits_user_progress",
        column: "user_id",
        metadataKey: "relationships.user_id",
      },
      {
        table: "habits_xp_history",
        column: "user_id",
        metadataKey: "relationships.user_id",
      },
    ];

    for (const query of updateQueries) {
      await this.updateReferences(
        userMap,
        query.table,
        query.column,
        query.metadataKey,
      );
    }
  }

  async resolveTaskReferences() {
    const taskMap = await this.getReferenceMap("tasks", "appwrite_id", "id");

    // Update task_completions table
    const rows = await this.pgClient.query(`
      SELECT id, metadata->'relationships'->>'task_id' as appwrite_task_id 
      FROM task_completions 
      WHERE metadata->'relationships'->>'task_id' IS NOT NULL
    `);

    for (const row of rows.rows) {
      const pgTaskId = taskMap[row.appwrite_task_id];
      if (pgTaskId) {
        await this.pgClient.query(
          "UPDATE task_completions SET task_id = $1 WHERE id = $2",
          [pgTaskId, row.id],
        );
      }
    }
  }

  async resolvePlantReferences() {
    const plantMap = await this.getReferenceMap("plants", "appwrite_id", "id");

    // Update plant_events table
    const rows = await this.pgClient.query(`
      SELECT id, metadata->'relationships'->>'plant_id' as appwrite_plant_id 
      FROM plant_events 
      WHERE metadata->'relationships'->>'plant_id' IS NOT NULL
    `);

    for (const row of rows.rows) {
      const pgPlantId = plantMap[row.appwrite_plant_id];
      if (pgPlantId) {
        await this.pgClient.query(
          "UPDATE plant_events SET plant_id = $1 WHERE id = $2",
          [pgPlantId, row.id],
        );
      }
    }

    // Update plant_reminders table
    const reminderRows = await this.pgClient.query(`
      SELECT id, metadata->'relationships'->>'plant_id' as appwrite_plant_id 
      FROM plant_reminders 
      WHERE metadata->'relationships'->>'plant_id' IS NOT NULL
    `);

    for (const row of reminderRows.rows) {
      const pgPlantId = plantMap[row.appwrite_plant_id];
      if (pgPlantId) {
        await this.pgClient.query(
          "UPDATE plant_reminders SET plant_id = $1 WHERE id = $2",
          [pgPlantId, row.id],
        );
      }
    }
  }

  async resolveHabitReferences() {
    // Resolve arc references
    const arcMap = await this.getReferenceMap(
      "habits_arcs",
      "appwrite_id",
      "id",
    );

    // Update habits_quests
    await this.updateReferences(
      arcMap,
      "habits_quests",
      "arc_id",
      "relationships.arc_id",
    );

    // Update habits_tiers
    await this.updateReferences(
      arcMap,
      "habits_tiers",
      "arc_id",
      "relationships.arc_id",
    );

    // Update habits_user_progress
    await this.updateReferences(
      arcMap,
      "habits_user_progress",
      "arc_id",
      "relationships.arc_id",
    );

    // Update habits_xp_history
    await this.updateReferences(
      arcMap,
      "habits_xp_history",
      "arc_id",
      "relationships.arc_id",
    );

    // Resolve quest references
    const questMap = await this.getReferenceMap(
      "habits_quests",
      "appwrite_id",
      "id",
    );
    await this.updateReferences(
      questMap,
      "habits_quests_completions",
      "quest_id",
      "relationships.quest_id",
    );

    // Resolve tier references
    const tierMap = await this.getReferenceMap(
      "habits_tiers",
      "appwrite_id",
      "id",
    );
    await this.updateReferences(
      tierMap,
      "habits_tiers_completions",
      "tier_id",
      "relationships.tier_id",
    );
    await this.updateReferences(
      tierMap,
      "habits_user_progress",
      "current_tier_id",
      "relationships.tier_id",
    );
  }

  async getReferenceMap(tableName, sourceColumn, targetColumn) {
    const result = await this.pgClient.query(
      `SELECT ${sourceColumn}, ${targetColumn} FROM ${tableName}`,
    );

    const map = {};
    result.rows.forEach((row) => {
      map[row[sourceColumn]] = row[targetColumn];
    });

    return map;
  }

  async updateReferences(referenceMap, tableName, columnName, metadataPath) {
    const rows = await this.pgClient.query(`
      SELECT id, metadata#>>'{${metadataPath
        .split(".")
        .map((p) => `"${p}"`)
        .join(",")}}' as appwrite_ref_id 
      FROM ${tableName} 
      WHERE metadata#>>'{${metadataPath
        .split(".")
        .map((p) => `"${p}"`)
        .join(",")}}' IS NOT NULL
    `);

    for (const row of rows.rows) {
      const pgRefId = referenceMap[row.appwrite_ref_id];
      if (pgRefId) {
        await this.pgClient.query(
          `UPDATE ${tableName} SET ${columnName} = $1 WHERE id = $2`,
          [pgRefId, row.id],
        );
      }
    }
  }

  async runMigration() {
    this.stats.startTime = new Date();
    logger.info("Starting Appwrite to PostgreSQL migration");

    try {
      // Migrate collections in order
      for (const collectionName of this.migrationOrder) {
        const count = await this.migrateCollection(collectionName);
        this.stats.migratedDocuments += count;
      }

      // Resolve foreign key relationships
      await this.resolveForeignKeys();

      this.stats.endTime = new Date();
      const duration = (this.stats.endTime - this.stats.startTime) / 1000;

      logger.info("🎉 Migration completed successfully!");
      logger.info("Migration Statistics:", {
        totalCollections: this.migrationOrder.length,
        totalDocuments: this.stats.migratedDocuments,
        duration: `${duration.toFixed(2)} seconds`,
        errors: this.stats.errors.length,
      });

      return this.stats;
    } catch (error) {
      this.stats.endTime = new Date();
      logger.error("Migration failed", error);
      this.stats.errors.push(error.message);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.pgClient) {
        await this.pgClient.end();
        logger.info("PostgreSQL connection closed");
      }
    } catch (error) {
      logger.warn("Error during cleanup", error);
    }
  }
}

// Main execution
async function main() {
  const migrationManager = new MigrationManager(
    config.appwrite,
    config.postgres,
  );

  try {
    await migrationManager.initialize();
    const stats = await migrationManager.runMigration();

    // Save migration report
    const report = {
      timestamp: new Date().toISOString(),
      config: {
        appwrite: { ...config.appwrite, apiKey: "***" },
        postgres: { ...config.postgres, password: "***" },
      },
      statistics: stats,
    };

    const reportPath = path.join(__dirname, "migration_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logger.info(`Migration report saved to ${reportPath}`);
  } catch (error) {
    logger.error("Migration failed", error);
    process.exit(1);
  } finally {
    await migrationManager.cleanup();
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Appwrite to PostgreSQL Migration Script

Usage:
  node migrate.js [options]

Options:
  --help, -h          Show this help message
  --config <path>     Load configuration from JSON file
  --env <path>        Load environment variables from .env file
  --dry-run           Test migration without writing to database
  --resume            Resume interrupted migration
  --collections <list> Migrate only specific collections (comma-separated)

Environment Variables:
  APPWRITE_ENDPOINT    Appwrite API endpoint
  APPWRITE_PROJECT_ID  Appwrite project ID
  APPWRITE_API_KEY     Appwrite API key
  APPWRITE_DATABASE_ID Appwrite database ID
  PG_HOST              PostgreSQL host
  PG_PORT              PostgreSQL port
  PG_DATABASE          PostgreSQL database name
  PG_USER              PostgreSQL username
  PG_PASSWORD          PostgreSQL password
    `);
    process.exit(0);
  }

  // Load .env file if specified
  if (args.includes("--env")) {
    const envIndex = args.indexOf("--env");
    const envPath = args[envIndex + 1];
    dotenv.config({ path: envPath, override: true });
  }

  // Rebuild config after env loading/overrides.
  config = buildConfig();

  // Load config file if specified
  if (args.includes("--config")) {
    const configIndex = args.indexOf("--config");
    const configPath = args[configIndex + 1];
    const customConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    Object.assign(config, customConfig);
  }

  // Optional verbose mode for easier debugging.
  if (args.includes("--verbose")) {
    config.migration.logLevel = "debug";
  }
  logger.currentLevel = logger.levels[config.migration.logLevel];

  // Run migration
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { MigrationManager, config };
