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
  School as CourseIcon,
  Timer as DurationIcon,
  CheckCircle as CompletedIcon,
  TimerOff as EndedIcon,
  EventAvailable as UpcomingIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import courseService from '../../../services/courseService';
import enrollmentService from '../../../services/enrollmentService';
import './StudentExams.css';
import { handleError } from '../../../utils/notifications';

const StudentExams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState({
    upcoming: [],
    live: [],
    completed: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await examService.getUserExams();
      
      if (response.success) {
        setExams(response.data || { upcoming: [], live: [], completed: [] });
        
        // If there are live exams, switch to that tab automatically
        if (response.data.live && response.data.live.length > 0) {
          setActiveTab(1); // Live exams tab
        }
      } else {
        setError(response.message || 'Failed to load exams');
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      handleError('Failed to load exams');
      setError('Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStartExam = (examId) => {
    navigate(`/strict/exam/${examId}`);
  };

  const handleViewResults = (attemptId) => {
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

  const formatDate = (dateString) => {
    try {
      // Create a date object from the ISO string
      // This will automatically convert to the user's local timezone
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "Invalid date";
      }
      
      // Format date and time consistently in the user's local timezone
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  const renderExamCard = (exam, category) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    return (
      <Card className="exam-card" key={exam._id}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" className="exam-title">
                {exam.title}
              </Typography>
              <Typography variant="subtitle1" className="course-name">
                <CourseIcon fontSize="small" /> 
                {exam.courseId && exam.courseId.title ? exam.courseId.title : 'Unknown Course'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box className="exam-info">
                <TimeIcon fontSize="small" />
                <Typography variant="body2">
                  {category === 'upcoming' 
                    ? `Starts: ${formatDate(exam.startTime)}` 
                    : `Ends: ${formatDate(exam.endTime)}`
                  }
                </Typography>
              </Box>
              
              <Box className="exam-info">
                <DurationIcon fontSize="small" />
                <Typography variant="body2">
                  Duration: {formatDuration(exam.duration)}
                </Typography>
              </Box>
              
              {exam.totalMarks && (
                <Box className="exam-info">
                  <Typography variant="body2">
                    Total Marks: {exam.totalMarks}
                  </Typography>
                </Box>
              )}
              
              {exam.studentSubmitted && exam.percentage && (
                <Box className="exam-result">
                  <Typography variant="body2" color={exam.percentage >= 60 ? 'success.main' : 'error.main'}>
                    Score: {Math.round(exam.percentage)}% ({exam.totalMarksAwarded}/{exam.totalMarks})
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} className="exam-actions">
              {category === 'upcoming' && (
                <Chip 
                  icon={<UpcomingIcon />}
                  label={`Starts in ${Math.ceil((startTime - now) / (1000 * 60 * 60))} hours`}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {category === 'live' && !exam.studentStartedExam && (
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<StartIcon />}
                  onClick={() => handleStartExam(exam._id)}
                  fullWidth
                >
                  Start Exam
                </Button>
              )}
              
              {category === 'live' && exam.studentStartedExam && !exam.studentSubmitted && (
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
              
              {category === 'live' && exam.studentSubmitted && (
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => handleViewResults(exam.attemptId)}
                  startIcon={<CompletedIcon />}
                  fullWidth
                >
                  View Results
                </Button>
              )}
              
              {category === 'completed' && (
                <>
                  {exam.studentSubmitted ? (
                    <Chip 
                      icon={<CompletedIcon />}
                      label={exam.status === 'timed-out' ? 'Time Expired' : 'Completed'}
                      color={exam.status === 'timed-out' ? 'warning' : 'success'} 
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      icon={<EndedIcon />}
                      label="Ended (Not Submitted)" 
                      color="error"
                      variant="outlined"
                    />
                  )}
                  
                  {exam.studentSubmitted && exam.attemptId && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleViewResults(exam.attemptId)}
                      className="action-button"
                    >
                      View Results
                    </Button>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box className="student-exams-container">
      <Typography variant="h5" className="page-title">
        My Exams
      </Typography>
      
      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading exams...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          <Paper sx={{ mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              className="exam-tabs"
            >
              <Tab 
                label={`Upcoming (${exams.upcoming?.length || 0})`} 
                icon={<UpcomingIcon />}
                iconPosition="start"
              />
              <Tab 
                label={`Live Now (${exams.live?.length || 0})`} 
                icon={<StartIcon />}
                iconPosition="start"
                className={exams.live?.length > 0 ? "live-tab" : ""}
              />
              <Tab 
                label={`Completed (${exams.completed?.length || 0})`} 
                icon={<CompletedIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>
          
          <Box className="exams-content">
            {activeTab === 0 && (
              <Box>
                {exams.upcoming && exams.upcoming.length > 0 ? (
                  exams.upcoming.map(exam => renderExamCard(exam, 'upcoming'))
                ) : (
                  <Alert severity="info">No upcoming exams.</Alert>
                )}
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                {exams.live && exams.live.length > 0 ? (
                  exams.live.map(exam => renderExamCard(exam, 'live'))
                ) : (
                  <Alert severity="info">No active exams at the moment.</Alert>
                )}
              </Box>
            )}
            
            {activeTab === 2 && (
              <Box>
                {exams.completed && exams.completed.length > 0 ? (
                  exams.completed.map(exam => renderExamCard(exam, 'completed'))
                ) : (
                  <Alert severity="info">No completed exams.</Alert>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default StudentExams; 