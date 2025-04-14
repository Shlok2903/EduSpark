import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);
  
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
};

export default MainLayout; 