# 📝 Database Update Guidelines

**Purpose:** Guidelines for maintaining and updating the Appwrite database schema  
**Version:** 1.0  
**Last Updated:** 2024-12-08

This document provides step-by-step guidelines for making database changes while maintaining consistency and best practices.

---

## 🎯 Core Principles

1. **Always follow APPWRITE_DB_BEST_PRACTICES.md**
2. **Maintain consistency with existing schema**
3. **Document all changes**
4. **Test changes before applying**
5. **Update code and documentation together**

---

## 📋 Pre-Update Checklist

Before making any database changes:

- [ ] Read `APPWRITE_DB_BEST_PRACTICES.md`
- [ ] Review `DB_SCHEMA_CORRECTED.md` for current schema
- [ ] Check if change is needed (avoid unnecessary changes)
- [ ] Plan the change (what, why, how)
- [ ] Consider backward compatibility
- [ ] Plan migration strategy (if needed)
- [ ] Update this document with change log

---

## 🔄 Types of Changes

### 1. Adding a New Collection

**Steps:**

1. **Design the schema:**
   - Follow naming convention (snake_case)
   - Use Relationship attributes (not String IDs)
   - Define all attributes with types and sizes
   - Plan indexes for common queries
   - Define permissions

2. **Document the schema:**
   - Add to `DB_SCHEMA_CORRECTED.md`
   - Include all attributes, indexes, permissions
   - Add to `BACKEND_SETUP_GUIDE.md` if user-facing

3. **Create in Appwrite Console:**
   - Create collection with proper ID
   - Add attributes in order (relationships first)
   - Create indexes
   - Set permissions

4. **Update code:**
   - Add collection ID to `lib/appwrite.js`
   - Create CRUD functions if needed
   - Update types/interfaces

5. **Test:**
   - Create test document
   - Query test document
   - Update test document
   - Delete test document
   - Verify relationships work

6. **Update documentation:**
   - Add collection to relevant guides
   - Update API documentation if needed

**Example:**

```markdown
### New Collection: `notifications`

**Collection ID:** `notifications`

**Attributes:**
- `title` (String, 255, required)
- `message` (String, 1000, required)
- `type` (String, 50, required) - "info", "warning", "error"
- `isRead` (Boolean, required, default: false)
- `userId` (Relationship → `users`, required)
- `householdId` (Relationship → `households`, required)
- `createdAt` (String, 255, required) - ISO 8601

**Indexes:**
- `userId` (ASCENDING)
- `isRead` (ASCENDING)
- `userId + isRead` (Composite, ASCENDING)

**Permissions:**
- Read: `role:users` (own notifications)
- Create: `role:users` (system)
- Update: `role:users` (own notifications)
- Delete: `role:users` (own notifications)
```

---

### 2. Adding a New Attribute

**Steps:**

1. **Check if attribute is needed:**
   - Can existing attributes be used?
   - Is this a computed value (should be in app, not DB)?

2. **Design the attribute:**
   - Choose correct type
   - Set appropriate size
   - Determine if required or optional
   - Set default value if optional

3. **Consider backward compatibility:**
   - Make new attribute optional initially
   - Provide default value
   - Update app code to handle missing attribute

4. **Add to Appwrite Console:**
   - Add attribute to collection
   - Set type, size, required, default

5. **Update code:**
   - Update types/interfaces
   - Update create/update functions
   - Handle default values

6. **Migrate existing data (if needed):**
   - Set default values for existing documents
   - Or leave null if optional

7. **Update documentation:**
   - Add to `DB_SCHEMA_CORRECTED.md`
   - Update relevant guides

**Example:**

```markdown
**Change:** Added `priority` attribute to `tasks` collection

**Reason:** Need to prioritize tasks

**Attribute:**
- `priority` (String, 20, optional, default: "medium") - "low", "medium", "high"

**Migration:**
- Existing tasks get default "medium"
- No data loss

**Code Changes:**
- Updated Task interface
- Updated createTask function
- Updated UI to show priority
```

---

### 3. Modifying an Existing Attribute

**⚠️ Warning:** This can break existing code!

**Steps:**

1. **Assess impact:**
   - Will this break existing queries?
   - Will this break existing code?
   - Can we maintain backward compatibility?

2. **Plan migration:**
   - Create new attribute with new type/name
   - Migrate data from old to new
   - Update code to use new attribute
   - Remove old attribute after grace period

3. **Alternative: Add new, deprecate old:**
   - Add new attribute
   - Keep old attribute temporarily
   - Update code to use new
   - Remove old after migration complete

4. **Update Appwrite Console:**
   - Add new attribute
   - Migrate data (via script or manually)
   - Remove old attribute (after migration)

5. **Update code:**
   - Update all references
   - Handle both old and new (during transition)
   - Remove old references (after migration)

6. **Update documentation:**
   - Document change
   - Document migration steps
   - Update schema docs

**Example:**

```markdown
**Change:** Renamed `date` to `documentDate` in `documents` collection

**Reason:** More descriptive name, follows naming convention

**Migration Steps:**
1. Add `documentDate` attribute (copy from `date`)
2. Update code to use `documentDate`
3. Verify all documents migrated
4. Remove `date` attribute

**Backward Compatibility:**
- Code handles both during transition
- Old `date` removed after 1 week grace period
```

---

### 4. Adding an Index

**Steps:**

1. **Identify need:**
   - Slow queries?
   - Common filter patterns?
   - Missing foreign key indexes?

2. **Design index:**
   - Single field or composite?
   - ASCENDING or DESCENDING?
   - Unique constraint needed?

3. **Add to Appwrite Console:**
   - Create index
   - Monitor query performance

4. **Update documentation:**
   - Add to `DB_SCHEMA_CORRECTED.md`
   - Note why index was added

**Example:**

```markdown
**Change:** Added composite index `householdId + status` to `tasks`

**Reason:** Common query pattern: get tasks by household and status

**Index:**
- `householdId + status` (Composite, ASCENDING)

**Performance Impact:**
- Query time reduced from ~200ms to ~50ms
```

---

### 5. Modifying Permissions

**⚠️ Warning:** This affects security!

**Steps:**

1. **Assess security impact:**
   - Will this expose data?
   - Will this restrict legitimate access?
   - Test thoroughly!

2. **Plan change:**
   - Document current permissions
   - Document new permissions
   - Explain why change is needed

3. **Update Appwrite Console:**
   - Modify permissions
   - Test with different user roles

4. **Update code:**
   - Update permission validation logic
   - Update error handling

5. **Update documentation:**
   - Document permission changes
   - Update security notes

**Example:**

```markdown
**Change:** Updated `expenses` delete permission

**Before:** `role:users` (any authenticated user)

**After:** `role:users` (only creator or household admin)

**Reason:** Prevent accidental deletion by other users

**Code Changes:**
- Added ownership validation in deleteExpense function
- Added household admin check
```

---

### 6. Adding a Relationship

**Steps:**

1. **Verify relationship is needed:**
   - Is this a true relationship?
   - Will it be queried frequently?
   - Does it need referential integrity?

2. **Add relationship attribute:**
   - Use Relationship type (not String)
   - Set related collection
   - Set cardinality (One-to-One, Many-to-One, etc.)

3. **Add index:**
   - Always index foreign keys
   - Add composite indexes if needed

4. **Update code:**
   - Update create/update functions
   - Use relationship references
   - Handle relationship errors

5. **Update documentation:**
   - Add to schema docs
   - Document relationship purpose

**Example:**

```markdown
**Change:** Added `assignedTo` relationship to `tasks`

**Attribute:**
- `assignedTo` (Relationship → `users`, optional)

**Index:**
- `assignedTo` (ASCENDING)

**Code Changes:**
- Updated createTask to accept user reference
- Updated queries to filter by assignedTo
```

---

## 📝 Change Log Template

When making changes, document them:

```markdown
## Change Log Entry

**Date:** YYYY-MM-DD
**Type:** [New Collection | New Attribute | Modified Attribute | New Index | Permission Change | Relationship]
**Collection:** `collection_name`
**Description:** Brief description of change

**Reason:** Why this change was made

**Changes:**
- Specific changes made

**Migration:**
- Steps taken to migrate existing data (if applicable)

**Code Changes:**
- Files modified
- Functions updated

**Testing:**
- How change was tested
- Test results

**Documentation:**
- Docs updated
- Links to updated docs
```

---

## ✅ Post-Update Checklist

After making changes:

- [ ] Changes tested in development
- [ ] Code updated to match schema
- [ ] Documentation updated
- [ ] Change logged in this document
- [ ] Team notified (if applicable)
- [ ] Backup created (before production changes)
- [ ] Changes applied to production
- [ ] Production tested
- [ ] Monitoring for errors

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't:

1. **Use String IDs for relationships**
   - Always use Relationship type
   - Exception: External system references

2. **Forget indexes**
   - Always index foreign keys
   - Index frequently queried fields

3. **Break backward compatibility**
   - Add new fields as optional
   - Provide defaults
   - Deprecate before removing

4. **Skip documentation**
   - Always update schema docs
   - Document migration steps
   - Update code comments

5. **Make changes without testing**
   - Test in development first
   - Test with real data
   - Test edge cases

6. **Ignore naming conventions**
   - Use snake_case for collections
   - Use camelCase for attributes
   - Be consistent

7. **Forget permissions**
   - Review permissions for new collections
   - Test with different user roles
   - Document permission logic

---

## 📚 Reference Documents

When making changes, refer to:

1. **APPWRITE_DB_BEST_PRACTICES.md** - Best practices guide
2. **DB_SCHEMA_CORRECTED.md** - Current schema reference
3. **DB_SCHEMA_ANALYSIS.md** - Analysis of current schema
4. **BACKEND_SETUP_GUIDE.md** - User-facing setup guide

---

## 🔍 Review Process

Before applying changes to production:

1. **Design Review:**
   - Does it follow best practices?
   - Is it consistent with existing schema?
   - Are naming conventions followed?

2. **Code Review:**
   - Is code updated?
   - Are types/interfaces updated?
   - Are functions updated?

3. **Documentation Review:**
   - Is schema documented?
   - Are migration steps documented?
   - Are code changes documented?

4. **Testing Review:**
   - Are tests passing?
   - Are edge cases covered?
   - Is performance acceptable?

---

## 📞 Questions?

If unsure about a change:

1. Review `APPWRITE_DB_BEST_PRACTICES.md`
2. Check `DB_SCHEMA_CORRECTED.md` for similar patterns
3. Review Appwrite documentation
4. Test in development first
5. Document the change

---

**Last Updated:** 2024-12-08  
**Maintained By:** Development Team  
**Review Frequency:** Quarterly

