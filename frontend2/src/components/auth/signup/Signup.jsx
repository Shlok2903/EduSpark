import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  InputAdornment, 
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch } from 'react-redux';
import authService from '../../../services/authService';
import { handleError, handleSuccess } from '../../../utils/notifications';
import '../login/Login.css';
import './Signup.css';

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

function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redirect if already logged in
  const token = localStorage.getItem('jwtToken');
  if (token) {
    navigate('/home', { replace: true });
  }

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' // Default role
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare the data with the role
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isAdmin: formData.role === 'admin',
        isTutor: formData.role === 'tutor'
      };
      
      const result = await authService.register(userData);
      
      if (result.success) {
        handleSuccess('Registration successful! Please login.');
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        handleError(result.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during registration';
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear the error for the field being edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  return (
    <div className="login-container signup-container">
      <Navbar />
      
      <div className="login-left-decoration">
        <img src={PlantDark} alt="" className="plant-dark" />
        <img src={PlantLight} alt="" className="plant-light" />
      </div>

      <img src={GirlSvg} alt="" className="login-right-illustration" />
      
      <div className="login-form-container signup-form-container">
        <div className="login-header">
          <Typography 
            variant="h4" 
            className="login-title"
          >
            Create an Account
          </Typography>
          <Typography variant="body1" className="login-subtitle">
            Please enter your details to register
          </Typography>
        </div>

        <form onSubmit={handleSubmit}>
          <Box className="login-form-field">
            <Typography className="login-form-label">
              Full Name
            </Typography>
            <TextField
              fullWidth
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              variant="outlined"
              required
              className="login-text-field"
              error={!!errors.name}
              helperText={errors.name}
            />
          </Box>

          <Box className="login-form-field">
            <Typography className="login-form-label">
              Email
            </Typography>
            <TextField
              fullWidth
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="abc@xyz.com"
              variant="outlined"
              required
              className="login-text-field"
              error={!!errors.email}
              helperText={errors.email}
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
              onChange={handleChange}
              placeholder="*********"
              variant="outlined"
              required
              className="login-text-field"
              error={!!errors.password}
              helperText={errors.password}
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

          <Box className="login-form-field">
            <Typography className="login-form-label">
              Confirm Password
            </Typography>
            <TextField
              fullWidth
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="*********"
              variant="outlined"
              required
              className="login-text-field"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleConfirmPassword} edge="end">
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className="login-form-field">
            <FormControl component="fieldset">
              <FormLabel component="legend" className="login-form-label">
                Register as
              </FormLabel>
              <RadioGroup
                row
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <FormControlLabel value="student" control={<Radio />} label="Student" />
                <FormControlLabel value="tutor" control={<Radio />} label="Tutor" />
                <FormControlLabel value="admin" control={<Radio />} label="Admin" />
              </RadioGroup>
            </FormControl>
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            className="login-submit-button"
            sx={{ mt: 3 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
          </Button>

          <Box className="login-form-options" sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Login here
              </Link>
            </Typography>
          </Box>
        </form>
      </div>
    </div>
  );
}

export default Signup; 