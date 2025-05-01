import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  InputAdornment, 
  TextField,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import dashboardService from '../../services/dashboardService';
import './Home.css';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const userName = localStorage.getItem('loggedInUser') || 'Student';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isTutor = localStorage.getItem('isTutor') === 'true';
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    console.log('Dashboard data state:', dashboardData);
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboardData();
      console.log('Dashboard response:', response); // Debug log
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
        setDashboardData(null);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'An error occurred while fetching dashboard data');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
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
        {!isAdmin && !isTutor && dashboardData && (
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
                      {dashboardData.activeCourses} Active Courses
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/dashboard/courses')}
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
                      Pending Exams & Quizzes
                    </Typography>
                    <Typography className="card-value">
                      {dashboardData.pendingExams || 0} Pending
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/dashboard/exams')}
                    >
                      View Exams
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
                      {dashboardData.achievements.totalBadges} Badges Earned
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/dashboard/achievements')}
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
              {dashboardData.courseProgress.length > 0 ? (
                dashboardData.courseProgress.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course.courseId}>
                    <Card className="course-progress-card">
                      <CardContent>
                        <img 
                          src={course.imageUrl || 'https://via.placeholder.com/300x200?text=Course+Image'} 
                          alt={course.title}
                          className="course-image"
                        />
                        <Typography variant="h6" className="course-title">
                          {course.title}
                        </Typography>
                        <Typography variant="body2" className="course-description">
                          {course.description}
                        </Typography>
                        <Box className="progress-container">
                          <Box className="progress-bar" sx={{ width: `${course.progress}%` }} />
                          <Typography variant="body2" className="progress-text">
                            {course.progress}% Complete
                          </Typography>
                        </Box>
                        <Button 
                          variant="contained"
                          fullWidth
                          onClick={() => navigate(`/courses/${course.courseId}`)}
                        >
                          Continue Learning
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" className="placeholder-text">
                    You haven't enrolled in any courses yet
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/courses')}
                    sx={{ mt: 2 }}
                  >
                    Browse Courses
                  </Button>
                </Grid>
              )}
            </Grid>
          </>
        )}
        
        {/* Teacher Dashboard */}
        {isTutor && dashboardData && (
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
                      {dashboardData.activeCourses} Active Courses
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/dashboard/manage-courses')}
                    >
                      Manage Courses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container students">
                      <PeopleIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Total Students
                    </Typography>
                    <Typography className="card-value">
                      {dashboardData.totalStudents} Students
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/dashboard/students')}
                    >
                      View Students
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
                      Pending Reviews
                    </Typography>
                    <Typography className="card-value">
                      {dashboardData.pendingReviews} To Review
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/dashboard/reviews')}
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
        {isAdmin && dashboardData && (
          <>
            <Typography variant="h5" className="section-title">
              Admin Dashboard
            </Typography>
            
            <Grid container spacing={3} className="dashboard-cards">
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container users">
                      <PeopleIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Platform Users
                    </Typography>
                    <Typography className="card-value">
                      {dashboardData.totalUsers} Total Users
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/admin/users')}
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
                      <LocalLibraryIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Total Courses
                    </Typography>
                    <Typography className="card-value">
                      {dashboardData.totalCourses} Courses
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/admin/courses')}
                    >
                      Manage Courses
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="dashboard-card">
                  <CardContent>
                    <div className="card-icon-container enrollments">
                      <AssignmentIcon className="card-icon" />
                    </div>
                    <Typography variant="h6" className="card-title">
                      Total Enrollments
                    </Typography>
                    <Typography className="card-value">
                      {dashboardData.totalEnrollments} Enrollments
                    </Typography>
                    <Button 
                      variant="contained" 
                      className="card-action-btn"
                      color="primary"
                      onClick={() => navigate('/admin/enrollments')}
                    >
                      View Details
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