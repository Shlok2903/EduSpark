import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import authService from '../services/authService';

const PrivateRoute = ({ children, adminOrTutorOnly = false }) => {
    const location = useLocation();
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const user = useSelector(state => state.auth.user);
    
    // First check if user is authenticated
    if (!isAuthenticated && !authService.isAuthenticated()) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // If we need to check for admin/tutor role
    if (adminOrTutorOnly) {
        const isAdmin = user ? user.isAdmin : localStorage.getItem('isAdmin') === 'true';
        const isTutor = user ? user.isTutor : localStorage.getItem('isTutor') === 'true';
        
        if (!isAdmin && !isTutor) {
            // Redirect to home if not authorized
            return <Navigate to="/home" state={{ from: location.pathname }} replace />;
        }
    }

    return children;
};

export default PrivateRoute; 