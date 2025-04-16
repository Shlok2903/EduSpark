import api from './api';

// Set token in localStorage
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
    localStorage.setItem('isAdmin', String(userData.isAdmin === true));
    localStorage.setItem('isTutor', String(userData.isTutor === true));
    
    if (userData.id) {
      localStorage.setItem('userId', userData.id.toString());
    } else if (userData._id) {
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
      // Convert role flags to boolean if they're not already
      const isAdmin = response.isAdmin === true || response.isAdmin === 'true';
      const isTutor = response.isTutor === true || response.isTutor === 'true';
      
      // Store the JWT token and user data
      storeUserSession(response.jwtToken, {
        name: response.name,
        email: response.email,
        isAdmin: isAdmin,
        isTutor: isTutor,
        id: response.id || response._id
      });
      
      // Return a properly formatted response
      return {
        success: true,
        data: {
          name: response.name,
          email: response.email,
          isAdmin: isAdmin,
          isTutor: isTutor,
          id: response.id || response._id
        }
      };
    }
    
    return {
      success: false,
      message: response.message || 'Login failed'
    };
  } catch (error) {
    return {
      success: false,
      message: error.formattedMessage || 'An error occurred during login'
    };
  }
};

// Register user
const register = async (userData) => {
  try {
    // Determine which endpoint to use based on the role
    let endpoint = '/auth/signup';
    
    // For simplicity in this temporary implementation, we'll just use the signup endpoint
    // with the isAdmin and isTutor flags in the request body
    
    const response = await api.post(endpoint, userData);
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