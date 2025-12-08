# 📚 Appwrite Database Best Practices Guide

This document outlines best practices for designing and maintaining Appwrite databases, specifically for the Tipi/Aora application.

---

## 🎯 Core Principles

### 1. **Use Relationship Attributes, Not String IDs**

**✅ DO:**
```yaml
householdId:
  Type: Relationship (Many-to-One)
  Related Collection: households
  Required: Yes
```

**❌ DON'T:**
```yaml
householdId:
  Type: String
  Size: 255
  Required: Yes
```

**Why:**
- Relationships provide referential integrity
- Appwrite validates that referenced documents exist
- Enables efficient joins and queries
- Better error messages when relationships break
- Future-proof for Appwrite features

**Exception:** Only use String IDs when:
- Referencing external systems (not Appwrite collections)
- Storing IDs that may not exist yet (soft references)
- Performance-critical scenarios (rare)

---

### 2. **Consistent Naming Conventions**

**Collection Names:**
- Use **snake_case**: `habits_arcs`, `price_history`, `tasks_done`
- Be descriptive: `expense_settlements` not `settlements`
- Use plural for collections: `users`, `households`, `tasks`

**Attribute Names:**
- Use **camelCase**: `householdId`, `createdBy`, `startDate`
- Boolean attributes: prefix with `is`, `has`, `can`: `isActive`, `hasCompleted`
- Relationship attributes: suffix with `Id`: `householdId`, `userId`, `arcId`
- Date attributes: suffix with `Date` or `At`: `startDate`, `completedAt`, `createdAt`

**Index Names:**
- Descriptive: `idx_household_date`, `idx_user_completed`
- Include purpose: `idx_household_members_lookup`

---

### 3. **Proper Data Types**

**✅ Use Appropriate Types:**

| Data | Type | Example |
|------|------|---------|
| Text (short) | String (50-255) | `name`, `category` |
| Text (long) | String (1000+) | `description`, `notes` |
| Numbers (whole) | Integer | `xpAmount`, `streakCount` |
| Numbers (decimal) | Double | `price`, `amount` |
| True/False | Boolean | `isActive`, `allDay` |
| Dates | String (ISO 8601) | `startDate`, `completedAt` |
| Relationships | Relationship | `householdId`, `userId` |
| Arrays | String Array | `unlockedTitles[]` |
| JSON | String (JSON) | `arcProgress` (stored as JSON string) |

**❌ Common Mistakes:**
- Using String for dates instead of ISO 8601 format
- Using String for numbers (loses type safety)
- Using Integer for IDs (should be Relationship or String)
- Storing JSON as String without size limit

---

### 4. **Index Strategy**

**Always Index:**
- Foreign keys (relationship attributes): `householdId`, `userId`
- Frequently queried fields: `date`, `category`, `status`
- Composite indexes for common query patterns

**Index Patterns:**

```yaml
# Single field index (most common)
householdId: ASCENDING

# Composite index (for filtered queries)
householdId + date: DESCENDING

# Unique index (for one-to-one relationships)
userId: ASCENDING (Unique)
```

**Best Practices:**
- Index foreign keys first
- Create composite indexes for queries with multiple filters
- Use DESCENDING for date fields (newest first)
- Don't over-index (each index adds write overhead)

---

### 5. **Permissions Strategy**

**Standard Pattern:**

```yaml
Read:
  - role:users  # All authenticated users
  - Filter by householdId in queries

Create:
  - role:users  # All authenticated users
  - Validate household membership in app logic

Update:
  - role:users  # All authenticated users
  - Validate ownership in app logic

Delete:
  - role:users  # All authenticated users
  - Validate ownership in app logic
```

**Security Notes:**
- Appwrite permissions are collection-level, not document-level
- Always filter by `householdId` in queries
- Validate ownership in application code
- Use Appwrite's `$userId` variable when possible

---

### 6. **Relationship Patterns**

**One-to-Many (Most Common):**
```yaml
# Parent collection: households
# Child collection: tasks
tasks:
  householdId: Relationship → households (Many-to-One)
```

**Many-to-Many:**
```yaml
# Use junction collection
household_members:
  householdId: Relationship → households
  userId: Relationship → users
```

**One-to-One:**
```yaml
# Use unique index
habits_user_progress:
  userId: Relationship → users (One-to-One, Unique)
```

---

### 7. **Date Handling**

**Always Use ISO 8601 Format:**
```javascript
// ✅ Correct
"2024-01-15T10:00:00.000Z"

// ❌ Wrong
"2024-01-15"
"01/15/2024"
1642233600  // Unix timestamp
```

**Store as String:**
- Type: String
- Size: 255 (ISO 8601 strings are ~24 chars)
- Format: Always include timezone (Z or +00:00)

**Index Dates:**
- Use DESCENDING for "newest first" queries
- Create composite indexes with householdId + date

---

### 8. **Required vs Optional Fields**

**Always Required:**
- Primary relationships: `householdId`, `userId` (if applicable)
- Core identifiers: `name`, `title`
- Timestamps: `createdAt`, `updatedAt` (auto-managed by Appwrite)

**Optional When:**
- Field may not exist for all records
- Field is computed/derived
- Field is added later (backward compatibility)

**Default Values:**
- Set defaults for frequently used fields
- Use defaults for enums: `category: "other"`, `status: "pending"`

---

### 9. **String Size Limits**

**Guidelines:**

| Purpose | Size | Example |
|---------|------|---------|
| IDs, Codes | 50-100 | `barcode`, `inviteCode` |
| Names, Titles | 100-255 | `name`, `title`, `username` |
| Descriptions | 500-1000 | `description`, `notes` |
| URLs | 500 | `fileUrl`, `imageUrl` |
| JSON | 5000+ | `arcProgress` |
| Emails | 255 | `email` |

**Best Practice:**
- Don't use unnecessarily large sizes
- Use 255 for most text fields (Appwrite default)
- Use larger sizes only for JSON or long text

---

### 10. **Collection Design Patterns**

**Naming Conventions:**
- Base collections: `users`, `households`, `products`
- Junction collections: `tasks_done`, `expense_settlements`
- History/Log collections: `price_history`, `xp_history`

**Denormalization:**
- Store frequently accessed data: `householdName` in tasks (if needed for performance)
- Store computed values: `pricePerUnit` in price_history
- Balance: Denormalize for read performance, normalize for write consistency

---

### 11. **Error Handling**

**Validate Relationships:**
- Check if referenced document exists before creating relationship
- Handle deleted relationships gracefully
- Use Appwrite's relationship validation

**Handle Missing Data:**
- Use optional fields for nullable relationships
- Provide defaults where appropriate
- Document expected behavior

---

### 12. **Migration Strategy**

**When Adding Fields:**
- Make new fields optional initially
- Add defaults for required fields
- Update app code to handle both old and new formats

**When Changing Types:**
- Create new field with new type
- Migrate data in batches
- Remove old field after migration

**When Removing Fields:**
- Mark as deprecated first
- Remove from app code
- Remove from schema after grace period

---

## 📋 Checklist for New Collections

- [ ] Collection name follows snake_case convention
- [ ] All relationships use Relationship type (not String)
- [ ] Foreign keys are indexed
- [ ] Date fields use ISO 8601 format
- [ ] Required fields have defaults (if applicable)
- [ ] String sizes are appropriate
- [ ] Composite indexes created for common queries
- [ ] Permissions follow standard pattern
- [ ] Documented in BACKEND_SETUP_GUIDE.md

---

## 🔍 Code Examples

### ✅ Good Relationship Usage

```javascript
// Creating document with relationship
await databases.createDocument(
  databaseId,
  tasksCollectionId,
  ID.unique(),
  {
    name: "Clean kitchen",
    householdId: household.$id,  // Relationship reference
    assignedTo: user.$id,        // Relationship reference
    dueDate: "2024-01-15T10:00:00.000Z"
  }
);

// Querying with relationship
const tasks = await databases.listDocuments(
  databaseId,
  tasksCollectionId,
  [
    Query.equal("householdId", householdId),
    Query.equal("assignedTo", userId)
  ]
);
```

### ❌ Bad: Using String IDs

```javascript
// Don't do this
await databases.createDocument(
  databaseId,
  tasksCollectionId,
  ID.unique(),
  {
    name: "Clean kitchen",
    householdId: "some-string-id",  // No validation!
    assignedTo: "another-string-id"  // Could be invalid
  }
);
```

---

## 📚 References

- [Appwrite Relationships Documentation](https://appwrite.io/docs/databases/relationships)
- [Appwrite Indexes Documentation](https://appwrite.io/docs/databases/indexes)
- [Appwrite Permissions Documentation](https://appwrite.io/docs/databases/permissions)

---

**Last Updated:** 2024-12-08
**Version:** 1.0

