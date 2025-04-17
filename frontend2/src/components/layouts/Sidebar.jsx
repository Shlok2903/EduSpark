import React, { useState, useEffect } from 'react';
import { Typography, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import DescriptionIcon from '@mui/icons-material/Description';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PeopleIcon from '@mui/icons-material/People';
import LogoSvg from '../../assets/logo.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/actions/authActions';
import './Sidebar.css';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
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
        dispatch(logout());
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
                
                {/* Different course navigation for tutors vs students/admin */}
                {isTutor && !isAdmin ? (
                    <div className={`nav-item ${activeTab === '/courses' ? 'active' : ''}`} onClick={() => handleNavigation('/courses')}>
                        <SchoolIcon sx={{ fontSize: 20 }} />
                        <span>Manage Courses</span>
                    </div>
                ) : (
                    <>
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
                    </>
                )}
                
                {/* Admin and Tutor specific options */}
                {(isAdmin || isTutor) && (
                    <>
                        <div className={`nav-item ${activeTab === '/students' ? 'active' : ''}`} onClick={() => handleNavigation('/students')}>
                            <PeopleIcon sx={{ fontSize: 20 }} />
                            <span>Manage Students</span>
                        </div>
                    </>
                )}

                {isAdmin && (
                    <>
                        <div className={`nav-item ${activeTab === '/dashboard/courses/add' ? 'active' : ''}`} onClick={() => handleNavigation('/dashboard/courses/add')}>
                            <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
                            <span>Add Course</span>
                        </div>
                        <div className={`nav-item ${activeTab === '/exams/manage' ? 'active' : ''}`} onClick={() => handleNavigation('/exams/manage')}>
                            <LibraryBooksIcon sx={{ fontSize: 20 }} />
                            <span>Manage Exams</span>
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
                
                {/* Tutor specific options */}
                {isTutor && !isAdmin && (
                    <div className={`nav-item ${activeTab === '/exams/manage' ? 'active' : ''}`} onClick={() => handleNavigation('/exams/manage')}>
                        <LibraryBooksIcon sx={{ fontSize: 20 }} />
                        <span>Manage Exams</span>
                    </div>
                )}
            </nav>

            <div className="user-profile">
                <div className="profile-info" style={{ cursor: 'pointer' }} onClick={handleLogout}>
                    <Avatar 
                        sx={{ width: 40, height: 40 }}
                        alt={userName || 'User'}
                    >
                        {(userName || 'U').charAt(0).toUpperCase()}
                    </Avatar>
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