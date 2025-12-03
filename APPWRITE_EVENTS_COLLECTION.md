# Appwrite Events Collection Setup

## Collection Name
`events`

## Collection ID
Use: `events` (or generate a unique ID and update `lib/appwrite.js`)

## Attributes

### 1. title (String, Required)
- **Type**: String
- **Size**: 255
- **Required**: Yes
- **Array**: No
- **Description**: Event title/name

### 2. description (String, Optional)
- **Type**: String
- **Size**: 2000
- **Required**: No
- **Array**: No
- **Description**: Event description/notes

### 3. startDate (String/DateTime, Required)
- **Type**: String (ISO 8601 format)
- **Size**: 255
- **Required**: Yes
- **Array**: No
- **Description**: Event start date and time (ISO format: "2024-01-15T10:00:00.000Z")

### 4. endDate (String/DateTime, Required)
- **Type**: String (ISO 8601 format)
- **Size**: 255
- **Required**: Yes
- **Array**: No
- **Description**: Event end date and time (ISO format: "2024-01-15T12:00:00.000Z")

### 5. allDay (Boolean, Required)
- **Type**: Boolean
- **Required**: Yes
- **Default**: false
- **Description**: Whether the event is all-day

### 6. category (String, Required)
- **Type**: String
- **Size**: 50
- **Required**: Yes
- **Array**: No
- **Default**: "other"
- **Description**: Event category (chore, meeting, social, work, personal, reminder, other)

### 7. color (String, Optional)
- **Type**: String
- **Size**: 20
- **Required**: No
- **Array**: No
- **Description**: Custom color for the event (hex color code, e.g., "#06B6D4")

### 8. householdId (Relationship, Required)
- **Type**: Relationship (Many-to-One)
- **Related Collection**: `household`
- **Required**: Yes
- **Description**: The household this event belongs to

### 9. createdBy (Relationship, Required)
- **Type**: Relationship (Many-to-One)
- **Related Collection**: `users`
- **Required**: Yes
- **Description**: User who created the event

### 10. assignedTo (Relationship, Optional)
- **Type**: Relationship (Many-to-One)
- **Related Collection**: `users`
- **Required**: No
- **Description**: User assigned to this event (optional)

## Indexes

### 1. householdId + startDate (Composite)
- **Attributes**: `householdId`, `startDate`
- **Type**: ASCENDING
- **Description**: For efficient querying of events by household and date range

### 2. householdId + endDate (Composite)
- **Attributes**: `householdId`, `endDate`
- **Type**: ASCENDING
- **Description**: For efficient querying of events by household and date range

## Permissions

### Read
- **Role**: `users` (authenticated users)
- **Condition**: User must be a member of the household

### Create
- **Role**: `users` (authenticated users)
- **Condition**: User must be a member of the household

### Update
- **Role**: `users` (authenticated users)
- **Condition**: User must be the creator OR a household admin

### Delete
- **Role**: `users` (authenticated users)
- **Condition**: User must be the creator OR a household admin

## Step-by-Step Setup in Appwrite Console

1. **Go to your Appwrite project** → Databases → Your Database

2. **Create Collection**
   - Click "Create Collection"
   - Name: `events`
   - Collection ID: `events` (or copy the generated ID to `lib/appwrite.js`)

3. **Add Attributes** (in order):
   - `title` - String (255, required)
   - `description` - String (2000, optional)
   - `startDate` - String (255, required)
   - `endDate` - String (255, required)
   - `allDay` - Boolean (required, default: false)
   - `category` - String (50, required, default: "other")
   - `color` - String (20, optional)
   - `householdId` - Relationship → `household` collection (required)
   - `createdBy` - Relationship → `users` collection (required)
   - `assignedTo` - Relationship → `users` collection (optional)

4. **Create Indexes**:
   - Index 1: `householdId` (ASC) + `startDate` (ASC)
   - Index 2: `householdId` (ASC) + `endDate` (ASC)

5. **Set Permissions**:
   - **Read**: `users` role
   - **Create**: `users` role
   - **Update**: `users` role (with condition: creator or admin)
   - **Delete**: `users` role (with condition: creator or admin)

## Notes

- The `startDate` and `endDate` are stored as ISO 8601 strings (e.g., "2024-01-15T10:00:00.000Z")
- The `category` should match one of the values in `EventCategories` enum in `lib/appwrite.js`
- If `allDay` is true, the time portion of dates can be ignored
- The `color` field allows custom event colors, but defaults to category colors if not set


