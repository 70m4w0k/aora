# ✅ Corrected Database Schema

**Date:** 2024-12-08  
**Version:** 2.0  
**Status:** Ready for Implementation

This document contains the corrected database schema following Appwrite best practices.

---

## 📋 Schema Changes Summary

### Key Corrections Applied

1. ✅ **All relationships converted from String IDs to Relationship attributes**
2. ✅ **Collection names standardized to snake_case**
3. ✅ **Missing `createdBy` and `createdAt` fields added**
4. ✅ **Composite indexes added for common query patterns**
5. ✅ **Date field naming standardized**
6. ✅ **String sizes standardized**

---

## 🗂️ Collections

### 1. `users`

**Collection ID:** `users` (or generate unique ID)

**Attributes:**
- `accountId` (String, 255, required) - Appwrite Account ID
- `email` (String, 255, required)
- `username` (String, 100, required)
- `avatar` (String, 500, optional) - Avatar URL
- `color` (String, 20, optional) - User color (hex)
- `householdId` (Relationship → `households`, optional) - Current household
- `role` (String, 50, optional) - Role in household: "admin", "member"

**Indexes:**
- `accountId` (ASCENDING, Unique)
- `email` (ASCENDING, Unique)
- `householdId` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (own profile)
- Delete: `role:users` (own profile)

---

### 2. `households`

**Collection ID:** `households` (or generate unique ID)

**Attributes:**
- `name` (String, 255, required)
- `inviteCode` (String, 50, required, unique)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `inviteCode` (ASCENDING, Unique)
- `createdBy` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (household admin)
- Delete: `role:users` (household admin)

---

### 3. `tasks`

**Collection ID:** `tasks` (or generate unique ID)

**Attributes:**
- `name` (String, 255, required)
- `description` (String, 1000, optional)
- `dueDate` (String, 255, optional) - ISO 8601
- `priority` (String, 20, optional) - "low", "medium", "high"
- `status` (String, 20, required, default: "pending") - "pending", "in_progress", "completed"
- `householdId` (Relationship → `households`, required)
- `assignedTo` (Relationship → `users`, optional)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `assignedTo` (ASCENDING)
- `status` (ASCENDING)
- `householdId + status` (Composite, ASCENDING)
- `householdId + dueDate` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 4. `tasks_done`

**Collection ID:** `tasks_done` (or generate unique ID)

**Attributes:**
- `taskId` (Relationship → `tasks`, required)
- `userId` (Relationship → `users`, required)
- `householdId` (Relationship → `households`, required)
- `completedAt` (String, 255, required) - ISO 8601
- `notes` (String, 500, optional)

**Indexes:**
- `taskId` (ASCENDING)
- `userId` (ASCENDING)
- `householdId` (ASCENDING)
- `completedAt` (DESCENDING)
- `taskId + completedAt` (Composite, DESCENDING)
- `userId + completedAt` (Composite, DESCENDING)
- `householdId + completedAt` (Composite, DESCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (own completions)
- Delete: `role:users` (own completions)

---

### 5. `shopping_items`

**Collection ID:** `shopping_items` (or generate unique ID)

**Attributes:**
- `name` (String, 255, required)
- `quantity` (Integer, optional, default: 1)
- `unit` (String, 50, optional) - "kg", "g", "L", "mL", "piece"
- `category` (String, 50, optional)
- `notes` (String, 500, optional)
- `isCompleted` (Boolean, required, default: false)
- `householdId` (Relationship → `households`, required)
- `addedBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601
- `completedAt` (String, 255, optional) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `isCompleted` (ASCENDING)
- `householdId + isCompleted` (Composite, ASCENDING)
- `addedBy` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 6. `expenses`

**Collection ID:** `expenses` (or generate unique ID)

**Attributes:**
- `description` (String, 500, required)
- `amount` (Double, required)
- `category` (String, 50, optional)
- `expenseDate` (String, 255, required) - ISO 8601
- `paidBy` (Relationship → `users`, required)
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `paidBy` (ASCENDING)
- `expenseDate` (DESCENDING)
- `householdId + expenseDate` (Composite, DESCENDING)
- `paidBy + expenseDate` (Composite, DESCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 7. `expense_settlements`

**Collection ID:** `expense_settlements` (or generate unique ID)

**Attributes:**
- `expenseId` (Relationship → `expenses`, required)
- `fromUser` (Relationship → `users`, required)
- `toUser` (Relationship → `users`, required)
- `amount` (Double, required)
- `isSettled` (Boolean, required, default: false)
- `settledAt` (String, 255, optional) - ISO 8601
- `householdId` (Relationship → `households`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `expenseId` (ASCENDING)
- `fromUser` (ASCENDING)
- `toUser` (ASCENDING)
- `householdId` (ASCENDING)
- `isSettled` (ASCENDING)
- `householdId + isSettled` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 8. `documents`

**Collection ID:** `documents` (or generate unique ID)

**Attributes:**
- `name` (String, 255, required)
- `category` (String, 50, required) - "bills", "insurance", "contracts", "receipts", "other"
- `description` (String, 1000, optional)
- `amount` (Double, optional)
- `documentDate` (String, 255, required) - ISO 8601 (date of document, not upload)
- `fileId` (String, 255, optional) - Storage file ID
- `fileUrl` (String, 500, optional) - File URL
- `fileName` (String, 255, optional)
- `householdId` (Relationship → `households`, required)
- `uploadedBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `category` (ASCENDING)
- `documentDate` (DESCENDING)
- `householdId + documentDate` (Composite, DESCENDING)
- `householdId + category` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (own documents)
- Delete: `role:users` (own documents)

---

### 9. `products`

**Collection ID:** `products` (or generate unique ID)

**Attributes:**
- `barcode` (String, 255, optional)
- `name` (String, 255, required)
- `brand` (String, 255, optional)
- `category` (String, 50, required) - "groceries", "dairy", "meat", "produce", "frozen", "beverages", "snacks", "household", "personal_care", "other"
- `unit` (String, 10, required, default: "g")
- `weight` (Integer, optional) - Weight in grams or mL
- `imageUrl` (String, 500, optional)
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `barcode` (ASCENDING) - Note: Unique per household (enforced in app logic)
- `name` (ASCENDING)
- `householdId + category` (Composite, ASCENDING)
- `householdId + barcode` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 10. `stores`

**Collection ID:** `stores` (or generate unique ID)

**Attributes:**
- `name` (String, 255, required)
- `address` (String, 500, optional)
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `name` (ASCENDING)
- `householdId + name` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 11. `price_history`

**Collection ID:** `price_history` (or generate unique ID)

**Attributes:**
- `productId` (Relationship → `products`, required)
- `storeId` (Relationship → `stores`, required)
- `price` (Double, required)
- `quantity` (Double, required, default: 1)
- `weight` (Integer, optional) - Weight in grams
- `pricePerUnit` (Double, required) - Calculated: price / quantity
- `pricePerKg` (Double, optional) - Calculated: (price / weight) * 1000
- `recordedAt` (String, 255, required) - ISO 8601 (when price was recorded)
- `notes` (String, 500, optional)
- `recordedBy` (Relationship → `users`, required)
- `householdId` (Relationship → `households`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `productId` (ASCENDING)
- `storeId` (ASCENDING)
- `householdId` (ASCENDING)
- `recordedAt` (DESCENDING)
- `pricePerUnit` (ASCENDING)
- `productId + recordedAt` (Composite, DESCENDING)
- `storeId + recordedAt` (Composite, DESCENDING)
- `householdId + recordedAt` (Composite, DESCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 12. `events`

**Collection ID:** `events` (or generate unique ID)

**Attributes:**
- `title` (String, 255, required)
- `description` (String, 2000, optional)
- `startDate` (String, 255, required) - ISO 8601
- `endDate` (String, 255, required) - ISO 8601
- `allDay` (Boolean, required, default: false)
- `category` (String, 50, required, default: "other") - "chore", "meeting", "social", "work", "personal", "reminder", "other"
- `color` (String, 20, optional) - Hex color code
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `assignedTo` (Relationship → `users`, optional)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)
- `startDate` (ASCENDING)
- `endDate` (ASCENDING)
- `category` (ASCENDING)
- `householdId + startDate` (Composite, ASCENDING)
- `householdId + endDate` (Composite, ASCENDING)
- `assignedTo` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users`
- Delete: `role:users`

---

### 13. `habits_arcs`

**Collection ID:** `habits_arcs` (or generate unique ID)

**Attributes:**
- `name` (String, 100, required)
- `color` (String, 20, required, default: "#8B5CF6")
- `icon` (String, 100, optional)
- `description` (String, 500, optional)
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `householdId` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (creator or household admin)
- Delete: `role:users` (creator or household admin)

---

### 14. `habits_quests`

**Collection ID:** `habits_quests` (or generate unique ID)

**Attributes:**
- `name` (String, 200, required)
- `arcId` (Relationship → `habits_arcs`, required)
- `frequency` (String, 20, required, default: "daily") - "daily", "weekly", "monthly", "annual", "unique"
- `repetitionPerPeriod` (Integer, required, default: 1)
- `intensity` (Integer, required, default: 1) - 1-5 scale
- `xpPerCompletion` (Integer, required, default: 10)
- `accessLevel` (Integer, optional, default: 1)
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `arcId` (ASCENDING)
- `householdId` (ASCENDING)
- `householdId + frequency` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (creator or household admin)
- Delete: `role:users` (creator or household admin)

---

### 15. `habits_quests_completions`

**Collection ID:** `habits_quests_completions` (or generate unique ID)

**Attributes:**
- `questId` (Relationship → `habits_quests`, required)
- `userId` (Relationship → `users`, required)
- `completedAt` (String, 255, required) - ISO 8601
- `streakCount` (Integer, required, default: 1)
- `xpEarned` (Integer, required)
- `householdId` (Relationship → `households`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `questId` (ASCENDING)
- `userId` (ASCENDING)
- `householdId` (ASCENDING)
- `completedAt` (DESCENDING)
- `questId + completedAt` (Composite, DESCENDING)
- `userId + completedAt` (Composite, DESCENDING)
- `householdId + completedAt` (Composite, DESCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (own completions)
- Delete: `role:users` (own completions or household admin)

---

### 16. `habits_tiers`

**Collection ID:** `habits_tiers` (or generate unique ID)

**Attributes:**
- `name` (String, 200, required)
- `arcId` (Relationship → `habits_arcs`, required)
- `targetValue` (Integer, required)
- `targetType` (String, 50, required, default: "count") - "days", "count", "amount", etc.
- `xpReward` (Integer, required, default: 100)
- `titleReward` (String, 100, optional)
- `householdId` (Relationship → `households`, required)
- `createdBy` (Relationship → `users`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `arcId` (ASCENDING)
- `householdId` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (creator or household admin)
- Delete: `role:users` (creator or household admin)

---

### 17. `habits_tiers_completions`

**Collection ID:** `habits_tiers_completions` (or generate unique ID)

**Attributes:**
- `tierId` (Relationship → `habits_tiers`, required)
- `userId` (Relationship → `users`, required)
- `completedAt` (String, 255, required) - ISO 8601
- `xpEarned` (Integer, required)
- `householdId` (Relationship → `households`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `tierId` (ASCENDING)
- `userId` (ASCENDING)
- `completedAt` (DESCENDING)
- `tierId + completedAt` (Composite, DESCENDING)
- `userId + completedAt` (Composite, DESCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (own completions)
- Delete: `role:users` (own completions or household admin)

---

### 18. `habits_user_progress`

**Collection ID:** `habits_user_progress` (or generate unique ID)

**Attributes:**
- `userId` (Relationship → `users`, required, One-to-One)
- `householdId` (Relationship → `households`, required)
- `totalXP` (Integer, required, default: 0)
- `globalLevel` (Integer, required, default: 1)
- `progressionType` (String, 20, required, default: "progressive") - "linear", "progressive"
- `penaltySystemActive` (Boolean, required, default: true)
- `gameDurationYears` (Integer, required, default: 1)
- `classId` (String, 50, optional)
- `unlockedTitles` (String Array, optional)
- `unlockedAchievements` (String Array, optional)
- `totalPenalties` (Integer, optional, default: 0)
- `totalPenaltyXP` (Integer, optional, default: 0)
- `arcProgress` (String, 5000, optional) - JSON string
- `createdAt` (String, 255, required) - ISO 8601
- `updatedAt` (String, 255, required) - ISO 8601

**Indexes:**
- `userId` (ASCENDING, Unique)
- `householdId` (ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (own progress)
- Delete: `role:users` (own progress)

---

### 19. `habits_xp_history`

**Collection ID:** `habits_xp_history` (or generate unique ID)

**Attributes:**
- `userId` (Relationship → `users`, required)
- `householdId` (Relationship → `households`, required)
- `xpAmount` (Integer, required)
- `sourceType` (String, 20, required) - "quest", "tier"
- `sourceId` (String, 100, required) - ID of quest or tier
- `arcId` (Relationship → `habits_arcs`, optional)
- `questName` (String, 200, optional) - For display
- `tierName` (String, 200, optional) - For display
- `arcName` (String, 100, optional) - For display
- `penaltyXP` (Integer, optional, default: 0)
- `recordedAt` (String, 255, required) - ISO 8601
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `userId` (ASCENDING)
- `householdId` (ASCENDING)
- `arcId` (ASCENDING)
- `recordedAt` (DESCENDING)
- `userId + recordedAt` (Composite, DESCENDING)
- `householdId + recordedAt` (Composite, DESCENDING)
- `sourceType + sourceId` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users`
- Create: `role:users`
- Update: `role:users` (system only)
- Delete: `role:users` (system only)

---

## 📊 Migration Notes

### Collection Name Changes
- `tasksDone` → `tasks_done`
- `shoppingItems` → `shopping_items`
- `expenseSettlements` → `expense_settlements`
- `priceHistory` → `price_history`

### Field Name Changes
- `date` → `documentDate` (documents)
- `date` → `recordedAt` (price_history, habits_xp_history)
- `date` → `expenseDate` (expenses)
- `createdBy` → `uploadedBy` (documents)
- `createdBy` → `recordedBy` (price_history)
- `createdBy` → `addedBy` (shopping_items)

### New Fields Added
- `createdBy` added to: tasks, shopping_items, expenses, documents, products, stores, events, habits collections
- `createdAt` added to: all collections
- `updatedAt` added to: habits_user_progress

---

## ✅ Implementation Checklist

- [ ] Create all collections in Appwrite Console
- [ ] Add all attributes (in order specified)
- [ ] Create all indexes
- [ ] Set all permissions
- [ ] Update `lib/appwrite.js` with new collection IDs
- [ ] Update code to use Relationship references instead of String IDs
- [ ] Update code to use new field names
- [ ] Test all CRUD operations
- [ ] Verify relationships work correctly
- [ ] Update documentation

---

**Schema Version:** 2.0  
**Last Updated:** 2024-12-08  
**Status:** Ready for Implementation

