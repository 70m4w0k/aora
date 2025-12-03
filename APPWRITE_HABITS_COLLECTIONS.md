# Appwrite Habits Tracker Collections Setup

This document provides detailed setup instructions for all collections needed for the NEOSYSTEM Habits Tracker feature.

---

## Collection 1: `habits_arcs`

### Collection ID
Use: `habits_arcs` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **name** (String, Required)
   - Type: String
   - Size: 100
   - Required: Yes
   - Description: Arc name (e.g., "Mental", "Physical", "Finance")

2. **color** (String, Required)
   - Type: String
   - Size: 20
   - Required: Yes
   - Default: "#8B5CF6"
   - Description: Hex color code for the arc

3. **icon** (String, Optional)
   - Type: String
   - Size: 100
   - Required: No
   - Description: Icon name or URL (e.g., "meditation", "fitness", "wallet")

4. **description** (String, Optional)
   - Type: String
   - Size: 500
   - Required: No
   - Description: Optional description of the arc

5. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this arc belongs to

6. **createdBy** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: User who created the arc

### Indexes

1. **householdId** (Single)
   - Attributes: `householdId`
   - Type: ASCENDING
   - Description: For efficient querying of arcs by household

### Permissions

- **Read**: `users` role (household members)
- **Create**: `users` role (household members)
- **Update**: `users` role (creator or household admin)
- **Delete**: `users` role (creator or household admin)

---

## Collection 2: `habits_quests`

### Collection ID
Use: `habits_quests` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **name** (String, Required)
   - Type: String
   - Size: 200
   - Required: Yes
   - Description: Quest name (e.g., "Meditate 1x per day", "Run 4x per week")

2. **arcId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `habits_arcs`
   - Required: Yes
   - Description: The arc this quest belongs to

3. **frequency** (String, Required)
   - Type: String
   - Size: 20
   - Required: Yes
   - Default: "daily"
   - Description: Quest frequency (daily, weekly, monthly, annual, unique)

4. **repetitionPerPeriod** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 1
   - Description: How many times per period (e.g., 3 for "3x per week")

5. **intensity** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 1
   - Min: 1
   - Max: 5
   - Description: Difficulty/intensity level (1-5 scale)

6. **xpPerCompletion** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 10
   - Description: XP points awarded per quest completion

7. **accessLevel** (Integer, Optional)
   - Type: Integer
   - Required: No
   - Default: 1
   - Description: Optional access level requirement

8. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this quest belongs to

9. **createdBy** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: User who created the quest

### Indexes

1. **arcId** (Single)
   - Attributes: `arcId`
   - Type: ASCENDING
   - Description: For efficient querying of quests by arc

2. **householdId** (Single)
   - Attributes: `householdId`
   - Type: ASCENDING
   - Description: For efficient querying of quests by household

3. **householdId + frequency** (Composite)
   - Attributes: `householdId`, `frequency`
   - Type: ASCENDING
   - Description: For filtering quests by household and frequency

### Permissions

- **Read**: `users` role (household members)
- **Create**: `users` role (household members)
- **Update**: `users` role (creator or household admin)
- **Delete**: `users` role (creator or household admin)

---

## Collection 3: `habits_quests_completions`

### Collection ID
Use: `habits_quests_completions` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **questId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `habits_quests`
   - Required: Yes
   - Description: The quest that was completed

2. **userId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: User who completed the quest

3. **completedAt** (String/DateTime, Required)
   - Type: String (ISO 8601 format)
   - Size: 255
   - Required: Yes
   - Description: When the quest was completed (ISO format: "2024-01-15T10:00:00.000Z")

4. **streakCount** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 1
   - Description: Current streak count at time of completion

5. **xpEarned** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Description: XP points earned for this completion

6. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this completion belongs to

### Indexes

1. **questId + completedAt** (Composite)
   - Attributes: `questId`, `completedAt`
   - Type: DESCENDING
   - Description: For efficient querying of completions by quest and date

2. **userId + completedAt** (Composite)
   - Attributes: `userId`, `completedAt`
   - Type: DESCENDING
   - Description: For efficient querying of user completions by date

3. **householdId + completedAt** (Composite)
   - Attributes: `householdId`, `completedAt`
   - Type: DESCENDING
   - Description: For efficient querying of household completions by date

### Permissions

- **Read**: `users` role (household members)
- **Create**: `users` role (household members)
- **Update**: `users` role (only own completions)
- **Delete**: `users` role (only own completions or household admin)

---

## Collection 4: `habits_tiers`

### Collection ID
Use: `habits_tiers` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **name** (String, Required)
   - Type: String
   - Size: 200
   - Required: Yes
   - Description: Tier name (e.g., "100 days of meditation", "Run a marathon")

2. **arcId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `habits_arcs`
   - Required: Yes
   - Description: The arc this tier belongs to

3. **targetValue** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Description: Target value to achieve (e.g., 100 for "100 days")

4. **targetType** (String, Required)
   - Type: String
   - Size: 50
   - Required: Yes
   - Default: "count"
   - Description: Type of target (days, count, amount, etc.)

5. **xpReward** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 100
   - Description: XP points awarded when tier is achieved

6. **titleReward** (String, Optional)
   - Type: String
   - Size: 100
   - Required: No
   - Description: Optional class title unlocked when tier is achieved

7. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this tier belongs to

8. **createdBy** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: User who created the tier

### Indexes

1. **arcId** (Single)
   - Attributes: `arcId`
   - Type: ASCENDING
   - Description: For efficient querying of tiers by arc

2. **householdId** (Single)
   - Attributes: `householdId`
   - Type: ASCENDING
   - Description: For efficient querying of tiers by household

### Permissions

- **Read**: `users` role (household members)
- **Create**: `users` role (household members)
- **Update**: `users` role (creator or household admin)
- **Delete**: `users` role (creator or household admin)

---

## Collection 5: `habits_tiers_completions`

### Collection ID
Use: `habits_tiers_completions` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **tierId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `habits_tiers`
   - Required: Yes
   - Description: The tier that was achieved

2. **userId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: User who achieved the tier

3. **completedAt** (String/DateTime, Required)
   - Type: String (ISO 8601 format)
   - Size: 255
   - Required: Yes
   - Description: When the tier was achieved (ISO format)

4. **xpEarned** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Description: XP points earned for achieving this tier

5. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this completion belongs to

### Indexes

1. **tierId + completedAt** (Composite)
   - Attributes: `tierId`, `completedAt`
   - Type: DESCENDING
   - Description: For efficient querying of tier completions

2. **userId + completedAt** (Composite)
   - Attributes: `userId`, `completedAt`
   - Type: DESCENDING
   - Description: For efficient querying of user tier achievements

### Permissions

- **Read**: `users` role (household members)
- **Create**: `users` role (household members)
- **Update**: `users` role (only own completions)
- **Delete**: `users` role (only own completions or household admin)

---

## Collection 6: `habits_user_progress`

### Collection ID
Use: `habits_user_progress` (or generate a unique ID and update `lib/appwrite.js`)

### Attributes

1. **userId** (Relationship, Required)
   - Type: Relationship (One-to-One)
   - Related Collection: `users`
   - Required: Yes
   - Description: User this progress belongs to

2. **householdId** (Relationship, Required)
   - Type: Relationship (Many-to-One)
   - Related Collection: `household`
   - Required: Yes
   - Description: The household this progress belongs to

3. **totalXP** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 0
   - Description: Total XP points earned

4. **globalLevel** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 1
   - Description: Global level

5. **progressionType** (String, Required)
   - Type: String
   - Size: 20
   - Required: Yes
   - Default: "progressive"
   - Description: Level progression type (linear or progressive)

6. **penaltySystemActive** (Boolean, Required)
   - Type: Boolean
   - Required: Yes
   - Default: true
   - Description: Whether penalty system is active

7. **gameDurationYears** (Integer, Required)
   - Type: Integer
   - Required: Yes
   - Default: 1
   - Description: Game duration in years

8. **classId** (String, Optional)
   - Type: String
   - Size: 50
   - Required: No
   - Description: Selected character class ID

9. **unlockedTitles** (String Array, Optional)
   - Type: String Array
   - Required: No
   - Description: Array of unlocked title IDs

10. **unlockedAchievements** (String Array, Optional)
    - Type: String Array
    - Required: No
    - Description: Array of unlocked achievement IDs

11. **totalPenalties** (Integer, Optional)
    - Type: Integer
    - Required: No
    - Default: 0
    - Description: Total number of penalties applied

12. **totalPenaltyXP** (Integer, Optional)
    - Type: Integer
    - Required: No
    - Default: 0
    - Description: Total XP lost due to penalties

13. **arcProgress** (String, Optional)
    - Type: String (JSON)
    - Size: 5000
    - Required: No
    - Description: JSON object storing per-arc progress:
      ```json
      {
        "arcId": {
          "totalXP": 0,
          "level": 1,
          "questsCompleted": 0,
          "tiersCompleted": 0
        }
      }
      ```

### Indexes

1. **userId** (Single, Unique)
   - Attributes: `userId`
   - Type: ASCENDING
   - Unique: Yes
   - Description: One progress record per user

2. **householdId** (Single)
   - Attributes: `householdId`
   - Type: ASCENDING
   - Description: For efficient querying by household

### Permissions

- **Read**: `users` role (household members can see each other's progress)
- **Create**: `users` role (auto-created on first quest completion)
- **Update**: `users` role (only own progress)
- **Delete**: `users` role (only own progress)

---

## Step-by-Step Setup in Appwrite Console

### General Steps for Each Collection:

1. **Go to your Appwrite project** → Databases → Your Database

2. **Create Collection**
   - Click "Create Collection"
   - Enter the collection name and ID
   - Copy the collection ID to `lib/appwrite.js`

3. **Add Attributes** (in the order listed above)

4. **Create Indexes** (as specified for each collection)

5. **Set Permissions** (as specified for each collection)

### Recommended Order:

1. `habits_arcs` (no dependencies)
2. `habits_quests` (depends on `habits_arcs`)
3. `habits_quests_completions` (depends on `habits_quests`)
4. `habits_tiers` (depends on `habits_arcs`)
5. `habits_tiers_completions` (depends on `habits_tiers`)
6. `habits_user_progress` (depends on `users` and `household`)

---

## Notes

- All dates are stored as ISO 8601 strings (e.g., "2024-01-15T10:00:00.000Z")
- The `arcProgress` field in `habits_user_progress` is stored as JSON string
- Frequency values should match: "daily", "weekly", "monthly", "annual", "unique"
- Target types should match: "days", "count", "amount", etc.
- Progression types should match: "linear" or "progressive"
- Each user should have only one `habits_user_progress` document per household

---

## Update `lib/appwrite.js`

After creating the collections, add the collection IDs to `appwriteConfig`:

```javascript
export const appwriteConfig = {
  // ... existing config ...
  // Habits Tracker (NEOSYSTEM)
  habitsArcsCollectionId: "YOUR_COLLECTION_ID",
  habitsQuestsCollectionId: "YOUR_COLLECTION_ID",
  habitsQuestsCompletionsCollectionId: "YOUR_COLLECTION_ID",
  habitsTiersCollectionId: "YOUR_COLLECTION_ID",
  habitsTiersCompletionsCollectionId: "YOUR_COLLECTION_ID",
  habitsUserProgressCollectionId: "YOUR_COLLECTION_ID",
};
```

