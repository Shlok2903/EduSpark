import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  InputAdornment, 
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CourseCard from '../common/CourseCard';
import EnrollmentButton from '../common/EnrollmentButton';
import courseService from '../../../services/courseService';
import enrollmentService from '../../../services/enrollmentService';
import { handleError } from '../../../utils/notifications';
import './StudentCourses.css';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'enrolled'
  const [error, setError] = useState('');
  // Create a map of enrollment status for faster lookup
  const [enrollmentMap, setEnrollmentMap] = useState({});
  
  // Fetch courses on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all courses
      const coursesResponse = await courseService.getAllCourses();
      
      if (coursesResponse.success) {
        setCourses(coursesResponse.data || []);
        
        // Fetch enrolled courses
        const enrollmentsResponse = await enrollmentService.getUserEnrollments();
        
        if (enrollmentsResponse.success) {
          const enrollments = enrollmentsResponse.data || [];
          setEnrolledCourses(enrollments);
          
          // Create a map for faster enrollment checking
          const newEnrollmentMap = {};
          enrollments.forEach(enrollment => {
            // Handle both populated courseId objects and direct courseId references
            const courseId = enrollment.courseId?._id || enrollment.courseId;
            if (courseId) {
              newEnrollmentMap[courseId] = {
                isEnrolled: true,
                progress: enrollment.progress || 0
              };
            }
          });
          setEnrollmentMap(newEnrollmentMap);
        }
      } else {
        setError(coursesResponse.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      handleError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Filter courses based on search and tab selection - memoized to avoid recalculation
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // First apply search term filter
      const matchesSearch = 
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tutor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Then apply tab filter
      if (filter === 'enrolled') {
        const courseId = course._id || course.id;
        return enrollmentMap[courseId]?.isEnrolled;
      }
      
      return true;
    });
  }, [courses, searchTerm, filter, enrollmentMap]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setFilter(newValue);
  };
  
  // Get enrollment status of a course - optimized with map lookup
  const isEnrolled = useCallback((courseId) => {
    return !!enrollmentMap[courseId]?.isEnrolled;
  }, [enrollmentMap]);
  
  // Get progress for a course - optimized with map lookup
  const getProgress = useCallback((courseId) => {
    return enrollmentMap[courseId]?.progress || 0;
  }, [enrollmentMap]);
  
  // Handle enrollment change
  const handleEnrollmentChange = useCallback((courseId) => {
    // Update the enrollment map directly
    setEnrollmentMap(prev => ({
      ...prev,
      [courseId]: {
        isEnrolled: true,
        progress: 0
      }
    }));
  }, []);
  
  return (
    <div className="student-courses-page">
      {/* Header section */}
      <div className="header">
        <Typography variant="h4" className="page-title">
          Courses
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Box className="search-container">
            <TextField
              placeholder="Search courses..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
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
      
      {/* Tabs for filtering courses */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={filter} 
          onChange={handleTabChange}
          className="course-tabs"
        >
          <Tab value="all" label="All Courses" />
          <Tab value="enrolled" label="My Enrolled Courses" />
        </Tabs>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Courses grid */}
          {filteredCourses.length === 0 ? (
            <Typography 
              variant="body1" 
              sx={{ textAlign: 'center', py: 6, color: '#78909C' }}
            >
              {filter === 'enrolled' 
                ? "You haven't enrolled in any courses yet." 
                : "No courses found."}
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filteredCourses.map(course => {
                const courseId = course._id || course.id;
                return (
                  <Grid item xs={12} sm={6} md={4} key={courseId}>
                    <CourseCard
                      course={{
                        id: courseId,
                        title: course.title,
                        instructor: course.tutor || 'Unknown Instructor',
                        imageUrl: course.imageUrl,
                        isOptional: course.isOptional,
                        description: course.description
                      }}
                      isEnrolled={isEnrolled(courseId)}
                      progress={getProgress(courseId)}
                      userRole="student"
                      action={
                        <EnrollmentButton
                          courseId={courseId}
                          isEnrolled={isEnrolled(courseId)}
                          onEnrollmentChange={() => handleEnrollmentChange(courseId)}
                        />
                      }
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}
    </div>
  );
};

export default StudentCourses; 