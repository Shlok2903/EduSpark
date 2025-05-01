import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Button, 
  CircularProgress,
  Paper,
  Divider,
  ButtonGroup
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  PersonAdd as AssignIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/api';
import CourseCard from '../common/CourseCard';
import './ManageCourses.css';
import { toast } from 'react-toastify';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isTutor = localStorage.getItem('isTutor') === 'true';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      
      // If admin, get all courses, else get only tutor's courses
      if (isAdmin) {
        response = await courseService.getAllCourses();
      } else {
        response = await courseService.getCoursesByTutor(userId);
      }
      
      if (response.success && response.data) {
        setCourses(response.data);
      } else if (Array.isArray(response)) {
        setCourses(response);
      } else if (response.data && Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        setError('Failed to load courses - unexpected data format');
      }
    } catch (err) {
      setError('Failed to fetch courses: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    navigate('/dashboard/courses/add');
  };

  const handleEditCourse = (courseId) => {
    navigate(`/dashboard/courses/${courseId}`);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone and will remove all sections, modules, and student enrollment data.')) {
      try {
        setLoading(true);
        await courseService.deleteCourse(courseId);
        toast.success('Course deleted successfully');
        fetchCourses();
      } catch (error) {
        toast.error('Failed to delete course: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignCourse = (courseId) => {
    navigate(`/dashboard/courses/${courseId}/assign`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" className="manage-courses-container">
      <Box className="page-header">
        <Typography variant="h4" className="page-title">
          {isAdmin ? "Manage All Courses" : "Manage My Courses"}
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

      <Divider className="section-divider" />

      <Box className="courses-grid-container">
        {courses.length > 0 ? (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Box className="course-card-wrapper">
                  <CourseCard
                    course={{
                      id: course._id,
                      title: course.title,
                      description: course.description,
                      imageUrl: course.imageUrl,
                      instructor: course.createdBy?.name || "Unknown Instructor",
                      isOptional: course.visibilityType === 'optional'
                    }}
                    userRole="teacher"
                  />
                  <Box className="course-actions">
                    <ButtonGroup 
                      variant="outlined" 
                      fullWidth
                      className="action-buttons"
                    >
                      <Button 
                        startIcon={<EditIcon />}
                        onClick={() => handleEditCourse(course._id)}
                        className="edit-button"
                      >
                        Edit
                      </Button>
                    
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteCourse(course._id)}
                        className="delete-button"
                      >
                        Delete
                      </Button>
                    </ButtonGroup>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box className="no-courses-message">
            <Typography variant="h6">
              {isAdmin 
                ? "No courses have been created yet." 
                : "You haven't created any courses yet."}
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

export default ManageCourses; 