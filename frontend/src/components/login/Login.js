import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { TextField, Button, Box, Typography, InputAdornment, IconButton } from '@mui/material';
import { handleError, handleSuccess } from '../../utils';
import './Login.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Import assets
import GirlSvg from '../../assets/girl.svg';
import LogoSvg from '../../assets/logo.svg';
import PlantDark from '../../assets/Plant-1.svg';
import PlantLight from '../../assets/Plant.svg';

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

    const [loginInfo, setLoginInfo] = useState({
        email: '',
        password: ''
    })

    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(name, value);
        const copyLoginInfo = { ...loginInfo };
        copyLoginInfo[name] = value;
        setLoginInfo(copyLoginInfo);
    }

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const { email, password } = loginInfo;
        if (!email || !password) {
            return handleError('email and password are required')
        }
        try {
            const url = "http://localhost:8080/auth/login";
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginInfo)
            });
            const result = await response.json();
            const { success, message, jwtToken, name, error } = result;
            if (success) {
                handleSuccess(message);
                localStorage.setItem('token', jwtToken);
                localStorage.setItem('loggedInUser', name);
                setTimeout(() => {
                    navigate('/home')
                }, 1000)
            } else if (error) {
                const details = error?.details[0].message;
                handleError(details);
            } else if (!success) {
                handleError(message);
            }
            console.log(result);
        } catch (err) {
            handleError(err);
        }
    }

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

                <form onSubmit={handleLogin}>
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
                            value={loginInfo.email}
                            onChange={handleChange}
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
                            type={showPassword ? "text" : "password"}
                            value={loginInfo.password}
                            onChange={handleChange}
                            placeholder="*********"
                            variant="outlined"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography
                                            onClick={handleTogglePassword}
                                            sx={{
                                                cursor: 'pointer',
                                                color: '#666',
                                                fontSize: '14px',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                }
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