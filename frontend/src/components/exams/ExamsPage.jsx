import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Chip, 
  CircularProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { examService, courseService, enrollmentService } from '../../services/api';
import Sidebar from '../common/sidebar/Sidebar';
import { handleError, handleSuccess } from '../../utils';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import TimerIcon from '@mui/icons-material/Timer';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

function ExamsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isTutor = localStorage.getItem('isTutor') === 'true';
  const isTeacher = isAdmin || isTutor;
  
  // Debug logs
  console.log('User roles from localStorage:', { 
    isAdmin, 
    isTutor, 
    isTeacher,
    adminRaw: localStorage.getItem('isAdmin'),
    tutorRaw: localStorage.getItem('isTutor')
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let coursesList = [];
        
        // First try to get courses the user is enrolled in
        const enrolledCoursesResponse = await enrollmentService.getUserEnrollments();
        if (enrolledCoursesResponse && Array.isArray(enrolledCoursesResponse)) {
          coursesList = [...enrolledCoursesResponse];
        }
        
        // If user is a teacher/admin, also get courses they created
        if (isTeacher) {
          try {
            console.log('Fetching courses for teacher...');
            console.log('Current userId from localStorage:', localStorage.getItem('userId'));
            const createdCoursesResponse = await courseService.getAllCourses();
            
            if (createdCoursesResponse && Array.isArray(createdCoursesResponse)) {
              console.log('All available courses from API:', createdCoursesResponse);
              
              // Only add courses that aren't already in the list
              const existingCourseIds = new Set(coursesList.map(course => 
                course.courseId?._id || course.courseId
              ));
              
              // More flexible comparison for teacher's courses
              const userId = localStorage.getItem('userId');
              const teacherCourses = createdCoursesResponse
                .filter(course => {
                  // Log each course's creator for debugging
                  const courseCreatorId = course.createdBy?._id || course.createdBy;
                  console.log('Course:', course.title, 'Creator:', courseCreatorId, 'Current user:', userId);
                  
                  // More flexible comparison (string or object ID)
                  return courseCreatorId && (
                    courseCreatorId.toString() === userId ||
                    courseCreatorId === userId
                  );
                })
                .filter(course => !existingCourseIds.has(course._id))
                .map(course => ({
                  courseId: course
                }));
              
              console.log('Filtered teacher courses:', teacherCourses);
              coursesList = [...coursesList, ...teacherCourses];
            }
          } catch (error) {
            console.error('Error fetching teacher courses:', error);
          }
        }
        
        setCourses(coursesList);
        console.log('All available courses:', coursesList);
        
        // Select the first course by default
        if (coursesList.length > 0) {
          const firstCourse = coursesList[0];
          const courseId = firstCourse.courseId?._id || firstCourse.courseId;
          setSelectedCourse(courseId);
          fetchExamsForCourse(courseId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        handleError('Failed to fetch courses');
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isTeacher]);

  const fetchExamsForCourse = async (courseId) => {
    setLoading(true);
    try {
      const response = await examService.getCourseExams(courseId);
      if (response) {
        setExams(response);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      handleError('Failed to fetch exams for this course');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (event, newValue) => {
    const course = courses[newValue];
    console.log('Selected course:', course);
    
    // Handle different course data formats
    let courseId;
    if (course.courseId?._id) {
      courseId = course.courseId._id;
    } else if (course.courseId && typeof course.courseId === 'object') {
      courseId = course.courseId._id;
    } else {
      courseId = course.courseId || course._id;
    }
    
    console.log('Extracted courseId:', courseId);
    
    setSelectedCourse(courseId);
    setTabValue(newValue);
    fetchExamsForCourse(courseId);
  };

  const handleCreateExam = () => {
    if (!selectedCourse) {
      // If no course is selected but we have courses, use the first one
      if (courses.length > 0) {
        const course = courses[0];
        // Handle different course data formats
        let courseId;
        if (course.courseId?._id) {
          courseId = course.courseId._id;
        } else if (course.courseId && typeof course.courseId === 'object') {
          courseId = course.courseId._id;
        } else {
          courseId = course.courseId || course._id;
        }
        
        console.log('No course selected, using first course:', courseId);
        navigate(`/exams/create/${courseId}`);
      } else {
        handleError('Please select a course first');
      }
    } else {
      console.log('Using selected course for exam creation:', selectedCourse);
      navigate(`/exams/create/${selectedCourse}`);
    }
  };

  const handleEditExam = (examId) => {
    navigate(`/exams/edit/${examId}`);
  };

  const handleDeleteExam = (examId) => {
    setConfirmDelete(examId);
  };

  const confirmDeleteExam = async () => {
    if (!confirmDelete) return;
    
    try {
      await examService.deleteExam(confirmDelete);
      handleSuccess('Exam deleted successfully');
      setExams(exams.filter(exam => exam._id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting exam:', error);
      handleError('Failed to delete exam. It may have already been attempted by students.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      setLoading(true);
      const response = await examService.startExam(examId);
      
      if (response && response.attempt) {
        // Navigate to the exam session
        navigate(`/exams/session/${response.attempt._id}`);
      } else if (response && response.attemptId) {
        handleError('You have already completed this exam');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      handleError(error.formattedMessage || 'Failed to start exam. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (examId) => {
    navigate(`/exams/results/${examId}`);
  };

  const handleContinueExam = (attemptId) => {
    navigate(`/exams/session/${attemptId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExamActive = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    return now >= startTime && now <= endTime;
  };

  const getExamStatusColor = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (now < startTime) {
      return '#FFA000'; // Upcoming - amber
    } else if (now <= endTime) {
      return '#4CAF50'; // Active - green
    } else {
      return '#F44336'; // Expired - red
    }
  };

  const getExamStatusText = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (now < startTime) {
      return 'Upcoming';
    } else if (now <= endTime) {
      return 'Active';
    } else {
      return 'Expired';
    }
  };

  const getAttemptStatusText = (status) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'timed-out':
        return 'Timed Out';
      case 'graded':
        return 'Graded';
      default:
        return 'Not Started';
    }
  };

  const getAttemptStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return '#FFC107'; // amber
      case 'submitted':
        return '#2196F3'; // blue
      case 'timed-out':
        return '#FF5722'; // deep orange
      case 'graded':
        return '#4CAF50'; // green
      default:
        return '#9E9E9E'; // grey
    }
  };

  const renderExamCard = (exam) => {
    const isActive = isExamActive(exam);
    const statusColor = getExamStatusColor(exam);
    const statusText = getExamStatusText(exam);
    const hasInProgressAttempt = exam.attemptStatus === 'in-progress';
    const isCompleted = ['submitted', 'timed-out', 'graded'].includes(exam.attemptStatus);
    
    return (
      <Card
        key={exam._id}
        sx={{
          mb: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          border: `1px solid ${statusColor}`,
          borderRadius: '10px',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {exam.title}
            </Typography>
            <Chip 
              label={statusText} 
              sx={{ 
                bgcolor: statusColor, 
                color: 'white',
                fontWeight: 500
              }}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {exam.description || 'No description provided'}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon sx={{ mr: 1, color: '#757575', fontSize: 18 }} />
                <Typography variant="body2">
                  Start: {formatDate(exam.startTime)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon sx={{ mr: 1, color: '#757575', fontSize: 18 }} />
                <Typography variant="body2">
                  End: {formatDate(exam.endTime)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon sx={{ mr: 1, color: '#757575', fontSize: 18 }} />
                <Typography variant="body2">
                  Duration: {exam.duration} minutes
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon sx={{ mr: 1, color: '#757575', fontSize: 18 }} />
                <Typography variant="body2">
                  Total Marks: {exam.totalMarks}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {exam.attemptStatus && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Your attempt status: 
                <span style={{ color: getAttemptStatusColor(exam.attemptStatus), marginLeft: '8px' }}>
                  {getAttemptStatusText(exam.attemptStatus)}
                </span>
              </Typography>
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
          {isTeacher ? (
            <>
              <Button 
                variant="outlined" 
                onClick={() => navigate(`/exams/view/${exam._id}`)}
              >
                View Details
              </Button>
              
              <Box>
                <Tooltip title="Edit Exam">
                  <IconButton 
                    color="primary" 
                    onClick={() => handleEditExam(exam._id)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete Exam">
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteExam(exam._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          ) : hasInProgressAttempt ? (
            <Button 
              variant="contained"
              onClick={() => handleContinueExam(exam.attemptId)}
              fullWidth
              sx={{ 
                bgcolor: '#FFC107', 
                color: '#333',
                '&:hover': { bgcolor: '#FFB300' }
              }}
            >
              Continue Exam
            </Button>
          ) : isCompleted ? (
            <Button 
              variant="outlined"
              onClick={() => navigate(`/exams/attempt/${exam.attemptId}`)}
              fullWidth
            >
              View Your Submission
            </Button>
          ) : (
            <Button 
              variant="contained" 
              disabled={!isActive}
              onClick={() => handleStartExam(exam._id)}
              fullWidth
              sx={{ 
                bgcolor: isActive ? '#4CAF50' : '#e0e0e0',
                '&:hover': { bgcolor: isActive ? '#388E3C' : '#e0e0e0' }
              }}
            >
              {isActive ? 'Start Exam' : 
                (new Date() < new Date(exam.startTime) ? 'Not Started Yet' : 'Exam Ended')}
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <div className="home-container">
      <Sidebar />
      <div className="main-content">
        <Box className="header">
          <Typography variant="h4" className="page-title">
            Exams
          </Typography>
          {console.log('Create exam button conditions:', { isTeacher, selectedCourse, courses: courses.length })}
          {isTeacher && (courses.length > 0) && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateExam}
              sx={{ 
                backgroundColor: '#F3B98D', 
                color: '#37474F',
                '&:hover': { backgroundColor: '#f0aa75' },
              }}
            >
              Create Exam
            </Button>
          )}
        </Box>

        <Box className="content-divider" />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {courses.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {isTeacher ? (
                  <>
                    You don't have any courses yet. To create exams, first 
                    <Button color="primary" onClick={() => navigate('/courses/create')} sx={{ mx: 1 }}>
                      Create a Course
                    </Button>
                    and then return here to create exams for that course.
                  </>
                ) : (
                  'You are not enrolled in any courses. Please enroll in a course to access exams.'
                )}
              </Alert>
            ) : (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleCourseChange}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {courses.map((course, index) => {
                      // Extract course title, handling different data structures
                      let courseTitle;
                      if (course.courseId?.title) {
                        courseTitle = course.courseId.title;
                      } else if (typeof course.courseId === 'object' && course.courseId) {
                        courseTitle = course.courseId.title || 'Untitled Course';
                      } else if (course.title) {
                        courseTitle = course.title;
                      } else {
                        courseTitle = 'Unknown Course';
                      }
                      
                      return (
                        <Tab 
                          key={index}
                          label={courseTitle}
                        />
                      );
                    })}
                  </Tabs>
                </Box>
                
                {selectedCourse && (
                  <>
                    {exams.length === 0 ? (
                      <Alert severity="info">
                        {isTeacher 
                          ? 'No exams found for this course. Click "Create Exam" to add a new exam.' 
                          : 'No exams available for this course yet.'
                        }
                      </Alert>
                    ) : (
                      <Box>
                        {exams.map(renderExamCard)}
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Delete Exam</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this exam? This action cannot be undone.
          <br /><br />
          <Alert severity="warning">
            If students have already attempted this exam, you will not be able to delete it.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button onClick={confirmDeleteExam} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ExamsPage; 