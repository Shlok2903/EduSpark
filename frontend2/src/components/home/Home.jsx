import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  InputAdornment, 
  TextField,
  Card,
  CardContent,
  Grid,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import './Home.css';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const userName = localStorage.getItem('loggedInUser') || 'Student';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isTutor = localStorage.getItem('isTutor') === 'true';
  
  // Helper function to get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  return (
    <div className="home-page">
      <div className="header">
        <Typography variant="h4" className="page-title">
          {getGreeting()}, {userName}!
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Box className="search-container">
            <TextField
              placeholder="Search courses..."
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#37474F' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <div className="notification-button">
            <NotificationsIcon />
          </div>
        </Box>
      </div>
      
      <Box className="content-divider" />
      
      <div className="home-content">
        {/* Student Dashboard */}
        {!isAdmin && !isTutor && (
          <>
            <Typography variant="h5" className="section-title">
              Your Learning Dashboard
            </Typography>
            
            <Grid container spacing={3} className="dashboard-cards">
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container courses">
                      <LocalLibraryIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      My Courses
                    </Typography>
                    <Typography className="card-value">
                      5 Active Courses
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      View Courses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container assignments">
                      <AssignmentIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Pending Assignments
                    </Typography>
                    <Typography className="card-value">
                      3 Due This Week
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      View Assignments
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container achievements">
                      <EmojiEventsIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Achievements
                    </Typography>
                    <Typography className="card-value">
                      12 Badges Earned
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      View Achievements
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="h5" className="section-title mt-4">
              Continue Learning
            </Typography>
            
            <Grid container spacing={3} className="courses-list">
              {/* Placeholder for course progress cards */}
              <Grid item xs={12}>
                <Typography variant="body1" className="placeholder-text">
                  Your enrolled courses will appear here
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
        
        {/* Teacher Dashboard */}
        {isTutor && (
          <>
            <Typography variant="h5" className="section-title">
              Teacher Dashboard
            </Typography>
            
            <Grid container spacing={3} className="dashboard-cards">
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container courses">
                      <LocalLibraryIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      My Courses
                    </Typography>
                    <Typography className="card-value">
                      3 Active Courses
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      Manage Courses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container assignments">
                      <AssignmentIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Student Submissions
                    </Typography>
                    <Typography className="card-value">
                      8 Pending Review
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      Review Work
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
        
        {/* Admin Dashboard */}
        {isAdmin && (
          <>
            <Typography variant="h5" className="section-title">
              Admin Dashboard
            </Typography>
            
            <Grid container spacing={3} className="dashboard-cards">
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container users">
                      <LocalLibraryIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Platform Users
                    </Typography>
                    <Typography className="card-value">
                      254 Total Users
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      Manage Users
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container courses">
                      <AssignmentIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Platform Courses
                    </Typography>
                    <Typography className="card-value">
                      18 Active Courses
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                    >
                      Manage Courses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </div>
    </div>
  );
};

export default Home; 