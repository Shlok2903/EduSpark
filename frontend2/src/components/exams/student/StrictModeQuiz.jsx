import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  LinearProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Warning as WarningIcon,
  AccessTime as ClockIcon,
  Help as HelpIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { examService } from '../../../services/api';
import './StrictModeQuiz.css';

const StrictModeQuiz = () => {
  const { quizId, examId, attemptId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [initialTime, setInitialTime] = useState(null);
  const timerRef = useRef(null);
  const isExam = !!examId;

  // Handle beforeunload event to warn user about leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitted) {
        // Standard for most browsers
        e.preventDefault();
        // For older browsers
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [submitted]);

  // Fetch quiz or exam data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data;
        
        if (isExam) {
          // If we already have an attemptId, load existing attempt
          if (attemptId) {
            const response = await examService.getAttemptById(attemptId);
            if (response.status === 'in-progress') {
              data = response;
              
              // Calculate remaining time based on stored time
              const now = new Date();
              const startTime = new Date(response.startTime);
              const duration = response.duration * 60; // convert minutes to seconds
              const elapsedSeconds = Math.floor((now - startTime) / 1000);
              const remainingTime = Math.max(0, response.timeRemaining || (duration - elapsedSeconds));
              
              setTimeRemaining(remainingTime);
              setInitialTime(response.duration * 60);
              
              // Load answered questions
              const savedAnswers = {};
              response.sections.forEach(section => {
                section.answers.forEach(answer => {
                  if (answer.selectedOption !== undefined) {
                    savedAnswers[answer.questionId] = answer.selectedOption;
                  }
                });
              });
              setAnswers(savedAnswers);
            } else {
              // Attempt already completed
              navigate(`/exams/result/${attemptId}`);
              return;
            }
          } else {
            // Start a new exam attempt
            const response = await examService.startExam(examId);
            data = response;
            setTimeRemaining(response.duration * 60); // convert minutes to seconds
            setInitialTime(response.duration * 60);
          }
        } else {
          // For regular quizzes
          const response = await examService.getQuizById(quizId);
          data = response;
          // Set time limit if applicable
          if (data.timeLimit) {
            setTimeRemaining(data.timeLimit * 60);
            setInitialTime(data.timeLimit * 60);
            
            // Check if there's a saved timestamp in localStorage
            const savedTime = localStorage.getItem(`quiz_time_${quizId}`);
            if (savedTime) {
              const { timestamp, remainingSeconds } = JSON.parse(savedTime);
              const now = new Date().getTime();
              const elapsed = Math.floor((now - timestamp) / 1000);
              const newRemaining = Math.max(0, remainingSeconds - elapsed);
              setTimeRemaining(newRemaining);
            } else {
              // Save the initial timestamp and time
              saveTimeToLocalStorage();
            }
          }
        }
        
        setQuiz(data);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load the quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId, examId, attemptId, navigate, isExam]);
  
  // Start timer if timeRemaining is set
  useEffect(() => {
    if (timeRemaining !== null && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // Save current time to localStorage or backend periodically
          if (newTime % 10 === 0) { // save every 10 seconds
            if (isExam && attemptId) {
              examService.updateTimeRemaining(attemptId, newTime)
                .catch(err => console.error('Error saving time:', err));
            } else {
              saveTimeToLocalStorage(newTime);
            }
          }
          
          // Auto-submit when time runs out
          if (newTime <= 0) {
            handleSubmit();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, submitted, isExam, attemptId]);
  
  // Save current time to localStorage for quizzes
  const saveTimeToLocalStorage = (currentRemaining = timeRemaining) => {
    if (!isExam && quizId && currentRemaining) {
      localStorage.setItem(`quiz_time_${quizId}`, JSON.stringify({
        timestamp: new Date().getTime(),
        remainingSeconds: currentRemaining
      }));
    }
  };
  
  // Save progress for exams
  const saveProgress = async () => {
    if (isExam && attemptId) {
      try {
        // Format answers for the API
        const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption
        }));
        
        await examService.saveExamProgress(attemptId, {
          answers: formattedAnswers,
          timeRemaining
        });
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    }
  };
  
  // Save progress periodically
  useEffect(() => {
    if (isExam && attemptId && !submitted) {
      const progressInterval = setInterval(saveProgress, 30000); // save every 30 seconds
      
      return () => clearInterval(progressInterval);
    }
  }, [isExam, attemptId, answers, submitted, timeRemaining]);
  
  // Handle answer selection
  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get progress percentage
  const getProgressPercentage = () => {
    if (!quiz) return 0;
    
    const totalQuestions = isExam 
      ? quiz.sections.reduce((total, section) => total + section.questions.length, 0)
      : quiz.questions.length;
      
    return (Object.keys(answers).length / totalQuestions) * 100;
  };
  
  // Open confirm submission dialog
  const openConfirmSubmit = () => {
    setConfirmSubmit(true);
  };
  
  // Close confirm submission dialog
  const closeConfirmSubmit = () => {
    setConfirmSubmit(false);
  };
  
  // Handle quiz submission
  const handleSubmit = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setConfirmSubmit(false);
    
    try {
      setLoading(true);
      
      if (isExam) {
        await examService.submitExam(attemptId);
        navigate(`/exams/result/${attemptId}`);
      } else {
        // For regular quizzes
        const result = await examService.submitQuiz(quizId, answers);
        setQuiz(prev => ({
          ...prev,
          result
        }));
        setSubmitted(true);
        
        // Clear the saved time from localStorage
        localStorage.removeItem(`quiz_time_${quizId}`);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get question count
  const getTotalQuestions = () => {
    if (!quiz) return 0;
    
    return isExam 
      ? quiz.sections.reduce((total, section) => total + section.questions.length, 0)
      : quiz.questions.length;
  };
  
  // Time warning indicator for last 5 minutes
  const getTimeWarningLevel = () => {
    if (timeRemaining === null) return 'normal';
    
    const totalTime = initialTime || 3600; // default 1 hour if not specified
    const percentage = (timeRemaining / totalTime) * 100;
    
    if (percentage < 10) return 'danger';
    if (percentage < 25) return 'warning';
    return 'normal';
  };
  
  if (loading) {
    return (
      <Box className="strict-quiz-loading">
        <CircularProgress size={60} />
        <Typography variant="h6" mt={2}>Loading quiz...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box className="strict-quiz-error">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  if (!quiz) {
    return (
      <Box className="strict-quiz-error">
        <Alert severity="warning">Quiz not found</Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  if (submitted && !isExam) {
    // Show results for regular quizzes
    return (
      <Box className="strict-quiz-results">
        <Paper className="results-paper">
          <Typography variant="h4" align="center" gutterBottom>
            Quiz Results
          </Typography>
          
          <Box className="score-box">
            <Typography variant="h2">
              {quiz.result.score}%
            </Typography>
            <Typography variant="body1">
              {quiz.result.correctAnswers} of {quiz.questions.length} correct
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Question Review
          </Typography>
          
          {quiz.questions.map((question, index) => (
            <Box key={index} className="question-review">
              <Box className="question-header">
                <Typography variant="subtitle1">
                  <strong>Question {index + 1}:</strong> {question.question}
                </Typography>
                {answers[question.id] === question.correctOption ? (
                  <CheckIcon color="success" />
                ) : (
                  <CloseIcon color="error" />
                )}
              </Box>
              
              <Box className="options-review">
                {question.options.map((option, optIdx) => (
                  <Box 
                    key={optIdx}
                    className={`option-review ${
                      optIdx === question.correctOption 
                        ? 'correct' 
                        : answers[question.id] === optIdx && optIdx !== question.correctOption
                          ? 'incorrect'
                          : ''
                    }`}
                  >
                    <Typography variant="body2">
                      {option.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
          
          <Box className="actions" mt={4}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => navigate('/courses')}
            >
              Back to Courses
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Quiz taking interface
  return (
    <Box className="strict-quiz-container">
      {/* Rest of the component */}
    </Box>
  );
};

export default StrictModeQuiz;