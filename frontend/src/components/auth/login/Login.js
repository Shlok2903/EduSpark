import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { TextField, Button, Box, Typography, InputAdornment, IconButton } from '@mui/material';
import { handleError, handleSuccess } from '../../../utils';
import './Login.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../../store/slices/authSlice';
import authService from '../../../services/authService';

// Import assets
import GirlSvg from '../../../assets/girl.svg';
import LogoSvg from '../../../assets/logo.svg';
import PlantDark from '../../../assets/Plant-1.svg';
import PlantLight from '../../../assets/Plant.svg';

// Add this new component for the navbar
const Navbar = () => (
    <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        zIndex: 1000
    }}>
        <img src={LogoSvg} alt="EduSpark Logo" style={{ height: 40 }} />
        <Box sx={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Typography 
                component={Link} 
                to="/" 
                sx={{ 
                    textDecoration: 'none', 
                    color: '#2c3e50',
                    fontSize: '16px'
                }}
            >
                Home
            </Typography>
            <Typography 
                component={Link} 
                to="/updates" 
                sx={{ 
                    textDecoration: 'none', 
                    color: '#2c3e50',
                    fontSize: '16px'
                }}
            >
                Updates
            </Typography>
            <Typography 
                component={Link} 
                to="/about" 
                sx={{ 
                    textDecoration: 'none', 
                    color: '#2c3e50',
                    fontSize: '16px'
                }}
            >
                About Us
            </Typography>
            <Button
                variant="contained"
                sx={{
                    backgroundColor: '#FDC886',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    textTransform: 'none',
                    fontSize: '16px',
                    boxShadow: 'none',
                    color: '#37474F',
                    '&:hover': {
                        backgroundColor: '#FDC886',
                        boxShadow: 'none'
                    }
                }}
            >
                Request Demo
            </Button>
        </Box>
    </Box>
);

function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const token = localStorage.getItem('jwtToken');
    if (token) {
        navigate('/home', { replace: true });
    }

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginStart());
        
        try {
            const result = await authService.login(formData);
            
            if (result.success) {
                handleSuccess('Login successful');
                dispatch(loginSuccess({ 
                    name: result.data.name, 
                    email: result.data.email,
                    isAdmin: result.data.isAdmin,
                    isTutor: result.data.isTutor,
                    id: result.data.id
                }));
                
                // Add a small delay before navigation
                setTimeout(() => {
                    navigate('/home');
                }, 1000);
            } else {
                handleError(result.message || 'Login failed');
                dispatch(loginFailure(result.message));
            }
        } catch (error) {
            handleError('An error occurred during login');
            dispatch(loginFailure('Login failed'));
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
                        sx={{ 
                            fontFamily: 'Nortica-SemiBold, sans-serif',
                            fontWeight: 600
                        }}
                    >
                        Student Login
                    </Typography>
                    <Typography variant="body1" className="login-subtitle">
                        Hey, Enter your details to get sign in
                        to your account
                    </Typography>
                </div>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                        <Typography 
                            sx={{ 
                                mb: 1,
                                color: '#2c3e50',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                }
                            }}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography 
                            sx={{ 
                                mb: 1,
                                color: '#2c3e50',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleTogglePassword}>
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{
                            mt: 2,
                            mb: 2,
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: '#FDC886',
                            textTransform: 'none',
                            fontSize: '16px',
                            boxShadow: 'none',
                            color: '#37474F',
                            '&:hover': {
                                backgroundColor: '#FDC886',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        Sign In
                    </Button>

                    <Typography 
                        variant="body2" 
                        align="center"
                        sx={{ color: '#666' }}
                    >
                        Having trouble in sign in?
                    </Typography>
                </form>
            </div>

            <footer className="footer">
                Copyright @EduSpark 2025 | <Link to="/privacy-policy">Privacy Policy</Link>
            </footer>
            
            <ToastContainer />
        </div>
    )
}

export default Login