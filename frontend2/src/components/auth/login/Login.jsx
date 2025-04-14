import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  InputAdornment, 
  IconButton 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../../store/slices/authSlice';
import authService from '../../../services/authService';
import { handleError, handleSuccess } from '../../../utils/notifications';
import './Login.css';

// Import assets
import GirlSvg from '../../../assets/girl.svg';
import LogoSvg from '../../../assets/logo.svg';
import PlantDark from '../../../assets/Plant-1.svg';
import PlantLight from '../../../assets/Plant.svg';

// Navbar component
const Navbar = () => (
  <Box className="login-navbar">
    <Box className="login-navbar-logo">
      <img src={LogoSvg} alt="EduSpark Logo" style={{ height: 40 }} />
    </Box>
    <Box className="login-navbar-links">
      <Typography 
        component={Link} 
        to="/" 
        className="login-navbar-link"
      >
        Home
      </Typography>
      <Typography 
        component={Link} 
        to="/updates" 
        className="login-navbar-link"
      >
        Updates
      </Typography>
      <Typography 
        component={Link} 
        to="/about" 
        className="login-navbar-link"
      >
        About Us
      </Typography>
      <Button
        variant="contained"
        className="login-navbar-button"
      >
        Request Demo
      </Button>
    </Box>
  </Box>
);

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redirect if already logged in
  const token = localStorage.getItem('jwtToken');
  if (token) {
    navigate('/home', { replace: true });
  }

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    dispatch(loginStart());
    
    try {
      const result = await authService.login(formData);
      
      if (result.success) {
        // First dispatch success to Redux
        dispatch(loginSuccess(result.data));
        
        // Show success message
        handleSuccess('Login successful! Redirecting...');
        
        // Set a small delay before navigation to allow the success message to be seen
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        dispatch(loginFailure(result.message));
        handleError(result.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during login';
      dispatch(loginFailure(errorMessage));
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <Navbar />
      
      <div className="login-left-decoration">
        <img src={PlantDark} alt="" className="plant-dark" />
        <img src={PlantLight} alt="" className="plant-light" />
      </div>

      <img src={GirlSvg} alt="" className="login-right-illustration" />
      
      <div className="login-form-container">
        <div className="login-header">
          <Typography 
            variant="h4" 
            className="login-title"
          >
            Student Login
          </Typography>
          <Typography variant="body1" className="login-subtitle">
            Hey, Enter your details to get sign in
            to your account
          </Typography>
        </div>

        <form onSubmit={handleSubmit}>
          <Box className="login-form-field">
            <Typography className="login-form-label">
              Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="abc@xyz.com"
              variant="outlined"
              required
              className="login-text-field"
            />
          </Box>

          <Box className="login-form-field">
            <Typography className="login-form-label">
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="*********"
              variant="outlined"
              required
              className="login-text-field"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className="login-form-options">
            <Typography 
              component={Link} 
              to="/forgot-password"
              className="login-forgot-password"
            >
              Forgot Password?
            </Typography>
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            className="login-submit-button"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <Box className="login-signup-prompt">
            <Typography component="span">
              Don't have an account?{' '}
              <Typography
                component={Link}
                to="/signup"
                className="login-signup-link"
              >
                Sign up
              </Typography>
            </Typography>
          </Box>
        </form>
      </div>
      
      <div className="login-footer">
        <Typography variant="body2">
          © {new Date().getFullYear()} EduSpark. All rights reserved.
        </Typography>
      </div>
      
      <ToastContainer />
    </div>
  );
}

export default Login; 