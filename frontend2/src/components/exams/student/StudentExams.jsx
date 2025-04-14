import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  History as HistoryIcon,
  PlayArrow as StartIcon,
  School as CourseIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import courseService from '../../../services/courseService';
import enrollmentService from '../../../services/enrollmentService';
import './StudentExams.css';

const StudentExams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get enrolled courses
      const coursesResponse = await enrollmentService.getUserEnrollments();
      if (coursesResponse.data) {
        setEnrolledCourses(coursesResponse.data);
        
        // Get available exams for each enrolled course
        const examPromises = coursesResponse.data.map(course => {
          // Make sure we're using the correct string ID
          const courseId = course.courseId && typeof course.courseId === 'object' 
            ? course.courseId._id 
            : (course.courseId || course._id);
            
          return examService.getExamsByCourse(courseId);
        });
        
        const examResponses = await Promise.all(examPromises);
        const allExams = examResponses.flat().filter(exam => exam && exam.isPublished);
        
        setExams(allExams);
        
        // Get user's exam attempts
        const attemptsResponse = await examService.getMyAttempts();
        if (attemptsResponse) {
          setAttempts(attemptsResponse);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Could not load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStartExam = (examId) => {
    navigate(`/exams/take/${examId}`);
  };

  const handleViewResult = (attemptId) => {
    navigate(`/exams/result/${attemptId}`);
  };

  const getCourseName = (courseId) => {
    if (!courseId) return 'Unknown Course';
    
    // Try to find the enrollment with this course ID
    const enrollment = enrolledCourses.find(e => {
      // Handle different possible formats of courseId
      const eCourseId = e.courseId && typeof e.courseId === 'object' 
        ? e.courseId._id 
        : (e.courseId || e._id);
        
      return eCourseId === courseId || eCourseId === courseId.toString();
    });
    
    // Check if enrollment has course details
    if (enrollment && enrollment.course && enrollment.course.title) {
      return enrollment.course.title;
    }
    
    // Check if enrollment itself has a title
    if (enrollment && enrollment.title) {
      return enrollment.title;
    }
    
    // Fallback
    return 'Unknown Course';
  };

  const getExamStatus = (exam) => {
    const examAttempts = attempts.filter(a => a.examId === exam._id || a.examId === exam.id);
    
    if (examAttempts.length === 0) {
      return { status: 'not-attempted', label: 'Not Attempted' };
    }
    
    const latestAttempt = examAttempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
    
    if (latestAttempt.status === 'completed') {
      const isPassed = latestAttempt.score >= exam.passingMarks;
      return { 
        status: isPassed ? 'passed' : 'failed', 
        label: isPassed ? 'Passed' : 'Failed',
        attempt: latestAttempt
      };
    }
    
    return { status: 'in-progress', label: 'In Progress', attempt: latestAttempt };
  };

  const getAvailableExams = () => {
    return exams.filter(exam => {
      const status = getExamStatus(exam);
      return status.status === 'not-attempted' || status.status === 'failed';
    });
  };

  const getCompletedExams = () => {
    return exams.filter(exam => {
      const status = getExamStatus(exam);
      return status.status === 'passed';
    });
  };

  const renderExamList = (examsToRender) => {
    if (examsToRender.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No exams available in this category.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3} className="exams-grid">
        {examsToRender.map(exam => {
          const status = getExamStatus(exam);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={exam._id}>
              <Card className={`exam-card ${status.status}`}>
                <CardContent>
                  <Box className="exam-header">
                    <Typography variant="h6" className="exam-title">
                      {exam.title}
                    </Typography>
                    <Chip 
                      label={status.label}
                      className={`status-chip ${status.status}`}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" className="exam-description">
                    {exam.description || 'No description provided'}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box className="exam-details">
                    <Box className="detail-item">
                      <CourseIcon fontSize="small" />
                      <Typography variant="body2">
                        {getCourseName(exam.courseId)}
                      </Typography>
                    </Box>
                    
                    <Box className="detail-item">
                      <TimeIcon fontSize="small" />
                      <Typography variant="body2">
                        {exam.duration} minutes
                      </Typography>
                    </Box>
                    
                    <Box className="detail-item">
                      <AssignmentIcon fontSize="small" />
                      <Typography variant="body2">
                        {exam.totalMarks} marks
                      </Typography>
                    </Box>
                    
                    {exam.passingMarks > 0 && (
                      <Box className="detail-item">
                        <CheckIcon fontSize="small" />
                        <Typography variant="body2">
                          Pass: {exam.passingMarks} marks
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <CardActions className="exam-actions">
                  {status.status === 'not-attempted' || status.status === 'failed' ? (
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<StartIcon />}
                      onClick={() => handleStartExam(exam._id)}
                      fullWidth
                    >
                      Start Exam
                    </Button>
                  ) : status.status === 'passed' ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleViewResult(status.attempt._id)}
                      fullWidth
                    >
                      View Result
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<StartIcon />}
                      onClick={() => handleStartExam(exam._id)}
                      fullWidth
                    >
                      Continue Exam
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Box className="student-exams-container">
      <Typography variant="h4" className="page-title">
        My Exams
      </Typography>
      
      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading exams...</Typography>
        </Box>
      ) : (
        <>
          <Paper className="tabs-container">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Available Exams" />
              <Tab label="Completed Exams" />
              <Tab label="All Attempts" />
            </Tabs>
          </Paper>
          
          <Box className="exams-content">
            {activeTab === 0 && renderExamList(getAvailableExams())}
            {activeTab === 1 && renderExamList(getCompletedExams())}
            {activeTab === 2 && (
              <Box className="attempts-list-container">
                {attempts.length === 0 ? (
                  <Alert severity="info">
                    You haven't attempted any exams yet.
                  </Alert>
                ) : (
                  <List className="attempts-list">
                    {attempts.map(attempt => (
                      <ListItem
                        key={attempt._id}
                        button
                        onClick={() => handleViewResult(attempt._id)}
                        className={`attempt-item ${attempt.status}`}
                      >
                        <ListItemIcon>
                          {attempt.status === 'completed' ? (
                            <CheckIcon color="success" />
                          ) : (
                            <HistoryIcon color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={attempt.examTitle || 'Unnamed Exam'}
                          secondary={`Attempted on: ${new Date(attempt.startedAt).toLocaleString()} | Score: ${attempt.score || 'N/A'} | Status: ${attempt.status}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default StudentExams; 