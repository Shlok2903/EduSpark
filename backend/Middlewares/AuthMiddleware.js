const jwt = require('jsonwebtoken');
const UserModel = require('../Models/User');

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Invalid token format.' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log
    
    // Check for user ID in token (handle both id and _id properties)
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token structure. User ID not found.' });
    }
    
    // Get user from database to ensure they still exist and have proper roles
    const user = await UserModel.findById(userId).select('-password');
    
    if (!user) {
      console.log('User not found with ID:', userId); // Debug log
      return res.status(401).json({ message: 'User not found or deleted.' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    console.error('Error verifying token:', error);
    return res.status(500).json({ message: 'Authentication error.', error: error.message });
  }
};

// Middleware to check if user is an admin
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required' });
  }
  
  next();
};

// Middleware to check if user is a tutor
exports.isTutor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isTutor && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Teacher privileges required' });
  }
  
  next();
}; 