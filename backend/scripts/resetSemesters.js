/**
 * This script completely resets the semesters collection
 * WARNING: This will delete all semester data
 * 
 * To run: node scripts/resetSemesters.js
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
    
    // Execute the reset
    await resetSemesters();
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

async function resetSemesters() {
  const db = mongoose.connection.db;
  
  try {
    console.log('Starting semester reset...');
    console.log('Using database:', mongoose.connection.name);
    
    // Log available collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // Check if semesters collection exists
    const semesterExists = collections.some(c => c.name === 'semesters');
    
    if (semesterExists) {
      console.log('Semesters collection exists, dropping it...');
      
      // Explicitly drop the problematic index first if it exists
      try {
        await db.collection('semesters').dropIndex('branch_1_number_1');
        console.log('Dropped problematic branch_1_number_1 index');
      } catch (indexError) {
        // Index might not exist, so it's okay if this fails
        console.log('Note: branch_1_number_1 index not found or already dropped');
      }
      
      // Drop the collection
      await db.collection('semesters').drop();
      console.log('Semesters collection dropped');
      
      // Create a new clean collection
      await db.createCollection('semesters');
      console.log('Created new empty semesters collection');
      
      // Add only necessary indexes (branchId only, no compound indexes)
      await db.collection('semesters').createIndex({ branchId: 1 });
      console.log('Added appropriate indexes');
      
      console.log('Semester reset completed successfully!');
    } else {
      console.log('Semesters collection does not exist. Creating it...');
      
      // Create the collection
      await db.createCollection('semesters');
      console.log('Created semesters collection');
      
      // Add appropriate indexes (branchId only, no compound indexes)
      await db.collection('semesters').createIndex({ branchId: 1 });
      console.log('Added appropriate indexes');
      
      console.log('Semester collection created successfully!');
    }
  } catch (error) {
    console.error('Error resetting semesters:', error);
    throw error;
  }
}

// Run the main function
main(); 