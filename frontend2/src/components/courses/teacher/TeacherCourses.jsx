import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Button, 
  CircularProgress,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api';
import CourseCard from '../CourseCard';
import './TeacherCourses.css';

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getAllCourses();
      
      if (response.data) {
        // For admins or tutors, show all courses
        // For regular tutors, filter to only show courses they created
        const isTutor = localStorage.getItem('isTutor') === 'true';
        
        if (isAdmin) {
          // Admin can see all courses
          setCourses(response.data);
        } else if (isTutor) {
          // Show all courses for tutors too, they can help with any course
          setCourses(response.data);
        } else {
          // Regular users only see courses they created
          const myCourses = response.data.filter(course => course.isCreator === true);
          setCourses(myCourses);
        }
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddCourse = () => {
    navigate('/dashboard/courses/add');
  };

  const handleManageCourse = (courseId) => {
    navigate(`/dashboard/courses/${courseId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" className="teacher-courses-container">
      <Box className="teacher-courses-header">
        <Typography variant="h4" className="page-title">
          {isAdmin ? "All Courses" : "My Courses"}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCourse}
          className="add-course-button"
        >
          Create New Course
        </Button>
      </Box>

      {error && (
        <Paper className="error-message">
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper className="courses-tabs-container">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          className="courses-tabs"
        >
          <Tab label="All Courses" />
          <Tab label="Published" />
          <Tab label="Draft" />
        </Tabs>
      </Paper>

      <Box className="courses-grid-container">
        {courses.length > 0 ? (
          <Grid container spacing={3}>
            {courses
              .filter(course => {
                // Filter based on active tab
                if (activeTab === 1) return course.status === 'published';
                if (activeTab === 2) return course.status === 'draft';
                return true; // Show all for tab 0
              })
              .map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <CourseCard
                    course={course}
                    userRole="teacher"
                    onManage={() => handleManageCourse(course.id)}
                    isCreator={course.isCreator}
                  />
                </Grid>
              ))}
          </Grid>
        ) : (
          <Box className="no-courses-message">
            <Typography variant="h6">
              No courses available.
            </Typography>
            <Typography variant="body1">
              Get started by creating your first course!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCourse}
              className="create-first-course-button"
            >
              Create Course
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default TeacherCourses; 