# Appwrite to PostgreSQL Migration - Configuration

## Environment Variables

Create a `.env` file in the same directory:

```bash
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=66cc7b47003a18bd5600
APPWRITE_API_KEY=your_appwrite_api_key_here
APPWRITE_DATABASE_ID=66cc7c760013e5170042

x
```

## Configuration File (Optional)

You can also create a `config.json` file:

```json
{
  "appwrite": {
    "endpoint": "https://cloud.appwrite.io/v1",
    "projectId": "66cc7b47003a18bd5600",
    "apiKey": "your_appwrite_api_key_here",
    "databaseId": "66cc7c760013e5170042"
  },
  "postgres": {
    "host": "localhost",
    "port": 5432,
    "database": "household_app",
    "user": "postgres",
    "password": "your_password_here"
  },
  "migration": {
    "batchSize": 100,
    "maxRetries": 3,
    "logLevel": "info"
  }
}
```

## Appwrite API Key Setup

1. Go to your Appwrite project dashboard
2. Navigate to **Settings** → **API Keys**
3. Create a new API key with:
  - **Scope**: `databases.read`
  - **Expiration**: Set as needed
4. Copy the API key and add it to your configuration

## PostgreSQL Setup

1. **Create Database**:
  ```bash
   createdb household_app
  ```
2. **Run Schema**:
  ```bash
   psql -d household_app -f postgres_schema_complete.sql
  ```
3. **Verify Tables**:
  ```sql
   \dt
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
   -- Should show 24 tables (23 + migration_tracking)
  ```

## Running the Migration

### Basic Migration:

```bash
npm install
npm run migrate
```

### With Environment File:

```bash
node appwrite_to_postgres_migration.js --env .env
```

### With Config File:

```bash
node appwrite_to_postgres_migration.js --config config.json
```

### Dry Run (Test without writing):

```bash
npm run migrate:dry-run
```

### Resume Interrupted Migration:

```bash
npm run migrate:resume
```

### Migrate Specific Collections:

```bash
node appwrite_to_postgres_migration.js --collections users,households,tasks
```

## Migration Steps

The migration follows this order:

1. **Setup**: Creates migration tracking table
2. **Data Migration**: Migrates collections in dependency order:
  - households → users → tasks → task_done → stores → products → shopping_items
  - expenses → expense_settlements → price_history → plants → plant_events
  - plant_reminders → documents → events → habits_arcs → habits_quests
  - habits_quests_completions → habits_tiers → habits_tiers_completions
  - habits_user_progress → habits_xp_history → videos
3. **Relationship Resolution**: Updates foreign key references
4. **Cleanup**: Closes connections and generates report

## Monitoring Migration

During migration, check progress:

```sql
-- Check migration status
SELECT * FROM migration_tracking ORDER BY migrated_at;

-- Check counts
SELECT 
  appwrite_collection,
  status,
  records_count,
  migrated_at
FROM migration_tracking
ORDER BY 
  CASE status 
    WHEN 'completed' THEN 1
    WHEN 'in_progress' THEN 2
    WHEN 'pending' THEN 3
    ELSE 4
  END;
```

## Post-Migration Verification

After migration completes:

1. **Check Migration Report**: `migration_report.json`
2. **Verify Data Integrity**:
  ```sql
   -- Check total document counts
   SELECT 'users' as table_name, COUNT(*) FROM users
   UNION ALL SELECT 'households', COUNT(*) FROM households
   UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
   -- ... repeat for all tables
   ORDER BY table_name;

   -- Check foreign key integrity
   SELECT 
     tc.table_name, 
     kcu.column_name, 
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY';
  ```

## Troubleshooting

### Common Issues:

1. **Connection Errors**:
  - Verify PostgreSQL is running: `pg_isready`
  - Check credentials in `.env` file
  - Ensure database exists: `psql -l`
2. **Appwrite API Errors**:
  - Verify API key has `databases.read` scope
  - Check project ID and database ID
  - Ensure Appwrite service is accessible
3. **Migration Interruption**:
  - Use `--resume` flag to continue
  - Check `migration_tracking` table for status
  - Manually update status if needed
4. **Memory Issues**:
  - Reduce `MIGRATION_BATCH_SIZE` in config
  - Process collections individually with `--collections`

### Logs:

- Check console output for detailed logs
- Log level can be adjusted with `LOG_LEVEL=debug`
- Migration report saved to `migration_report.json`

## Rollback Plan

If migration fails or needs to be undone:

1. **Backup PostgreSQL**:
  ```bash
   pg_dump household_app > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
2. **Drop Tables**:
  ```sql
   -- Drop all migrated tables (careful!)
   DROP TABLE IF EXISTS 
     migration_tracking,
     users, households, tasks, task_completions,
     stores, products, shopping_items, expenses,
     expense_settlements, price_history, plants,
     plant_events, plant_reminders, documents,
     events, habits_arcs, habits_quests,
     habits_quests_completions, habits_tiers,
     habits_tiers_completions, habits_user_progress,
     habits_xp_history, videos CASCADE;
  ```
3. **Restore from Backup**:
  ```bash
   psql -d household_app -f backup_file.sql
  ```

## Support

For issues:

1. Check the migration report
2. Review console logs
3. Verify configuration
4. Test with smaller batch sizes

