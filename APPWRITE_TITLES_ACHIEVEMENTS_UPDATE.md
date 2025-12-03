# Appwrite Collection Update: Titles & Achievements

## Collection: `habits_user_progress`

You need to add **one new attribute** to support the Titles & Achievements system.

### New Attribute to Add

**Attribute Name:** `unlockedAchievements`

- **Type:** String Array
- **Required:** No (Optional)
- **Size:** Not applicable (array type)
- **Default:** Empty array `[]`
- **Description:** Array of unlocked achievement IDs (e.g., `["first_quest", "first_tier", "level_10"]`)

### Steps to Update in Appwrite Console

1. **Go to your Appwrite Console**
   - Navigate to your project
   - Go to Databases → Your Database → `habits_user_progress` collection

2. **Add the New Attribute**
   - Click on "Attributes" tab
   - Click "Create Attribute"
   - Select **"String"** as the type
   - Check **"Array"** checkbox
   - Enter attribute key: `unlockedAchievements`
   - Leave "Required" unchecked (optional attribute)
   - Click "Create"

3. **Verify Existing Attributes**
   Make sure these attributes already exist:
   - `unlockedTitles` (String Array, Optional) - Should already exist
   - `totalPenalties` (Integer, Optional) - Should already exist
   - `totalPenaltyXP` (Integer, Optional) - Should already exist

### Complete Attribute List for `habits_user_progress`

After this update, your collection should have these attributes:

1. `userId` (Relationship → `users`)
2. `householdId` (Relationship → `household`)
3. `totalXP` (Integer, Required, Default: 0)
4. `globalLevel` (Integer, Required, Default: 1)
5. `progressionType` (String, Required, Default: "progressive")
6. `penaltySystemActive` (Boolean, Required, Default: true)
7. `gameDurationYears` (Integer, Required, Default: 1)
8. `classId` (String, Optional)
9. `unlockedTitles` (String Array, Optional)
10. **`unlockedAchievements` (String Array, Optional)** ← NEW
11. `totalPenalties` (Integer, Optional, Default: 0)
12. `totalPenaltyXP` (Integer, Optional, Default: 0)
13. `arcProgress` (String, Optional, JSON format)

### Testing

After adding the attribute:
1. The app will automatically start storing achievement IDs when users unlock achievements
2. Existing user progress records will have an empty array `[]` for `unlockedAchievements` by default
3. No data migration needed - existing records will work fine with the new attribute

### Notes

- The attribute stores achievement IDs as strings in an array format
- Example value: `["first_quest", "first_tier", "level_10"]`
- The app handles both array and string formats for backward compatibility
- No indexes needed for this attribute (it's only used for display, not querying)

