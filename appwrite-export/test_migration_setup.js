#!/usr/bin/env node

/**
 * Test script for Appwrite to PostgreSQL migration
 * Validates configuration and basic functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Appwrite to PostgreSQL Migration Setup\n');

// Check required files
const requiredFiles = [
  'package.json',
  'appwrite_to_postgres_migration.js',
  'postgres_schema_complete.sql',
  'MIGRATION_GUIDE.md'
];

console.log('📁 Checking required files:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  ✅ Valid JSON`);
  console.log(`  ✅ Name: ${pkg.name}`);
  console.log(`  ✅ Dependencies: ${Object.keys(pkg.dependencies || {}).length} packages`);
  
  // Check required dependencies
  const requiredDeps = ['appwrite', 'pg', 'dotenv'];
  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${pkg.dependencies[dep]}`);
    } else {
      console.log(`  ❌ Missing dependency: ${dep}`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log(`  ❌ Invalid package.json: ${error.message}`);
  allFilesExist = false;
}

// Check migration script
console.log('\n📜 Checking migration script:');
try {
  const script = fs.readFileSync('appwrite_to_postgres_migration.js', 'utf8');
  console.log(`  ✅ Script size: ${(script.length / 1024).toFixed(1)} KB`);
  
  // Check for required classes
  const requiredClasses = ['MigrationManager', 'Logger'];
  requiredClasses.forEach(className => {
    if (script.includes(`class ${className}`)) {
      console.log(`  ✅ Found class: ${className}`);
    } else {
      console.log(`  ❌ Missing class: ${className}`);
      allFilesExist = false;
    }
  });
  
  // Check for required methods
  const requiredMethods = ['initialize', 'migrateCollection', 'resolveForeignKeys'];
  requiredMethods.forEach(method => {
    if (script.includes(`async ${method}`)) {
      console.log(`  ✅ Found method: ${method}`);
    } else {
      console.log(`  ❌ Missing method: ${method}`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading script: ${error.message}`);
  allFilesExist = false;
}

// Check PostgreSQL schema
console.log('\n🗄️ Checking PostgreSQL schema:');
try {
  const schema = fs.readFileSync('postgres_schema_complete.sql', 'utf8');
  console.log(`  ✅ Schema size: ${(schema.length / 1024).toFixed(1)} KB`);
  
  // Count CREATE TABLE statements
  const tableCount = (schema.match(/CREATE TABLE/g) || []).length;
  console.log(`  ✅ Tables defined: ${tableCount}`);
  
  if (tableCount >= 24) {
    console.log(`  ✅ Expected tables: 24+ (good!)`);
  } else {
    console.log(`  ⚠️  Expected 24+ tables, found ${tableCount}`);
  }
  
  // Check for important tables
  const importantTables = ['users', 'households', 'tasks', 'migration_tracking'];
  importantTables.forEach(table => {
    if (schema.includes(`CREATE TABLE ${table}`) || schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`  ✅ Found table: ${table}`);
    } else {
      console.log(`  ❌ Missing table: ${table}`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading schema: ${error.message}`);
  allFilesExist = false;
}

// Summary
console.log('\n📊 Summary:');
if (allFilesExist) {
  console.log('✅ All checks passed! Migration setup is ready.');
  console.log('\nNext steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Configure .env file with your credentials');
  console.log('3. Create PostgreSQL database: createdb household_app');
  console.log('4. Run schema: psql -d household_app -f postgres_schema_complete.sql');
  console.log('5. Run migration: npm run migrate');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n🔧 Quick setup commands:');
console.log(`
# 1. Install dependencies
npm install

# 2. Create .env file (edit with your credentials)
cat > .env << 'EOF'
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=66cc7b47003a18bd5600
APPWRITE_API_KEY=your_appwrite_api_key_here
APPWRITE_DATABASE_ID=66cc7c760013e5170042
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=household_app
PG_USER=postgres
PG_PASSWORD=your_password_here
EOF

# 3. Setup PostgreSQL
createdb household_app
psql -d household_app -f postgres_schema_complete.sql

# 4. Run migration
npm run migrate
`);