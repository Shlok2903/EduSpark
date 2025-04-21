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
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CourseCard from '../common/CourseCard';
import EnrollmentButton from '../common/EnrollmentButton';
import courseService from '../../../services/courseService';
import enrollmentService from '../../../services/enrollmentService';
import { handleError } from '../../../utils/notifications';
import authService from '../../../services/authService';
import branchService from '../../../services/branchService';
import semesterService from '../../../services/semesterService';
import './StudentCourses.css';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'enrolled'
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // Create a map of enrollment status for faster lookup
  const [enrollmentMap, setEnrollmentMap] = useState({});
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData.success) {
          setUser(userData.data);
          // If user has branch and semester assigned, use them without displaying filters
          if (userData.data.branchId) {
            setSelectedBranch(userData.data.branchId);
          }
          if (userData.data.semesterId) {
            setSelectedSemester(userData.data.semesterId);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Fetch branches and semesters
  useEffect(() => {
    const fetchBranchesAndSemesters = async () => {
      try {
        // If a branch is selected, fetch its semesters
        if (selectedBranch) {
          fetchSemestersByBranch(selectedBranch);
        }
      } catch (err) {
        console.error('Error fetching branches and semesters:', err);
        setError('Failed to load branch and semester data');
      }
    };
    
    fetchBranchesAndSemesters();
  }, [selectedBranch]);
  
  // Fetch semesters for a specific branch
  const fetchSemestersByBranch = async (branchId) => {
    try {
      const semestersResponse = await semesterService.getSemestersByBranch(branchId);
      if (semestersResponse.success) {
        setSemesters(semestersResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
    }
  };
  
  // Fetch courses when branch and semester are selected
  useEffect(() => {
    if (selectedBranch && selectedSemester) {
      fetchCoursesForStudent();
    } else if (!loading) {
      // If branch or semester not selected, fetch all courses
      fetchAllCourses();
    }
  }, [selectedBranch, selectedSemester]);
  
  // Fetch courses on component mount
  useEffect(() => {
    fetchAllCourses();
  }, []);
  
  // Fetch all courses
  const fetchAllCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all courses
      const coursesResponse = await courseService.getAllCourses();
      console.log("Courses response:", coursesResponse); // Debug
      
      // Check if it's the expected response structure
      if (Array.isArray(coursesResponse)) {
        // Direct array response (without success wrapper)
        setCourses(coursesResponse || []);
        console.log("Setting courses from array:", coursesResponse.length); // Debug
      } else if (coursesResponse && coursesResponse.success) {
        // Standard success/data wrapper
        setCourses(coursesResponse.data || []);
        console.log("Setting courses from success/data:", coursesResponse.data?.length); // Debug
      } else if (coursesResponse && Array.isArray(coursesResponse.data)) {
        // Just data property without success flag
        setCourses(coursesResponse.data);
        console.log("Setting courses from data property:", coursesResponse.data.length); // Debug
      } else {
        // Fallback error case
        console.error("Unexpected response format:", coursesResponse);
        setError('Failed to load courses - unexpected response format');
        return;
      }
      
      // Fetch enrolled courses - only proceed if we successfully set courses
      try {
        const enrollmentsResponse = await enrollmentService.getUserEnrollments();
        
        if (enrollmentsResponse && (enrollmentsResponse.success || Array.isArray(enrollmentsResponse.data))) {
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
      } catch (enrollErr) {
        console.error('Error fetching enrollments:', enrollErr);
        // Don't set the error state here, as we already have courses loaded
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
      handleError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch courses for student based on branch and semester
  const fetchCoursesForStudent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch student-specific courses
      const coursesResponse = await courseService.getCoursesForStudent(selectedBranch, selectedSemester);
      console.log("Student courses response:", coursesResponse); // Debug
      
      // Process based on response shape
      let allCourses = [];
      
      if (Array.isArray(coursesResponse)) {
        // Direct array
        allCourses = coursesResponse;
      } else if (coursesResponse && coursesResponse.success && coursesResponse.data) {
        if (Array.isArray(coursesResponse.data)) {
          // Data is an array
          allCourses = coursesResponse.data;
        } else {
          // Data is an object with course categories
          allCourses = [
            ...(coursesResponse.data.publicCourses || []),
            ...(coursesResponse.data.mandatoryCourses || []),
            ...(coursesResponse.data.optionalCourses || [])
          ];
        }
      } else if (coursesResponse && Array.isArray(coursesResponse.data)) {
        // Just data property
        allCourses = coursesResponse.data;
      } else {
        console.error("Unexpected student courses response format:", coursesResponse);
        setError('Failed to load student courses - unexpected response format');
        setLoading(false);
        return;
      }
      
      console.log("Setting student courses:", allCourses.length); // Debug
      setCourses(allCourses);
      
      // Fetch enrolled courses
      try {
        const enrollmentsResponse = await enrollmentService.getUserEnrollments();
        
        if (enrollmentsResponse && (enrollmentsResponse.success || Array.isArray(enrollmentsResponse.data))) {
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
      } catch (enrollErr) {
        console.error('Error fetching enrollments:', enrollErr);
        // Don't set error state for enrollment issues
      }
    } catch (err) {
      console.error('Error fetching courses for student:', err);
      setError('Failed to load courses. Please try again later.');
      handleError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedSemester]);
  
  // Filter courses based on search and tab selection - memoized to avoid recalculation
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // First apply search term filter
      const matchesSearch = 
        (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((course.createdBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      // Then apply tab filter
      if (filter === 'enrolled') {
        const courseId = course._id;
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
      
      {/* Error message - only show if not loading and has error */}
      {!loading && error && (
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
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" sx={{ color: '#78909C' }}>
                {filter === 'enrolled' 
                  ? "You haven't enrolled in any courses yet." 
                  : "No courses found. Try adjusting your search filters."}
              </Typography>
              {courses.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#b0bec5' }}>
                  There are {courses.length} courses available, but none match your current filters
                </Typography>
              )}
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Showing {filteredCourses.length} courses
              </Typography>
              <Grid 
                container 
                spacing={3} 
                justifyContent="flex-start"
                sx={{ px: 1 }}
              >
                {filteredCourses.map(course => {
                  const courseId = course._id;
                  return (
                    <Grid 
                      item 
                      xs={12} 
                      sm={6} 
                      md={4} 
                      lg={3} 
                      key={courseId || `course-${filteredCourses.indexOf(course)}`} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        mb: 3
                      }}
                    >
                      <CourseCard
                        course={{
                          id: courseId,
                          title: course.title || 'Untitled Course',
                          instructor: course.createdBy?.name || 'Unknown Instructor',
                          imageUrl: course.imageUrl,
                          isOptional: course.visibilityType === 'optional',
                          description: course.description || 'No description available'
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
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StudentCourses; 