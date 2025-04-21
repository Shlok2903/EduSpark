import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress
} from '@mui/material';
import { 
  Timer as TimerIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import './TakeExam.css';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [error, setError] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [initialTime, setInitialTime] = useState(null);
  
  // Refs
  const timerRef = useRef(null);
  const savingTimeoutRef = useRef(null);
  
  // Load exam on component mount
  useEffect(() => {
    startExam();
    
    // Add beforeunload event listener to prompt before leaving
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clear timer when component unmounts
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Save progress when component unmounts
      if (attempt && attempt._id) {
        saveExamProgress();
      }
    };
  }, [examId]);
  
  // Warn user before leaving the page
  const handleBeforeUnload = (e) => {
    if (attempt && attempt.status === 'in-progress') {
      e.preventDefault();
      e.returnValue = 'You have an exam in progress. Are you sure you want to leave?';
      return e.returnValue;
    }
  };
  
  // Timer effect
  useEffect(() => {
    // Start timer if we have an attempt and time remaining
    if (attempt && timeRemaining > 0 && !loading) {
      if (!initialTime) {
        setInitialTime(timeRemaining);
      }
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Set up timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // Save time remaining every 30 seconds
          if (newTime % 30 === 0) {
            updateTimeOnServer(newTime);
          }
          
          // Auto-submit when time runs out
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            toast.error("Time's up! Your exam is being submitted automatically.");
            handleAutoSubmit();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    // Clean up timer on unmount or when prerequisites change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [attempt, timeRemaining, loading]);
  
  // Update time on server
  const updateTimeOnServer = async (time = timeRemaining) => {
    if (!attempt || !attempt._id) return;
    
    try {
      await examService.updateTimeRemaining(attempt._id, time);
    } catch (error) {
      console.error('Error updating time on server:', error);
    }
  };
  
  // Auto-submit exam when time expires
  const handleAutoSubmit = async () => {
    try {
      if (!attempt || !attempt._id) return;
      
      setLoadingSubmit(true);
      
      // First try to save progress
      try {
        await saveExamProgress();
      } catch (error) {
        console.error('Failed to save progress before auto-submit:', error);
      }
      
      // Submit the exam
      await examService.submitExam(attempt._id);
      toast.info('Your exam has been submitted automatically as time expired.');
      
      // Redirect to exams page
      navigate('/exams');
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      toast.error('Failed to submit your exam. Please try manually or contact support.');
    } finally {
      setLoadingSubmit(false);
    }
  };
  
  // Start the exam
  const startExam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Attempt to start the exam
      const response = await examService.startExam(examId);
      
      if (response.success === false && response.errorCode) {
        // Handle error cases with error codes
        handleExamError(response);
        return;
      }
      
      if (response.attempt) {
        // Set the attempt data
        setAttempt(response.attempt);
        
        // Initialize timeRemaining
        setTimeRemaining(response.attempt.timeRemaining);
        setInitialTime(response.attempt.timeRemaining);
        
        // Get exam details
        setExam(response.exam);
        
        // Initialize answers object from attempt data
        const initialAnswers = {};
        
        response.attempt.sections.forEach(section => {
          initialAnswers[section.sectionId] = {};
          
          section.answers.forEach(answer => {
            initialAnswers[section.sectionId][answer.questionId] = {
              answer: answer.answer || '',
              selectedOption: answer.selectedOption !== null ? answer.selectedOption : null
            };
          });
        });
        
        setAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      
      // Handle error responses from API
      if (error.response && error.response.data) {
        handleExamError(error.response.data);
      } else {
        setError({
          title: 'Error',
          message: 'Failed to start exam. Please try again or contact support.'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle exam error cases
  const handleExamError = (errorData) => {
    if (errorData.errorCode === 'EXAM_NOT_PUBLISHED') {
      setError({
        title: 'Exam Not Available',
        message: 'This exam is not available yet. Please check back later.'
      });
    } 
    else if (errorData.errorCode === 'EXAM_NOT_STARTED') {
      const startTime = new Date(errorData.examStartTime);
      setError({
        title: 'Exam Not Started',
        message: `This exam will start on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`
      });
    } 
    else if (errorData.errorCode === 'EXAM_ENDED') {
      setError({
        title: 'Exam Ended',
        message: 'This exam has already ended and is no longer available.'
      });
    }
    else if (errorData.errorCode === 'ALREADY_COMPLETED') {
      setError({
        title: 'Exam Already Completed',
        message: 'You have already completed this exam.',
        redirectUrl: errorData.attemptDetails?.redirectUrl || '/exams',
        redirectLabel: 'View Result'
      });
    }
    else if (errorData.errorCode === 'TIME_EXPIRED') {
      setError({
        title: 'Time Expired',
        message: 'Your time for this exam has expired.',
        redirectUrl: '/exams',
        redirectLabel: 'Go Back to Exams'
      });
    }
    else if (errorData.errorCode === 'NOT_ENROLLED') {
      setError({
        title: 'Not Enrolled',
        message: 'You are not enrolled in the course this exam belongs to.',
        redirectUrl: '/courses',
        redirectLabel: 'Browse Courses'
      });
    }
    else {
      setError({
        title: 'Error Starting Exam',
        message: errorData.message || 'Failed to start exam. Please try again.'
      });
    }
  };
  
  // Save exam progress
  const saveExamProgress = async () => {
    if (!attempt || !attempt._id) return;
    
    try {
      // Cancel any pending save operations
      if (savingTimeoutRef.current) {
        clearTimeout(savingTimeoutRef.current);
      }
      
      setSavingProgress(true);
      
      const progress = {
        answers,
        timeRemaining
      };
      
      const response = await examService.saveExamProgress(attempt._id, progress);
      setLastSaved(new Date());
      
      // If the server calculated a different time remaining, update our state
      if (response.attempt && response.attempt.calculatedTimeRemaining !== undefined) {
        // Use the server's calculated time if it's less than our local time
        const serverTime = response.attempt.calculatedTimeRemaining;
        if (serverTime < timeRemaining) {
          setTimeRemaining(serverTime);
        }
        
        // If the server says time is up, auto-submit
        if (serverTime <= 0) {
          clearInterval(timerRef.current);
          toast.error("Time's up! Your exam is being submitted automatically.");
          handleAutoSubmit();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    } finally {
      setSavingProgress(false);
    }
  };
  
  // Debounced save on answer change
  const handleAnswerChange = (sectionId, questionId, value, type) => {
    // Update state with new answer
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers };
      
      if (!newAnswers[sectionId]) {
        newAnswers[sectionId] = {};
      }
      
      if (!newAnswers[sectionId][questionId]) {
        newAnswers[sectionId][questionId] = {};
      }
      
      if (type === 'mcq') {
        newAnswers[sectionId][questionId].selectedOption = value;
      } else {
        newAnswers[sectionId][questionId].answer = value;
      }
      
      // Set up debounced save
      if (savingTimeoutRef.current) {
        clearTimeout(savingTimeoutRef.current);
      }
      
      savingTimeoutRef.current = setTimeout(() => {
        saveExamProgress();
      }, 2000); // 2 seconds debounce
      
      return newAnswers;
    });
  };
  
  // Manual save button handler
  const handleSaveProgress = async () => {
    try {
      setLoadingSubmit(true);
      await saveExamProgress();
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setLoadingSubmit(false);
    }
  };
  
  // Submit exam handler
  const handleSubmitExam = async () => {
    try {
      setLoadingSubmit(true);
      
      // Save progress first
      await saveExamProgress();
      
      // Submit the exam
      await examService.submitExam(attempt._id);
      toast.success('Exam submitted successfully');
      
      // Navigate to exams list
      navigate('/exams');
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setLoadingSubmit(false);
      setSubmitDialogOpen(false);
    }
  };
  
  // Navigation
  const handleNextQuestion = () => {
    if (!exam) return;
    
    const currentSectionQuestions = exam.sections[currentSection].questions;
    
    if (currentQuestion < currentSectionQuestions.length - 1) {
      // Move to next question in current section
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < exam.sections.length - 1) {
      // Move to next section
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      // Move to previous question in current section
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      // Move to last question of previous section
      const prevSection = exam.sections[currentSection - 1];
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(prevSection.questions.length - 1);
    }
  };
  
  // Format time display (HH:MM:SS)
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get time elapsed percentage
  const getTimeElapsedPercentage = () => {
    if (!initialTime || initialTime === 0) return 0;
    return Math.min(100, 100 - (timeRemaining / initialTime) * 100);
  };
  
  // Get answer progress percentage
  const getProgressPercentage = () => {
    if (!exam) return 0;
    
    let answered = 0;
    let total = 0;
    
    exam.sections.forEach(section => {
      section.questions.forEach(question => {
        total++;
        
        const sectionAnswers = answers[section._id] || {};
        const answer = sectionAnswers[question._id];
        
        if (answer) {
          if ((question.type === 'mcq' && answer.selectedOption !== null) || 
              (question.type !== 'mcq' && answer.answer && answer.answer.trim() !== '')) {
            answered++;
          }
        }
      });
    });
    
    return total > 0 ? (answered / total) * 100 : 0;
  };
  
  // Calculate time color based on remaining percentage
  const getTimerColor = () => {
    if (!initialTime) return 'primary';
    
    const percentage = (timeRemaining / initialTime) * 100;
    
    if (percentage < 10) return 'error';
    if (percentage < 25) return 'warning';
    return 'primary';
  };
  
  // Calculate total questions
  const getTotalQuestions = () => {
    if (!exam) return 0;
    return exam.sections.reduce((total, section) => total + section.questions.length, 0);
  };
  
  // Calculate current question number
  const getCurrentQuestionNumber = () => {
    if (!exam) return 1;
    
    return exam.sections.slice(0, currentSection).reduce(
      (count, section) => count + section.questions.length, 
      0
    ) + currentQuestion + 1;
  };
  
  // Loading state
  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
        <Typography>Loading exam...</Typography>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box className="error-container">
        <Paper sx={{ p: 3, maxWidth: 600, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ErrorIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="h6" color="error">{error.title}</Typography>
          </Box>
          
          <Typography variant="body1" paragraph>
            {error.message}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              startIcon={<ArrowBackIcon />}
              variant="outlined" 
              onClick={() => navigate('/exams')}
            >
              Back to Exams
            </Button>
            
            {error.redirectUrl && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate(error.redirectUrl)}
              >
                {error.redirectLabel || 'Continue'}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Missing data state
  if (!exam || !attempt) {
    return (
      <Box className="error-container">
        <Alert severity="error">
          Could not load exam. Please try again.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Back to Exams
        </Button>
      </Box>
    );
  }
  
  // Get current section and question data for rendering
  const currentSectionData = exam.sections[currentSection];
  const currentQuestionData = currentSectionData.questions[currentQuestion];
  
  return (
    <Box className="take-exam-container">
      {/* Exam header */}
      <Box className="exam-header">
        <Typography variant="h5" className="exam-title">
          {exam.title}
        </Typography>
        
        {/* Timer */}
        <Box className="exam-timer">
          <TimerIcon color={getTimerColor()} />
          <Typography 
            variant="h6" 
            color={getTimerColor()}
          >
            {formatTime(timeRemaining)}
          </Typography>
        </Box>
      </Box>
      
      {/* Progress bars */}
      <Box className="exam-progress">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Question {getCurrentQuestionNumber()} of {getTotalQuestions()}
              </Typography>
              <Typography variant="body2">
                Progress: {Math.round(getProgressPercentage())}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getProgressPercentage()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Time elapsed
              </Typography>
              <Typography variant="body2">
                Section: {currentSectionData.name || `Section ${currentSection + 1}`}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getTimeElapsedPercentage()} 
              color={getTimerColor()}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Grid>
        </Grid>
        
        {lastSaved && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Last saved: {lastSaved.toLocaleTimeString()}
          </Typography>
        )}
      </Box>
      
      {/* Main content */}
      <Grid container spacing={3} className="exam-content">
        {/* Question area */}
        <Grid item xs={12} md={8}>
          <Card className="question-card">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Question {currentQuestion + 1}: {currentQuestionData.marks || 1} marks
              </Typography>
              
              <Typography variant="h6" className="question-text">
                {currentQuestionData.question}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Question content based on type */}
              {currentQuestionData.type === 'mcq' ? (
                <RadioGroup
                  value={answers[currentSectionData._id]?.[currentQuestionData._id]?.selectedOption ?? ''}
                  onChange={(e) => handleAnswerChange(
                    currentSectionData._id,
                    currentQuestionData._id,
                    parseInt(e.target.value),
                    'mcq'
                  )}
                >
                  {currentQuestionData.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={index}
                      control={<Radio />}
                      label={option.text}
                      className="option-label"
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  placeholder="Enter your answer here..."
                  value={answers[currentSectionData._id]?.[currentQuestionData._id]?.answer ?? ''}
                  onChange={(e) => handleAnswerChange(
                    currentSectionData._id,
                    currentQuestionData._id,
                    e.target.value,
                    'subjective'
                  )}
                  variant="outlined"
                />
              )}
            </CardContent>
          </Card>
          
          {/* Navigation buttons */}
          <Box className="navigation-buttons">
            <Button
              variant="outlined"
              onClick={handlePrevQuestion}
              disabled={currentSection === 0 && currentQuestion === 0}
            >
              Previous
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleNextQuestion}
              disabled={currentSection === exam.sections.length - 1 && 
                currentQuestion === exam.sections[exam.sections.length - 1].questions.length - 1}
            >
              Next
            </Button>
          </Box>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper className="actions-panel">
            {/* Action buttons */}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveProgress}
              disabled={loadingSubmit || savingProgress}
              fullWidth
              sx={{ mb: 2 }}
            >
              {savingProgress ? <CircularProgress size={24} /> : 'Save Progress'}
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckIcon />}
              onClick={() => setSubmitDialogOpen(true)}
              disabled={loadingSubmit || savingProgress}
              fullWidth
            >
              Submit Exam
            </Button>
            
            {/* Countdown warning if less than 5 minutes */}
            {timeRemaining < 300 && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
                Less than 5 minutes remaining!
              </Alert>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Question navigation */}
            <Typography variant="subtitle1" gutterBottom>
              Question Navigation
            </Typography>
            
            {exam.sections.map((section, sIndex) => (
              <Box key={sIndex} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {section.name || `Section ${sIndex + 1}`}
                </Typography>
                
                <Box className="question-buttons">
                  {section.questions.map((question, qIndex) => {
                    // Check if question has been answered
                    const sectionAnswers = answers[section._id] || {};
                    const answer = sectionAnswers[question._id];
                    const isAnswered = answer && (
                      (question.type === 'mcq' && answer.selectedOption !== null) || 
                      (question.type !== 'mcq' && answer.answer && answer.answer.trim() !== '')
                    );
                    
                    // Current question indicator
                    const isCurrent = currentSection === sIndex && currentQuestion === qIndex;
                    
                    return (
                      <Button
                        key={qIndex}
                        variant={isCurrent ? "contained" : "outlined"}
                        color={isAnswered ? "success" : "primary"}
                        size="small"
                        onClick={() => {
                          setCurrentSection(sIndex);
                          setCurrentQuestion(qIndex);
                        }}
                        sx={{ minWidth: 36, height: 36, m: 0.5 }}
                      >
                        {qIndex + 1}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Submit confirmation dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
      >
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit this exam? Once submitted, you won't be able to make any changes.
          </DialogContentText>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Completion: {Math.round(getProgressPercentage())}% of questions answered
            </Typography>
            <Typography variant="body2">
              Time remaining: {formatTime(timeRemaining)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmitExam} color="primary" disabled={loadingSubmit} variant="contained">
            {loadingSubmit ? <CircularProgress size={24} /> : 'Submit Exam'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeExam; 