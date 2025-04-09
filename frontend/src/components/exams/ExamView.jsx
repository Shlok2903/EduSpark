import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { examService } from '../../services/api';
import Sidebar from '../common/sidebar/Sidebar';
import { handleError, handleSuccess } from '../../utils';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerIcon from '@mui/icons-material/Timer';

function ExamView() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [confirmStart, setConfirmStart] = useState(false);
  const [startingExam, setStartingExam] = useState(false);

  useEffect(() => {
    const fetchExamDetails = async () => {
      setLoading(true);
      try {
        const response = await examService.getExamById(examId);
        if (response) {
          setExam(response);
        }
      } catch (error) {
        console.error('Error fetching exam details:', error);
        handleError('Failed to load exam details');
        navigate('/exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId, navigate]);

  const handleStartExam = async () => {
    setStartingExam(true);
    try {
      const response = await examService.startExam(examId);
      
      if (response && response.attempt) {
        handleSuccess('Exam started successfully');
        navigate(`/exams/session/${response.attempt._id}`);
      } else if (response && response.attemptId) {
        handleError('You have already completed this exam');
        navigate(`/exams/attempt/${response.attemptId}`);
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      handleError(error.formattedMessage || 'Failed to start exam. Please try again later.');
    } finally {
      setStartingExam(false);
      setConfirmStart(false);
    }
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

  const isExamActive = () => {
    if (!exam) return false;
    
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    return now >= startTime && now <= endTime;
  };

  const renderExamStatus = () => {
    if (!exam) return null;
    
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    let status, color;
    
    if (now < startTime) {
      status = 'Upcoming';
      color = '#FFA000'; // amber
    } else if (now <= endTime) {
      status = 'Active';
      color = '#4CAF50'; // green
    } else {
      status = 'Expired';
      color = '#F44336'; // red
    }
    
    return (
      <Chip 
        label={status}
        sx={{ 
          backgroundColor: color,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!exam) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Alert severity="error">Exam not found or you don't have access to this exam.</Alert>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/exams')}
            sx={{ mt: 2 }}
          >
            Back to Exams
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
      <Sidebar />
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/exams')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {exam.title}
          </Typography>
          {renderExamStatus()}
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {exam.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  <AssignmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Instructions
                </Typography>
                <Typography variant="body1" paragraph>
                  {exam.instructions}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sections & Questions
                </Typography>
                
                {exam.sections.map((section, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {section.title}
                    </Typography>
                    
                    {section.description && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {section.description}
                      </Typography>
                    )}
                    
                    <List disablePadding>
                      {section.questions.map((question, qIndex) => (
                        <ListItem 
                          key={qIndex}
                          sx={{ 
                            backgroundColor: qIndex % 2 === 0 ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                            borderRadius: 1,
                            py: 1,
                            px: 2,
                            mb: 0.5
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography component="span">
                                  Q{qIndex + 1}: {question.type === 'mcq' ? 'Multiple Choice' : 
                                                question.type === 'subjective' ? 'Subjective' : 'File Upload'}
                                </Typography>
                                <Chip 
                                  label={`${question.marks} ${question.marks === 1 ? 'mark' : 'marks'}`}
                                  size="small"
                                  sx={{ ml: 2 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3, position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exam Details
                </Typography>
                
                <List disablePadding>
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <CalendarTodayIcon color="primary" sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Start Time" 
                      secondary={formatDate(exam.startTime)} 
                    />
                  </ListItem>
                  
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <CalendarTodayIcon color="error" sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="End Time" 
                      secondary={formatDate(exam.endTime)} 
                    />
                  </ListItem>
                  
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <TimerIcon color="warning" sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Duration" 
                      secondary={`${exam.duration} minutes`} 
                    />
                  </ListItem>
                  
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <AssignmentIcon color="success" sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Total Marks" 
                      secondary={exam.totalMarks} 
                    />
                  </ListItem>
                  
                  <ListItem disablePadding>
                    <AccessTimeIcon color="info" sx={{ mr: 2 }} />
                    <ListItemText 
                      primary="Passing Percentage" 
                      secondary={`${exam.passingPercentage}%`} 
                    />
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => setConfirmStart(true)}
                    disabled={!isExamActive() || exam.attemptStatus === 'completed' || startingExam}
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    {startingExam ? 'Starting Exam...' : 'Start Exam'}
                  </Button>
                </Box>
                
                {!isExamActive() && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {new Date() < new Date(exam.startTime) 
                      ? 'This exam is not active yet. Please return during the scheduled time.'
                      : 'This exam has expired and is no longer available.'}
                  </Alert>
                )}
                
                {exam.attemptStatus === 'completed' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    You have already completed this exam.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Dialog
        open={confirmStart}
        onClose={() => setConfirmStart(false)}
      >
        <DialogTitle>Start Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to start this exam? Once started, the timer will begin and cannot be paused.
            You will have {exam.duration} minutes to complete the exam.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStart(false)} disabled={startingExam}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartExam} 
            color="primary" 
            variant="contained"
            disabled={startingExam}
          >
            {startingExam ? 'Starting...' : 'Confirm Start'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExamView; 