import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import DescriptionIcon from '@mui/icons-material/Description';
// Update the logo import path to match your assets directory
import LogoSvg from '../../../assets/logo.svg';  // Adjust this path
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const userName = localStorage.getItem('loggedInUser');
    const userEmail = localStorage.getItem('userEmail');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const isTutor = localStorage.getItem('isTutor') === 'true';
    
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
                <div className={`nav-item ${activeTab === '/practice' ? 'active' : ''}`} onClick={() => handleNavigation('/practice')}>
                    <QuizIcon sx={{ fontSize: 20 }} />
                    <span>Practice</span>
                </div>
                <div className={`nav-item ${activeTab === '/exams' ? 'active' : ''}`} onClick={() => handleNavigation('/exams')}>
                    <DescriptionIcon sx={{ fontSize: 20 }} />
                    <span>Exams</span>
                </div>
                <div className={`nav-item ${activeTab === '/results' ? 'active' : ''}`} onClick={() => handleNavigation('/results')}>
                    <AssessmentIcon sx={{ fontSize: 20 }} />
                    <span>Results</span>
                </div>
                
                {/* Admin and Tutor specific options */}
                {(isAdmin || isTutor) && (
                    <>
                        <div className={`nav-item ${activeTab === '/add-course' ? 'active' : ''}`} onClick={() => handleNavigation('/add-course')}>
                            <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                            <span>Add Course</span>
                        </div>
                    </>
                )}
                
                {/* Admin specific options */}
                {isAdmin && (
                    <div className={`nav-item ${activeTab === '/admin-dashboard' ? 'active' : ''}`} onClick={() => handleNavigation('/admin-dashboard')}>
                        <DashboardIcon sx={{ fontSize: 20 }} />
                        <span>Admin Dashboard</span>
                    </div>
                )}
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