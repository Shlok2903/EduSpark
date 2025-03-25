import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../../store/slices/authSlice';
import authService from '../../services/authService';
import { CircularProgress, Box } from '@mui/material';

const AuthGuard = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      // If already authenticated in Redux, we're good
      if (isAuthenticated) {
        setIsLoading(false);
        return;
      }

      // Check if token exists in localStorage
      if (authService.isAuthenticated()) {
        try {
          // Validate token with server
          const { isValid, user } = await authService.checkAuthStatus();
          
          if (isValid && user) {
            // Restore user session in Redux
            dispatch(loginSuccess(user));
            setIsLoading(false);
          } else {
            // Token is invalid, redirect to login
            dispatch(logout());
            navigate('/login', { state: { from: location.pathname } });
          }
        } catch (error) {
          console.error('Auth validation error:', error);
          dispatch(logout());
          navigate('/login', { state: { from: location.pathname } });
        }
      } else {
        // No token found, redirect to login
        setIsLoading(false);
        navigate('/login', { state: { from: location.pathname } });
      }
    };

    checkAuth();
  }, [dispatch, isAuthenticated, location.pathname, navigate]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : null;
};

export default AuthGuard; 