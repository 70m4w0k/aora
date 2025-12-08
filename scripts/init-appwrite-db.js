#!/usr/bin/env node

/**
 * Appwrite Database Initialization Script
 * 
 * This script creates all collections, attributes, indexes, and permissions
 * for the Tipi/Aora application in your self-hosted Appwrite instance.
 * 
 * Usage:
 *   node scripts/init-appwrite-db.js
 * 
 * Prerequisites:
 *   - Node.js installed
 *   - npm install node-appwrite
 *   - Appwrite instance running
 *   - API key with Databases scope
 */

// Load environment variables from .env file
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not installed, that's okay - will use environment variables or prompts
}

// Load environment variables from .env file
try {
  require('dotenv').config();
  console.log('📄 Loaded .env file');
} catch (error) {
  // dotenv not installed, continue without it
  console.log('⚠️  dotenv not found, skipping .env file (using environment variables or prompts)');
}

const { Client, Databases, ID, RelationshipType } = require('node-appwrite');
const readline = require('readline');

// Configuration - Read from environment variables or use defaults
const CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'http://192.168.1.46/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: process.env.APPWRITE_DATABASE_ID || '',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Client and databases will be initialized after config is loaded
let client;
let databases;

// Collection schemas from DB_SCHEMA_CORRECTED.md
// IMPORTANT: Collections are ordered to respect dependencies
// Base collections (no dependencies) come first
const collections = [
  // Base collections (no relationship dependencies)
  {
    id: 'households',
    name: 'Households',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'inviteCode', type: 'string', size: 50, required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_inviteCode', attributes: ['inviteCode'], type: 'key', orders: ['ASC'], unique: true },
      { key: 'idx_createdBy', attributes: ['createdBy'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'accountId', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'username', type: 'string', size: 100, required: true },
      { key: 'avatar', type: 'string', size: 500, required: false },
      { key: 'color', type: 'string', size: 20, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: false },
      { key: 'role', type: 'string', size: 50, required: false },
    ],
    indexes: [
      { key: 'idx_accountId', attributes: ['accountId'], type: 'key', orders: ['ASC'], unique: true },
      { key: 'idx_email', attributes: ['email'], type: 'key', orders: ['ASC'], unique: true },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'tasks',
    name: 'Tasks',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'dueDate', type: 'string', size: 255, required: false },
      { key: 'priority', type: 'string', size: 20, required: false },
      { key: 'status', type: 'string', size: 20, required: false, defaultValue: 'pending' },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'assignedTo', type: 'relationship', relatedCollection: 'users', required: false },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_assignedTo', attributes: ['assignedTo'], type: 'key', orders: ['ASC'] },
      { key: 'idx_status', attributes: ['status'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_status', attributes: ['householdId', 'status'], type: 'key', orders: ['ASC', 'ASC'] },
      { key: 'idx_household_dueDate', attributes: ['householdId', 'dueDate'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'tasks_done',
    name: 'Tasks Done',
    attributes: [
      { key: 'taskId', type: 'relationship', relatedCollection: 'tasks', required: true },
      { key: 'userId', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'completedAt', type: 'string', size: 255, required: true },
      { key: 'notes', type: 'string', size: 500, required: false },
    ],
    indexes: [
      { key: 'idx_taskId', attributes: ['taskId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_userId', attributes: ['userId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_completedAt', attributes: ['completedAt'], type: 'key', orders: ['DESC'] },
      { key: 'idx_task_completed', attributes: ['taskId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_user_completed', attributes: ['userId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_household_completed', attributes: ['householdId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'shopping_items',
    name: 'Shopping Items',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'quantity', type: 'integer', required: false, defaultValue: 1 },
      { key: 'unit', type: 'string', size: 50, required: false },
      { key: 'category', type: 'string', size: 50, required: false },
      { key: 'notes', type: 'string', size: 500, required: false },
      { key: 'isCompleted', type: 'boolean', required: false, defaultValue: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'addedBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'completedAt', type: 'string', size: 255, required: false },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_isCompleted', attributes: ['isCompleted'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_completed', attributes: ['householdId', 'isCompleted'], type: 'key', orders: ['ASC', 'ASC'] },
      { key: 'idx_addedBy', attributes: ['addedBy'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'expenses',
    name: 'Expenses',
    attributes: [
      { key: 'description', type: 'string', size: 500, required: true },
      { key: 'amount', type: 'double', required: true },
      { key: 'category', type: 'string', size: 50, required: false },
      { key: 'expenseDate', type: 'string', size: 255, required: true },
      { key: 'paidBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_paidBy', attributes: ['paidBy'], type: 'key', orders: ['ASC'] },
      { key: 'idx_expenseDate', attributes: ['expenseDate'], type: 'key', orders: ['DESC'] },
      { key: 'idx_household_date', attributes: ['householdId', 'expenseDate'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_paidBy_date', attributes: ['paidBy', 'expenseDate'], type: 'key', orders: ['ASC', 'DESC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'expense_settlements',
    name: 'Expense Settlements',
    attributes: [
      { key: 'expenseId', type: 'relationship', relatedCollection: 'expenses', required: true },
      { key: 'fromUser', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'toUser', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'amount', type: 'double', required: true },
      { key: 'isSettled', type: 'boolean', required: false, defaultValue: false },
      { key: 'settledAt', type: 'string', size: 255, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_expenseId', attributes: ['expenseId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_fromUser', attributes: ['fromUser'], type: 'key', orders: ['ASC'] },
      { key: 'idx_toUser', attributes: ['toUser'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_isSettled', attributes: ['isSettled'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_settled', attributes: ['householdId', 'isSettled'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'documents',
    name: 'Documents',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'category', type: 'string', size: 50, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'amount', type: 'double', required: false },
      { key: 'documentDate', type: 'string', size: 255, required: true },
      { key: 'fileId', type: 'string', size: 255, required: false },
      { key: 'fileUrl', type: 'string', size: 500, required: false },
      { key: 'fileName', type: 'string', size: 255, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'uploadedBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_category', attributes: ['category'], type: 'key', orders: ['ASC'] },
      { key: 'idx_documentDate', attributes: ['documentDate'], type: 'key', orders: ['DESC'] },
      { key: 'idx_household_date', attributes: ['householdId', 'documentDate'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_household_category', attributes: ['householdId', 'category'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'products',
    name: 'Products',
    attributes: [
      { key: 'barcode', type: 'string', size: 255, required: false },
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'brand', type: 'string', size: 255, required: false },
      { key: 'category', type: 'string', size: 50, required: true },
      { key: 'unit', type: 'string', size: 10, required: false, defaultValue: 'g' },
      { key: 'weight', type: 'integer', required: false },
      { key: 'imageUrl', type: 'string', size: 500, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_barcode', attributes: ['barcode'], type: 'key', orders: ['ASC'] },
      { key: 'idx_name', attributes: ['name'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_category', attributes: ['householdId', 'category'], type: 'key', orders: ['ASC', 'ASC'] },
      { key: 'idx_household_barcode', attributes: ['householdId', 'barcode'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'stores',
    name: 'Stores',
    attributes: [
      { key: 'name', type: 'string', size: 255, required: true },
      { key: 'address', type: 'string', size: 500, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_name', attributes: ['name'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_name', attributes: ['householdId', 'name'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'price_history',
    name: 'Price History',
    attributes: [
      { key: 'productId', type: 'relationship', relatedCollection: 'products', required: true },
      { key: 'storeId', type: 'relationship', relatedCollection: 'stores', required: true },
      { key: 'price', type: 'double', required: true },
      { key: 'quantity', type: 'double', required: false, defaultValue: 1 },
      { key: 'weight', type: 'integer', required: false },
      { key: 'pricePerUnit', type: 'double', required: true },
      { key: 'pricePerKg', type: 'double', required: false },
      { key: 'recordedAt', type: 'string', size: 255, required: true },
      { key: 'notes', type: 'string', size: 500, required: false },
      { key: 'recordedBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_productId', attributes: ['productId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_storeId', attributes: ['storeId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_recordedAt', attributes: ['recordedAt'], type: 'key', orders: ['DESC'] },
      { key: 'idx_pricePerUnit', attributes: ['pricePerUnit'], type: 'key', orders: ['ASC'] },
      { key: 'idx_product_date', attributes: ['productId', 'recordedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_store_date', attributes: ['storeId', 'recordedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_household_date', attributes: ['householdId', 'recordedAt'], type: 'key', orders: ['ASC', 'DESC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'events',
    name: 'Events',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'startDate', type: 'string', size: 255, required: true },
      { key: 'endDate', type: 'string', size: 255, required: true },
      { key: 'allDay', type: 'boolean', required: false, defaultValue: false },
      { key: 'category', type: 'string', size: 50, required: false, defaultValue: 'other' },
      { key: 'color', type: 'string', size: 20, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'assignedTo', type: 'relationship', relatedCollection: 'users', required: false },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_startDate', attributes: ['startDate'], type: 'key', orders: ['ASC'] },
      { key: 'idx_endDate', attributes: ['endDate'], type: 'key', orders: ['ASC'] },
      { key: 'idx_category', attributes: ['category'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_start', attributes: ['householdId', 'startDate'], type: 'key', orders: ['ASC', 'ASC'] },
      { key: 'idx_household_end', attributes: ['householdId', 'endDate'], type: 'key', orders: ['ASC', 'ASC'] },
      { key: 'idx_assignedTo', attributes: ['assignedTo'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  // Habits collections
  {
    id: 'habits_arcs',
    name: 'Habits Arcs',
    attributes: [
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'color', type: 'string', size: 20, required: false, defaultValue: '#8B5CF6' },
      { key: 'icon', type: 'string', size: 100, required: false },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'habits_quests',
    name: 'Habits Quests',
    attributes: [
      { key: 'name', type: 'string', size: 200, required: true },
      { key: 'arcId', type: 'relationship', relatedCollection: 'habits_arcs', required: true },
      { key: 'frequency', type: 'string', size: 20, required: false, defaultValue: 'daily' },
      { key: 'repetitionPerPeriod', type: 'integer', required: false, defaultValue: 1 },
      { key: 'intensity', type: 'integer', required: false, defaultValue: 1 },
      { key: 'xpPerCompletion', type: 'integer', required: false, defaultValue: 10 },
      { key: 'accessLevel', type: 'integer', required: false, defaultValue: 1 },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_arcId', attributes: ['arcId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_household_frequency', attributes: ['householdId', 'frequency'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'habits_quests_completions',
    name: 'Habits Quest Completions',
    attributes: [
      { key: 'questId', type: 'relationship', relatedCollection: 'habits_quests', required: true },
      { key: 'userId', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'completedAt', type: 'string', size: 255, required: true },
      { key: 'streakCount', type: 'integer', required: false, defaultValue: 1 },
      { key: 'xpEarned', type: 'integer', required: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_questId', attributes: ['questId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_userId', attributes: ['userId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_completedAt', attributes: ['completedAt'], type: 'key', orders: ['DESC'] },
      { key: 'idx_quest_completed', attributes: ['questId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_user_completed', attributes: ['userId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_household_completed', attributes: ['householdId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'habits_tiers',
    name: 'Habits Tiers',
    attributes: [
      { key: 'name', type: 'string', size: 200, required: true },
      { key: 'arcId', type: 'relationship', relatedCollection: 'habits_arcs', required: true },
      { key: 'targetValue', type: 'integer', required: true },
      { key: 'targetType', type: 'string', size: 50, required: false, defaultValue: 'count' },
      { key: 'xpReward', type: 'integer', required: false, defaultValue: 100 },
      { key: 'titleReward', type: 'string', size: 100, required: false },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdBy', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_arcId', attributes: ['arcId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'habits_tiers_completions',
    name: 'Habits Tier Completions',
    attributes: [
      { key: 'tierId', type: 'relationship', relatedCollection: 'habits_tiers', required: true },
      { key: 'userId', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'completedAt', type: 'string', size: 255, required: true },
      { key: 'xpEarned', type: 'integer', required: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_tierId', attributes: ['tierId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_userId', attributes: ['userId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_completedAt', attributes: ['completedAt'], type: 'key', orders: ['DESC'] },
      { key: 'idx_tier_completed', attributes: ['tierId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_user_completed', attributes: ['userId', 'completedAt'], type: 'key', orders: ['ASC', 'DESC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'habits_user_progress',
    name: 'Habits User Progress',
    attributes: [
      { key: 'userId', type: 'relationship', relatedCollection: 'users', required: true, oneToOne: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'totalXP', type: 'integer', required: false, defaultValue: 0 },
      { key: 'globalLevel', type: 'integer', required: false, defaultValue: 1 },
      { key: 'progressionType', type: 'string', size: 20, required: false, defaultValue: 'progressive' },
      { key: 'penaltySystemActive', type: 'boolean', required: false, defaultValue: true },
      { key: 'gameDurationYears', type: 'integer', required: false, defaultValue: 1 },
      { key: 'classId', type: 'string', size: 50, required: false },
      { key: 'unlockedTitles', type: 'string', size: 50, array: true, required: false },
      { key: 'unlockedAchievements', type: 'string', size: 50, array: true, required: false },
      { key: 'totalPenalties', type: 'integer', required: false, defaultValue: 0 },
      { key: 'totalPenaltyXP', type: 'integer', required: false, defaultValue: 0 },
      { key: 'arcProgress', type: 'string', size: 5000, required: false },
      { key: 'createdAt', type: 'string', size: 255, required: true },
      { key: 'updatedAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_userId', attributes: ['userId'], type: 'key', orders: ['ASC'], unique: true },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
  {
    id: 'habits_xp_history',
    name: 'Habits XP History',
    attributes: [
      { key: 'userId', type: 'relationship', relatedCollection: 'users', required: true },
      { key: 'householdId', type: 'relationship', relatedCollection: 'households', required: true },
      { key: 'xpAmount', type: 'integer', required: true },
      { key: 'sourceType', type: 'string', size: 20, required: true },
      { key: 'sourceId', type: 'string', size: 100, required: true },
      { key: 'arcId', type: 'relationship', relatedCollection: 'habits_arcs', required: false },
      { key: 'questName', type: 'string', size: 200, required: false },
      { key: 'tierName', type: 'string', size: 200, required: false },
      { key: 'arcName', type: 'string', size: 100, required: false },
      { key: 'penaltyXP', type: 'integer', required: false, defaultValue: 0 },
      { key: 'recordedAt', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'string', size: 255, required: true },
    ],
    indexes: [
      { key: 'idx_userId', attributes: ['userId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_householdId', attributes: ['householdId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_arcId', attributes: ['arcId'], type: 'key', orders: ['ASC'] },
      { key: 'idx_recordedAt', attributes: ['recordedAt'], type: 'key', orders: ['DESC'] },
      { key: 'idx_user_date', attributes: ['userId', 'recordedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_household_date', attributes: ['householdId', 'recordedAt'], type: 'key', orders: ['ASC', 'DESC'] },
      { key: 'idx_source', attributes: ['sourceType', 'sourceId'], type: 'key', orders: ['ASC', 'ASC'] },
    ],
    permissions: {
      read: ['role:users'],
      create: ['role:users'],
      update: ['role:users'],
      delete: ['role:users'],
    }
  },
];

// Helper functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAttribute(databaseId, collectionId, attr) {
  try {
    if (attr.type === 'relationship') {
      // Determine relationship type
      // Most relationships are many-to-one (many documents reference one)
      // For one-to-one relationships, use oneToOne
      let relationType = RelationshipType.ManyToOne; // Default: many-to-one
      
      // Check if this is a one-to-one relationship
      // (e.g., habits_user_progress.userId should be oneToOne)
      if (attr.oneToOne === true) {
        relationType = RelationshipType.OneToOne;
      }
      
      // Create relationship attribute
      // Parameters: databaseId, collectionId, relatedCollectionId, type, twoWay, key, twoWayKey, onDelete
      await databases.createRelationshipAttribute(
        databaseId,
        collectionId,
        attr.relatedCollection,
        relationType,
        false, // twoWay (usually false)
        attr.key, // key (attribute name)
        undefined, // twoWayKey (not needed for one-way)
        undefined // onDelete (use default cascade)
      );
    } else if (attr.type === 'string' && attr.array) {
      // String array attribute
      // Appwrite does NOT allow default values for array attributes
      // So we don't pass the default parameter
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.size,
        attr.required,
        undefined, // No default for arrays (Appwrite doesn't allow it)
        true // array = true
      );
    } else if (attr.type === 'string') {
      // Regular string attribute - only include default if it's a valid non-empty string
      const hasValidDefault = attr.defaultValue !== undefined && 
                             attr.defaultValue !== null && 
                             typeof attr.defaultValue === 'string' && 
                             attr.defaultValue.trim().length > 0;
      
      if (hasValidDefault) {
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.defaultValue
        );
      } else {
        // No default - don't pass the default parameter at all
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.size,
          attr.required
        );
      }
    } else if (attr.type === 'integer') {
      // Integer attribute - min, max, default are all optional
      if (attr.defaultValue !== undefined && attr.defaultValue !== null) {
        await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.defaultValue
        );
      } else if (attr.min !== undefined || attr.max !== undefined) {
        await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max
        );
      } else {
        await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required
        );
      }
    } else if (attr.type === 'double') {
      // Float attribute - min, max, default are all optional
      if (attr.defaultValue !== undefined && attr.defaultValue !== null) {
        await databases.createFloatAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.defaultValue
        );
      } else if (attr.min !== undefined || attr.max !== undefined) {
        await databases.createFloatAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max
        );
      } else {
        await databases.createFloatAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required
        );
      }
    } else if (attr.type === 'boolean') {
      // Boolean attribute - default is optional
      if (attr.defaultValue !== undefined && attr.defaultValue !== null && typeof attr.defaultValue === 'boolean') {
        await databases.createBooleanAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.defaultValue
        );
      } else {
        await databases.createBooleanAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required
        );
      }
    }
    
    console.log(`  ✅ Created attribute: ${attr.key}`);
    // Wait for attribute to be ready
    await sleep(500);
  } catch (error) {
    if (error.code === 409 || error.message.includes('already exists')) {
      console.log(`  ⚠️  Attribute ${attr.key} already exists, skipping...`);
    } else {
      console.error(`  ❌ Error creating attribute ${attr.key} (type: ${attr.type}):`, error.message);
      console.error(`     Attribute config:`, JSON.stringify(attr, null, 2));
      throw error;
    }
  }
}

async function createIndex(databaseId, collectionId, index) {
  try {
    await databases.createIndex(
      databaseId,
      collectionId,
      index.key,
      index.type,
      index.attributes,
      index.orders
    );
    console.log(`  ✅ Created index: ${index.key}`);
    await sleep(500); // Increased delay for index creation
  } catch (error) {
    if (error.code === 409 || error.message.includes('already exists')) {
      console.log(`  ⚠️  Index ${index.key} already exists, skipping...`);
    } else {
      console.error(`  ❌ Error creating index ${index.key}:`, error.message);
      // Don't throw - continue with other indexes
    }
  }
}

async function createCollection(collection, existingCollections = []) {
  try {
    console.log(`\n📦 Creating collection: ${collection.name} (${collection.id})...`);
    
    // Create collection
    try {
      await databases.createCollection(
        CONFIG.databaseId,
        collection.id,
        collection.name,
        [],
        false
      );
      console.log(`  ✅ Collection created`);
      await sleep(500);
    } catch (error) {
      if (error.code === 409) {
        console.log(`  ⚠️  Collection ${collection.id} already exists, skipping creation...`);
      } else {
        throw error;
      }
    }
    
    // Track that this collection now exists
    existingCollections.push(collection.id);
    
    // Create attributes (split into two passes: non-relationships first, then relationships)
    console.log(`  📝 Creating attributes...`);
    
    // First pass: Create non-relationship attributes
    const nonRelationshipAttrs = collection.attributes.filter(attr => attr.type !== 'relationship');
    const relationshipAttrs = collection.attributes.filter(attr => attr.type === 'relationship');
    
    for (const attr of nonRelationshipAttrs) {
      await createAttribute(CONFIG.databaseId, collection.id, attr);
    }
    
    // Second pass: Create relationship attributes (only if related collection exists)
    if (relationshipAttrs.length > 0) {
      console.log(`  🔗 Creating relationship attributes...`);
      for (const attr of relationshipAttrs) {
        if (existingCollections.includes(attr.relatedCollection)) {
          await createAttribute(CONFIG.databaseId, collection.id, attr);
        } else {
          console.log(`  ⚠️  Skipping ${attr.key}: related collection '${attr.relatedCollection}' doesn't exist yet`);
          console.log(`     This relationship will need to be created manually or in a second run.`);
        }
      }
    }
    
    // Wait for all attributes to be ready
    console.log(`  ⏳ Waiting for attributes to be ready...`);
    await sleep(2000);
    
    // Create indexes
    console.log(`  🔍 Creating indexes...`);
    for (const index of collection.indexes) {
      await createIndex(CONFIG.databaseId, collection.id, index);
    }
    
    // Set permissions
    console.log(`  🔐 Setting permissions...`);
    try {
      await databases.updateCollection(
        CONFIG.databaseId,
        collection.id,
        collection.name,
        [],
        false,
        collection.permissions.read,
        collection.permissions.create,
        collection.permissions.update,
        collection.permissions.delete
      );
      console.log(`  ✅ Permissions set`);
    } catch (error) {
      console.log(`  ⚠️  Error setting permissions: ${error.message}`);
    }
    
    console.log(`✅ Collection ${collection.name} initialized successfully!\n`);
  } catch (error) {
    console.error(`❌ Error creating collection ${collection.name}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Appwrite Database Initialization Script\n');
  console.log('This script will create all collections, attributes, indexes, and permissions.\n');
  
  // Check environment variables
  console.log('📋 Checking environment variables...');
  const envVars = {
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
  };
  
  // Get configuration from env or prompt
  if (!CONFIG.projectId || CONFIG.projectId.trim() === '') {
    if (envVars.APPWRITE_PROJECT_ID) {
      CONFIG.projectId = envVars.APPWRITE_PROJECT_ID;
      console.log('   ✅ Found APPWRITE_PROJECT_ID in environment');
    } else {
      CONFIG.projectId = await question('Enter your Appwrite Project ID: ');
    }
  } else {
    console.log('   ✅ Using APPWRITE_PROJECT_ID from environment');
  }
  
  if (!CONFIG.apiKey || CONFIG.apiKey.trim() === '') {
    if (envVars.APPWRITE_API_KEY) {
      CONFIG.apiKey = envVars.APPWRITE_API_KEY;
      console.log('   ✅ Found APPWRITE_API_KEY in environment');
    } else {
      CONFIG.apiKey = await question('Enter your Appwrite API Key: ');
    }
  } else {
    console.log('   ✅ Using APPWRITE_API_KEY from environment');
  }
  
  if (!CONFIG.databaseId || CONFIG.databaseId.trim() === '') {
    if (envVars.APPWRITE_DATABASE_ID) {
      CONFIG.databaseId = envVars.APPWRITE_DATABASE_ID;
      console.log('   ✅ Found APPWRITE_DATABASE_ID in environment');
    } else {
      CONFIG.databaseId = await question('Enter your Database ID: ');
    }
  } else {
    console.log('   ✅ Using APPWRITE_DATABASE_ID from environment');
  }
  
  // Initialize client with config (after we have all values)
  client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);
  
  databases = new Databases(client);
  
  console.log(`\n📋 Configuration:`);
  console.log(`   Endpoint: ${CONFIG.endpoint}`);
  console.log(`   Project ID: ${CONFIG.projectId}`);
  console.log(`   Database ID: ${CONFIG.databaseId}`);
  console.log(`   API Key: ${CONFIG.apiKey.substring(0, 20)}... (hidden)\n`);
  
  const confirm = await question('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🎯 Starting database initialization...\n');
  
  try {
    // Track existing collections to handle relationship dependencies
    const existingCollections = [];
    
    // Create collections in order (respecting dependencies)
    for (const collection of collections) {
      await createCollection(collection, existingCollections);
    }
    
    // Second pass: Try to create any relationships that were skipped
    console.log(`\n🔄 Second pass: Creating skipped relationships...`);
    for (const collection of collections) {
      const relationshipAttrs = collection.attributes.filter(attr => 
        attr.type === 'relationship' && 
        existingCollections.includes(attr.relatedCollection)
      );
      
      for (const attr of relationshipAttrs) {
        try {
          // Check if attribute already exists
          const attributes = await databases.listAttributes(CONFIG.databaseId, collection.id);
          const exists = attributes.attributes.some(a => a.key === attr.key);
          
          if (!exists) {
            console.log(`  🔗 Creating relationship ${collection.id}.${attr.key}...`);
            await createAttribute(CONFIG.databaseId, collection.id, attr);
          }
        } catch (error) {
          if (error.code !== 409) {
            console.log(`  ⚠️  Could not create ${collection.id}.${attr.key}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Database initialization complete!');
    
    // Collect and display all collection IDs
    console.log('\n📋 Collection IDs (copy these to lib/appwrite.js):');
    console.log('─'.repeat(60));
    for (const collection of collections) {
      try {
        const collectionInfo = await databases.getCollection(CONFIG.databaseId, collection.id);
        console.log(`   ${collection.id.padEnd(30)} → ${collectionInfo.$id}`);
      } catch (error) {
        console.log(`   ${collection.id.padEnd(30)} → (error getting ID: ${error.message})`);
      }
    }
    console.log('─'.repeat(60));
    
    console.log('\n📝 Next steps:');
    console.log('   1. Copy the collection IDs above');
    console.log('   2. Update lib/appwrite.js with the new collection IDs');
    console.log('   3. Test your application\n');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

