/**
 * This script simply tests the MongoDB connection
 * 
 * To run: node scripts/testConnection.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Print environment variables (without sensitive data)
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGO_CONN exists:', !!process.env.MONGO_CONN);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to MongoDB successfully!');
    console.log('Database name:', mongoose.connection.name);
    
    // Test listing collections
    console.log('Attempting to list collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name).join(', '));
    
    console.log('Connection test passed successfully!');
  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
    process.exit(0);
  }
}

testConnection(); 