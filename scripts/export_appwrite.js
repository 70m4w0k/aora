const { Client, Databases } = require('node-appwrite');

// Configuration - USE YOUR ACTUAL CREDENTIALS
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('66cc7b47003a18bd5600')
    .setKey('standard_300e4f86c9e0029641fe38a8dd3a4ecf59e20b995d9a35264ae83c1a7de3c881e8ba653c95cd90925651ebeb3400df53ebb1d5e2cdaa1fa2e2e53c00a1e7bee230934fbe17108ad0b056a940e173ca9c1f6540dce23f04e445382236b9db20c66f8d96d809cbf48b23060e4e2d6be3b1e1b651f58d43aaee05657f2aba1503a3');

const databases = new Databases(client);
const DATABASE_ID = '66cc7c760013e5170042';

async function exportSchema() {
    console.log('🔍 Starting Appwrite Schema Export...\n');
    
    try {
        // List all collections
        console.log('📊 Fetching collections...');
        const collections = await databases.listCollections(DATABASE_ID);
        console.log(`Found ${collections.total} collections\n`);
        
        const schema = {
            databaseId: DATABASE_ID,
            totalCollections: collections.total,
            collections: []
        };
        
        // Analyze each collection
        for (const collection of collections.collections) {
            console.log(`📁 Exporting: ${collection.name} (${collection.$id})`);
            
            const collectionInfo = {
                id: collection.$id,
                name: collection.name,
                description: collection.$description || '',
                createdAt: collection.$createdAt,
                permissions: collection.$permissions,
                attributes: [],
                indexes: [],
                documentCount: 0
            };
            
            // Get attributes
            try {
                const attributes = await databases.listAttributes(DATABASE_ID, collection.$id);
                console.log(`  📋 ${attributes.total} attributes`);
                
                for (const attr of attributes.attributes) {
                    collectionInfo.attributes.push({
                        key: attr.key,
                        type: attr.type,
                        size: attr.size,
                        required: attr.required,
                        array: attr.array || false,
                        default: attr.default
                    });
                }
            } catch (attrError) {
                console.log(`  ⚠️  Could not fetch attributes: ${attrError.message}`);
            }
            
            // Get indexes
            try {
                const indexes = await databases.listIndexes(DATABASE_ID, collection.$id);
                if (indexes.total > 0) {
                    console.log(`  🔍 ${indexes.total} indexes`);
                    for (const index of indexes.indexes) {
                        collectionInfo.indexes.push({
                            key: index.key,
                            type: index.type,
                            attributes: index.attributes,
                            orders: index.orders
                        });
                    }
                }
            } catch (indexError) {
                console.log(`  ⚠️  Could not fetch indexes: ${indexError.message}`);
            }
            
            // Get document count
            try {
                const documents = await databases.listDocuments(DATABASE_ID, collection.$id, [], 1);
                collectionInfo.documentCount = documents.total;
                console.log(`  📄 ${documents.total} documents`);
                
                // Get sample document structure
                if (documents.total > 0) {
                    const sampleDocs = await databases.listDocuments(DATABASE_ID, collection.$id, [], 1);
                    if (sampleDocs.documents.length > 0) {
                        const sample = sampleDocs.documents[0];
                        // Remove metadata for cleaner output
                        const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = sample;
                        collectionInfo.sampleDocument = data;
                    }
                }
            } catch (docError) {
                console.log(`  ⚠️  Could not fetch documents: ${docError.message}`);
            }
            
            schema.collections.push(collectionInfo);
            console.log('');
        }
        
        // Save to file
        const fs = require('fs');
        fs.writeFileSync('appwrite_schema_export.json', JSON.stringify(schema, null, 2));
        console.log('✅ Schema exported to appwrite_schema_export.json');
        
        // Display summary
        console.log('\n📈 EXPORT SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Database ID: ${schema.databaseId}`);
        console.log(`Total Collections: ${schema.totalCollections}`);
        
        let totalDocs = 0;
        let totalAttrs = 0;
        
        schema.collections.forEach(col => {
            console.log(`\n• ${col.name}`);
            console.log(`  ID: ${col.id}`);
            console.log(`  Documents: ${col.documentCount}`);
            console.log(`  Attributes: ${col.attributes.length}`);
            console.log(`  Indexes: ${col.indexes.length}`);
            
            totalDocs += col.documentCount;
            totalAttrs += col.attributes.length;
            
            // Show first few attributes
            if (col.attributes.length > 0) {
                console.log(`  Sample attributes:`);
                col.attributes.slice(0, 3).forEach(attr => {
                    console.log(`    - ${attr.key}: ${attr.type}${attr.array ? '[]' : ''}`);
                });
                if (col.attributes.length > 3) {
                    console.log(`    ... and ${col.attributes.length - 3} more`);
                }
            }
        });
        
        console.log('\n📊 TOTALS:');
        console.log(`Total Documents: ${totalDocs}`);
        console.log(`Total Attributes: ${totalAttrs}`);
        console.log(`Total Indexes: ${schema.collections.reduce((sum, col) => sum + col.indexes.length, 0)}`);
        
    } catch (error) {
        console.error('❌ Export failed:', error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

// Run export
exportSchema();