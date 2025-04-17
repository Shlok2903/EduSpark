const fs = require('fs');
const path = require('path');

// Create scripts directory if it doesn't exist
try {
  if (!fs.existsSync(path.join(__dirname, '..'))) {
    fs.mkdirSync(path.join(__dirname, '..'));
    console.log('Created scripts directory');
  }
} catch (error) {
  console.error('Error creating scripts directory:', error);
} 