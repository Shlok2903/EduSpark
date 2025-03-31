import api from './api';

// Set token in localStorage with proper format
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('jwtToken', token);
  } else {
    localStorage.removeItem('jwtToken');
  }
};

// Store user information in local storage
const storeUserSession = (token, userData) => {
  if (token) {
    localStorage.setItem('jwtToken', token);
  }
  
  if (userData) {
    localStorage.setItem('loggedInUser', userData.name || '');
    localStorage.setItem('userEmail', userData.email || '');
    localStorage.setItem('isAdmin', userData.isAdmin || false);
    localStorage.setItem('isTutor', userData.isTutor || false);
    
    // Ensure we're storing the user ID in a consistent format
    if (userData.id) {
      // Log for debugging
      console.log('Storing user ID:', userData.id);
      localStorage.setItem('userId', userData.id.toString());
    } else if (userData._id) {
      console.log('Storing user _id:', userData._id);
      localStorage.setItem('userId', userData._id.toString());
    }
  }
};

// Get user info from localStorage
const getUserData = () => {
  return {
    name: localStorage.getItem('loggedInUser'),
    email: localStorage.getItem('userEmail'),
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isTutor: localStorage.getItem('isTutor') === 'true',
    id: localStorage.getItem('userId')
  };
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem('jwtToken');
};

// Login user
const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    if (response.success) {
      // Store the JWT token and user data
      storeUserSession(response.jwtToken, {
        name: response.name,
        email: response.email,
        isAdmin: response.isAdmin,
        isTutor: response.isTutor,
        id: response.id || response._id
      });
      
      // Return a properly formatted response
      return {
        success: true,
        data: {
          name: response.name,
          email: response.email,
          isAdmin: response.isAdmin,
          isTutor: response.isTutor,
          id: response.id || response._id
        }
      };
    }
    
    return {
      success: false,
      message: response.message || 'Login failed'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.formattedMessage || 'An error occurred during login'
    };
  }
};

// Register user
const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return { success: true, data: response };
  } catch (error) {
    return { 
      success: false, 
      message: error.formattedMessage || 'An error occurred during registration' 
    };
  }
};

// Logout user
const logout = () => {
  // Clear all auth-related data
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('isTutor');
  localStorage.removeItem('userId');
  
  // Redirect to login
  window.location.href = '/login';
};

// Check auth status (validate token with server)
const checkAuthStatus = async () => {
  try {
    if (!isAuthenticated()) {
      return { isValid: false };
    }
    
    // Call an endpoint that requires authentication
    const response = await api.get('/auth/validate');
    return { isValid: true, user: response.user };
  } catch (error) {
    // If we get a 401/403, token is invalid
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logout();
      return { isValid: false, message: 'Your session has expired. Please login again.' };
    }
    return { isValid: false, message: 'Could not validate authentication status.' };
  }
};

const authService = {
  login,
  register,
  logout,
  isAuthenticated,
  getUserData,
  checkAuthStatus,
  setAuthToken,
  storeUserSession
};

export default authService; 