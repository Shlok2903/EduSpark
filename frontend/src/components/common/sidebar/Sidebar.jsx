import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
// Update the logo import path to match your assets directory
import LogoSvg from '../../../assets/logo.svg';  // Adjust this path
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const userName = localStorage.getItem('loggedInUser');
    const userEmail = localStorage.getItem('userEmail');
    
    const [activeTab, setActiveTab] = useState('/home');

    useEffect(() => {
        setActiveTab(location.pathname);
    }, [location]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        window.location.reload();
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="sidebar">
            <div className="logo-container">
                <img src={LogoSvg} alt="EduSpark Logo" className="logo" />
            </div>

            <nav className="nav-menu">
                <div className={`nav-item ${activeTab === '/home' ? 'active' : ''}`} onClick={() => handleNavigation('/home')}>
                    <HomeIcon sx={{ fontSize: 20 }} />
                    <span>Home</span>
                </div>
                <div className={`nav-item ${activeTab === '/courses' ? 'active' : ''}`} onClick={() => handleNavigation('/courses')}>
                    <SchoolIcon sx={{ fontSize: 20 }} />
                    <span>Courses</span>
                </div>
                <div className={`nav-item ${activeTab === '/results' ? 'active' : ''}`} onClick={() => handleNavigation('/results')}>
                    <AssessmentIcon sx={{ fontSize: 20 }} />
                    <span>Results</span>
                </div>
            </nav>

            <div className="user-profile">
                <div className="profile-info" style={{ cursor: 'pointer' }} onClick={handleLogout}>
                    <img 
                        src="https://via.placeholder.com/40" 
                        alt="Profile" 
                        className="profile-pic"
                    />
                    <div className="user-details">
                        <Typography className="user-name">{userName || 'User'}</Typography>
                        <Typography className="user-email">{userEmail || 'user@example.com'}</Typography>
                    </div>
                    <div className="logout-button">
                        <LogoutIcon sx={{ fontSize: 20, cursor: 'pointer' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar; 