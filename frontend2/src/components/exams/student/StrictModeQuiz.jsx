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
  TextField,
  Snackbar
} from '@mui/material';
import {
  Warning as WarningIcon,
  AccessTime as ClockIcon,
  Help as HelpIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
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
  const [countdownVisible, setCountdownVisible] = useState(true);
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
              
              // Store start time and total duration for accurate timer calculation on refresh
              localStorage.setItem(`exam_timer_${attemptId}`, JSON.stringify({
                startTime: startTime.getTime(),
                duration: duration, 
                timeRemaining: remainingTime,
                lastSaved: now.getTime()
              }));
              
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
            
            // Store time information for refreshes
            const now = new Date();
            const duration = response.duration * 60; // convert to seconds
            
            localStorage.setItem(`exam_timer_${response.attempt._id}`, JSON.stringify({
              startTime: now.getTime(), 
              duration: duration,
              timeRemaining: duration,
              lastSaved: now.getTime()
            }));
            
            setTimeRemaining(duration);
            setInitialTime(duration);
            
            // Redirect to the attempt-specific URL for better refresh handling
            navigate(`/strict/exam/${examId}/attempt/${response.attempt._id}`, { replace: true });
            return;
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
              // Update both backend and localStorage for exam attempts
              examService.updateTimeRemaining(attemptId, newTime)
                .catch(err => console.error('Error saving time:', err));
              
              // Update localStorage with the current remaining time
              const now = new Date().getTime();
              const timerData = JSON.parse(localStorage.getItem(`exam_timer_${attemptId}`) || '{}');
              localStorage.setItem(`exam_timer_${attemptId}`, JSON.stringify({
                ...timerData,
                timeRemaining: newTime,
                lastSaved: now
              }));
            } else {
              saveTimeToLocalStorage(newTime);
            }
          }
          
          // Auto-submit when time runs out
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            toast.error("Time's up! Your answers are being submitted automatically.");
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
    if (!isExam && quizId && currentRemaining !== null) {
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
        
        // Save both answers and current timeRemaining
        await examService.saveExamProgress(attemptId, {
          answers: formattedAnswers,
          timeRemaining
        });
        
        // Also update the localStorage timer data
        const now = new Date().getTime();
        const timerData = JSON.parse(localStorage.getItem(`exam_timer_${attemptId}`) || '{}');
        localStorage.setItem(`exam_timer_${attemptId}`, JSON.stringify({
          ...timerData,
          timeRemaining,
          lastSaved: now
        }));
        
        toast.success('Progress saved successfully');
      } catch (err) {
        console.error('Error saving progress:', err);
        toast.error('Failed to save progress');
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
  
  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  
  // Get timer color based on remaining time
  const getTimerColor = (seconds) => {
    if (seconds === null || seconds === undefined) return 'primary';
    
    const totalTime = initialTime || 3600; // default 1 hour
    const percentage = (seconds / totalTime) * 100;
    
    if (percentage < 10) return 'error';
    if (percentage < 25) return 'warning';
    return 'primary';
  };
  
  // Toggle timer visibility
  const toggleTimerVisibility = () => {
    setCountdownVisible(!countdownVisible);
  };
  
  // Render the timer component
  const renderTimer = () => {
    if (timeRemaining === null) return null;
    
    const timerColor = getTimerColor(timeRemaining);
    const timePercentage = Math.min(100, Math.max(0, (timeRemaining / (initialTime || 3600)) * 100));
    
    return (
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          p: 1,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: `2px solid ${timerColor}.main`,
          boxShadow: 2,
          mb: 2,
          transition: 'all 0.3s ease'
        }}
        onClick={toggleTimerVisibility}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
        }}>
          <TimerIcon 
            color={timerColor} 
            sx={{ mr: 1, animation: timerColor === 'error' ? 'pulse 1s infinite' : 'none' }} 
          />
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            fontFamily="monospace" 
            color={`${timerColor}.main`}
          >
            {formatTime(timeRemaining)}
          </Typography>
          {timerColor !== 'primary' && <WarningIcon color={timerColor} sx={{ ml: 1 }} />}
        </Box>
        
        {countdownVisible && (
          <>
            <Divider sx={{ width: '100%', my: 1 }} />
            <LinearProgress 
              variant="determinate" 
              value={timePercentage}
              color={timerColor}
              sx={{ 
                width: '100%', 
                height: 6, 
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  transition: 'none'
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {timePercentage < 25 ? 'Time is running out!' : 'Click to minimize'}
            </Typography>
          </>
        )}
      </Box>
    );
  };
  
  // Add effect to handle browser refresh scenarios
  useEffect(() => {
    // If we have an attemptId but timeRemaining is not set yet, try to restore from localStorage
    if (isExam && attemptId && timeRemaining === null) {
      const savedTimerData = localStorage.getItem(`exam_timer_${attemptId}`);
      
      if (savedTimerData) {
        try {
          const timerData = JSON.parse(savedTimerData);
          const now = new Date().getTime();
          const startTime = timerData.startTime;
          const duration = timerData.duration;
          const lastSaved = timerData.lastSaved;
          
          // Calculate how much time has passed since the last saved point
          const elapsedSinceLastSave = Math.floor((now - lastSaved) / 1000);
          
          // Calculate remaining time based on the saved time minus elapsed time
          const remainingTime = Math.max(0, timerData.timeRemaining - elapsedSinceLastSave);
          
          setTimeRemaining(remainingTime);
          setInitialTime(duration);
          
          // Update the saved data with current timestamp
          localStorage.setItem(`exam_timer_${attemptId}`, JSON.stringify({
            ...timerData,
            timeRemaining: remainingTime,
            lastSaved: now
          }));
        } catch (err) {
          console.error('Error restoring timer data:', err);
        }
      }
    }
  }, [isExam, attemptId, timeRemaining]);
  
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
      {renderTimer()}
      
      {isExam && quiz && (
        <>
          <Box className="quiz-header">
            <Typography variant="h5" className="quiz-title">
              {quiz.title || "Exam"}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {getTotalQuestions()} Questions
            </Typography>
          </Box>
          
          <Box className="progress-container">
            <Box className="progress-stats">
              <Typography variant="body2">
                Answered: {Object.keys(answers).length} / {getTotalQuestions()}
              </Typography>
              <Typography variant="body2">
                Progress: {Math.round(getProgressPercentage())}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getProgressPercentage()} 
              className="progress-bar"
            />
          </Box>
          
          <Box className="quiz-content">
            <Box className="exam-sections">
              {quiz.sections && quiz.sections.map((section, sectionIndex) => (
                <Paper key={section._id || sectionIndex} className="section-paper">
                  <Typography variant="h6" className="section-title">
                    {section.title || `Section ${sectionIndex + 1}`}
                  </Typography>
                  
                  {section.description && (
                    <Typography variant="body2" className="section-description">
                      {section.description}
                    </Typography>
                  )}
                  
                  {section.questions && section.questions.map((question, questionIndex) => (
                    <Card key={question._id || questionIndex} className="question-card">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Question {questionIndex + 1} {question.marks ? `(${question.marks} marks)` : ''}
                        </Typography>
                        
                        <Typography variant="body1" className="question-text">
                          {question.question}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        {question.type === 'mcq' ? (
                          <RadioGroup
                            value={answers[question._id] !== undefined ? answers[question._id] : ''}
                            onChange={(e) => handleAnswerChange(question._id, parseInt(e.target.value))}
                          >
                            {question.options.map((option, optionIndex) => (
                              <FormControlLabel
                                key={optionIndex}
                                value={optionIndex}
                                control={<Radio />}
                                label={option.text || option}
                                className="option-label"
                              />
                            ))}
                          </RadioGroup>
                        ) : (
                          <TextField
                            multiline
                            rows={4}
                            fullWidth
                            variant="outlined"
                            placeholder="Type your answer here..."
                            // Implementation for text answers if needed
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Paper>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 8 }}>
              <Button 
                variant="outlined"
                onClick={() => {
                  if(window.confirm("Are you sure you want to save and exit? You can return to complete the exam later.")) {
                    saveProgress();
                    navigate('/exams');
                  }
                }}
              >
                Save & Exit
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={openConfirmSubmit}
                className="submit-button"
              >
                Submit Exam
              </Button>
            </Box>
          </Box>
        </>
      )}
      
      {!isExam && quiz && (
        <Box className="quiz-questions">
          {/* Regular quiz content here */}
        </Box>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmSubmit}
        onClose={closeConfirmSubmit}
      >
        <DialogTitle>Submit {isExam ? "Exam" : "Quiz"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit? Once submitted, you cannot change your answers.
            {Object.keys(answers).length < getTotalQuestions() && (
              <Typography color="error" sx={{ mt: 2 }}>
                Warning: You have only answered {Object.keys(answers).length} out of {getTotalQuestions()} questions.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmSubmit} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      
      <style jsx="true">{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default StrictModeQuiz;