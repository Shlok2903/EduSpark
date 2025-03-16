import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, adminOrTutorOnly = false }) => {
    const location = useLocation();
    const token = localStorage.getItem('jwtToken');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const isTutor = localStorage.getItem('isTutor') === 'true';

    if (!token) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for admin/tutor role if required
    if (adminOrTutorOnly && !isAdmin && !isTutor) {
        // Redirect to home if not authorized
        return <Navigate to="/home" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute; 