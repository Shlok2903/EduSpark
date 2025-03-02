import React from 'react';
import { Box, Typography, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AlertIcon from '../../assets/alert.svg';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/sidebar/Sidebar';

function Home() {
    const navigate = useNavigate();
    const userName = localStorage.getItem('loggedInUser');
    
    return (
        <div className="home-container">
            <Sidebar />

            {/* Main Content Area */}
            <div className="main-content">
                <div className="header">
                    <Typography variant="h4" className="page-title">
                        Welcome, {userName}!
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Box className="search-container">
                            <TextField
                                placeholder="Search any courses.."
                                variant="outlined"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#37474F' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                        <div className="alert-button">
                            <img src={AlertIcon} alt="Notifications" />
                        </div>
                    </Box>
                </div>
                <Box className="content-divider" />
            </div>
        </div>
    );
}

export default Home;