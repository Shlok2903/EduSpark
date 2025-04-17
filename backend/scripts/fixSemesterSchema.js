/**
 * This script fixes the Semester collection schema by:
 * 1. Creating a backup of the existing collection
 * 2. Removing problematic indexes (branch_1_number_1)
 * 3. Removing fields causing issues (number/order)
 * 
 * To run: node scripts/fixSemesterSchema.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Main function with proper async handling
async function main() {
  try {
    // Connect to MongoDB and wait for connection
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to MongoDB successfully');
    
    // Ensure we have a valid connection before proceeding
    if (!mongoose.connection || !mongoose.connection.db) {
      console.error('MongoDB connection not properly established. Check your connection string.');
      process.exit(1);
    }
    
    // Wait a moment to ensure the connection is fully established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Execute the fix
    await fixSemesterSchema();
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    // Disconnect from MongoDB
    try {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
    process.exit(0);
  }
}

async function fixSemesterSchema() {
  const db = mongoose.connection.db;
  
  try {
    console.log('Starting semester schema fix...');
    console.log('Using database:', mongoose.connection.name);
    
    // Log available collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // 1. Check if semesters collection exists
    const semesterExists = collections.some(c => c.name === 'semesters');
    
    if (!semesterExists) {
      console.log('Semesters collection does not exist. No changes needed.');
      return;
    }
    
    // 2. Create a backup of the semesters collection
    console.log('Creating backup of semesters collection...');
    const semesters = await db.collection('semesters').find({}).toArray();
    
    // 3. Create a backup collection if it doesn't exist
    const backupCollectionName = 'semesters_backup_' + Date.now();
    await db.createCollection(backupCollectionName);
    
    if (semesters.length > 0) {
      await db.collection(backupCollectionName).insertMany(semesters);
      console.log(`Backup created in collection: ${backupCollectionName}`);
    } else {
      console.log('No semester data to backup');
    }
    
    // 4. Try to explicitly drop the problematic index first
    try {
      await db.collection('semesters').dropIndex('branch_1_number_1');
      console.log('Dropped problematic branch_1_number_1 index');
    } catch (indexError) {
      // Index might not exist, so it's okay if this fails
      console.log('Note: branch_1_number_1 index not found or already dropped');
    }
    
    // 5. Drop the semesters collection to remove all problematic indexes
    await db.collection('semesters').drop();
    console.log('Dropped original semesters collection with problematic indexes');
    
    // 6. Create a new semesters collection without the problematic indexes
    await db.createCollection('semesters');
    console.log('Created new semesters collection');
    
    // 7. Add only the indexes we need (no compound indexes, just branchId)
    await db.collection('semesters').createIndex({ branchId: 1 });
    console.log('Added appropriate indexes');
    
    // 8. Restore the data without the problematic fields
    if (semesters.length > 0) {
      const updatedSemesters = semesters.map(sem => {
        // Remove all potentially problematic fields
        const { order, number, branch, ...restSemester } = sem;
        return restSemester;
      });
      
      await db.collection('semesters').insertMany(updatedSemesters);
      console.log(`Restored ${updatedSemesters.length} semesters without problematic fields`);
    }
    
    console.log('Semester schema fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing semester schema:', error);
    throw error;
  }
}

// Run the main function
main(); 