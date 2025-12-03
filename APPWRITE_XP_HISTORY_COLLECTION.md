# Appwrite XP History Collection Setup

This document provides setup instructions for the `habits_xp_history` collection used to track all XP gains in the NEOSYSTEM Habits Tracker.

---

## Collection: `habits_xp_history`

### Collection ID
Use: `habits_xp_history` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **userId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: The user who earned the XP

2. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this XP gain belongs to

3. **xpAmount** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Description: Amount of XP earned (net, after penalties)

4. **sourceType** (String, Required)
   - Type: String
   - Size: 20
   - Required: Yes
   - Description: Type of source - either "quest" or "tier"

5. **sourceId** (String, Required)
   - Type: String
   - Size: 100
   - Required: Yes
   - Description: ID of the quest or tier that generated this XP

6. **arcId** (Relationship, Optional)
   - Type: Relationship (Many-to-One)
   - Related Collection: `habits_arcs`
   - Required: No
   - Description: The arc this XP belongs to (for filtering)

7. **questName** (String, Optional)
   - Type: String
   - Size: 200
   - Required: No
   - Description: Name of the quest (for display, stored for historical reference)

8. **tierName** (String, Optional)
   - Type: String
   - Size: 200
   - Required: No
   - Description: Name of the tier (for display, stored for historical reference)

9. **arcName** (String, Optional)
   - Type: String
   - Size: 100
   - Required: No
   - Description: Name of the arc (for display, stored for historical reference)

10. **penaltyXP** (Integer, Optional)
    - Type: Integer
    - Required: No
    - Default: 0
    - Description: Amount of XP deducted as penalty (if any)

11. **earnedAt** (DateTime, Required)
    - Type: DateTime
    - Required: Yes
    - Description: When the XP was earned

### Indexes

1. **userId_householdId** (Composite)
   - Attributes: `userId`, `householdId`
   - Type: ASCENDING
   - Description: For efficient querying of XP history by user and household

2. **earnedAt** (Single)
   - Attributes: `earnedAt`
   - Type: DESCENDING
   - Description: For sorting XP history by date (most recent first)

3. **arcId** (Single)
   - Attributes: `arcId`
   - Type: ASCENDING
   - Description: For filtering XP history by arc

4. **sourceType** (Single)
   - Attributes: `sourceType`
   - Type: ASCENDING
   - Description: For filtering XP history by source type (quest/tier)

5. **earnedAt_range** (Composite)
   - Attributes: `earnedAt`, `householdId`
   - Type: ASCENDING
   - Description: For efficient date range queries

### Permissions

- **Read**: `users` role (household members can view their own XP history)
- **Create**: `users` role (system creates entries when quests/tiers are completed)
- **Update**: None (XP history is immutable)
- **Delete**: None (XP history should not be deleted)

---

## Setup Steps

1. **Create Collection**
   - Go to Appwrite Console → Database → Your Database
   - Click "Create Collection"
   - Set Collection ID: `habits_xp_history`
   - Set Name: "Habits XP History"

2. **Add Attributes**
   - Add all attributes listed above in the order specified
   - Set appropriate types, sizes, and required flags

3. **Create Indexes**
   - Create all indexes listed above
   - This ensures efficient querying and filtering

4. **Set Permissions**
   - Read: `users` role
   - Create: `users` role
   - Update: None
   - Delete: None

5. **Update App Configuration**
   - The collection ID is already configured in `lib/appwrite.js` as `habitsXpHistoryCollectionId`
   - No code changes needed if using the exact collection ID

---

## Notes

- XP history entries are created automatically when quests or tiers are completed
- The `xpAmount` field stores the **net XP** (after penalties are deducted)
- The `penaltyXP` field stores the penalty amount separately for reference
- Names (questName, tierName, arcName) are stored for historical reference in case quests/tiers/arcs are deleted
- The collection supports filtering by arc, source type, and date range

