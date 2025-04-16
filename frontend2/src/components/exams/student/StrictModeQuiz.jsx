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
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [sections, setSections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeout = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const fetchExam = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If we have an attemptId from params, this is a direct access to an existing attempt
        if (attemptId) {
          const response = await examService.getAttemptById(attemptId);
          if (response.attempt && response.exam) {
            setExam(response.exam);
            setAttempt(response.attempt);
            
            // Calculate remaining time based on saved time in attempt
            const remainingTime = response.attempt.timeRemaining;
            if (remainingTime <= 0) {
              // Time has already expired
              setTimeExpired(true);
              submitExamOnTimeout();
            } else {
              setTimeRemaining(remainingTime);
            }
            
            initializeSections(response.exam, response.attempt);
          } else {
            setError('Failed to load exam attempt. Please try again.');
          }
        } 
        // Otherwise, it's a new attempt or continuation of an in-progress attempt
        else {
          const response = await examService.startExam(examId);
          if (response.success) {
            setExam(response.exam);
            setAttempt(response.attempt);
            
            // Set the timer based on returned remaining time
            setTimeRemaining(response.attempt.timeRemaining);
            
            // Navigate to the attempt-specific URL (for bookmarking or refresh purposes)
            if (response.attempt._id) {
              navigate(`/strict/exam/${examId}/attempt/${response.attempt._id}`, { replace: true });
            }
            
            initializeSections(response.exam, response.attempt);
          } else {
            // Handle specific error codes
            if (response.errorCode === 'ALREADY_COMPLETED') {
              setError('You have already completed this exam.');
            } else if (response.errorCode === 'EXAM_NOT_STARTED') {
              setError(`This exam hasn't started yet. It will be available from ${new Date(response.examStartTime).toLocaleString()}`);
            } else if (response.errorCode === 'EXAM_ENDED') {
              setError('This exam has already ended.');
            } else if (response.errorCode === 'TIME_EXPIRED') {
              setError('Your time for this exam has expired.');
            } else {
              setError(response.message || 'Failed to start exam. Please try again.');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exam:', error);
        const errorMsg = error.response?.data?.message || 'Error loading exam. Please try again.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, attemptId]);
  
  // Start timer if timeRemaining is set
  useEffect(() => {
    if (timeRemaining > 0 && !loading && attempt) {
      const updateTimerOnServer = async () => {
        try {
          await examService.updateTimeRemaining(attempt._id, timeRemaining);
        } catch (error) {
          console.error('Error updating time remaining:', error);
        }
      };

      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // Update time on server every 30 seconds
          if (newTime % 30 === 0) {
            updateTimerOnServer();
          }
          
          // Time has expired
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            setTimeExpired(true);
            submitExamOnTimeout();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          
          // Save time remaining when component unmounts
          updateTimerOnServer();
        }
      };
    }
  }, [timeRemaining, loading, attempt]);
  
  // Auto-submit exam when time expires
  const submitExamOnTimeout = async () => {
    if (!attempt) return;
    
    try {
      await examService.submitExam(attempt._id);
      toast.warning('Time expired! Your exam has been automatically submitted.');
      navigate(`/exams/result/${attempt._id}`);
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      toast.error('Failed to submit your answers. Please contact support.');
    }
  };
  
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
  
  // Initialize sections and questions from exam and attempt data
  const initializeSections = (exam, attempt) => {
    if (!exam || !exam.sections || !attempt) return;
    
    const sectionsData = [];
    const answersMap = {};
    
    exam.sections.forEach(section => {
      const sectionData = {
        id: section._id,
        title: section.title,
        questions: []
      };
      
      // Find corresponding section in attempt
      const attemptSection = attempt.sections.find(s => s.sectionId === section._id);
      
      if (section.questions && section.questions.length > 0) {
        section.questions.forEach(question => {
          // Find corresponding answer in attempt
          const answer = attemptSection?.answers.find(a => a.questionId === question._id);
          
          // Add question to section
          sectionData.questions.push({
            id: question._id,
            question: question.question,
            type: question.type,
            options: question.options,
            marks: question.marks
          });
          
          // Store answer if it exists
          if (answer) {
            if (question.type === 'mcq' && answer.selectedOption !== null) {
              answersMap[question._id] = answer.selectedOption;
            } else if (question.type === 'subjective' && answer.answer) {
              answersMap[question._id] = answer.answer;
            }
          }
        });
      }
      
      sectionsData.push(sectionData);
    });
    
    setSections(sectionsData);
    setAnswers(answersMap);
  };

  // Handle answer change and save progress
  const handleAnswerChange = async (questionId, value) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // Debounce saving answers to avoid too many API calls
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      
      saveTimeout.current = setTimeout(() => {
        saveExamProgress(newAnswers);
      }, 2000); // Wait 2 seconds after last change before saving
      
      return newAnswers;
    });
  };
  
  // Save exam progress to the server
  const saveExamProgress = async (currentAnswers = answers) => {
    if (!attempt || !exam) return;
    
    try {
      setIsSaving(true);
      
      // Format data for saving
      const sectionsData = sections.map(section => {
        const sectionAnswers = section.questions.map(question => {
          const answer = {
            questionId: question.id,
            selectedOption: null,
            answer: ''
          };
          
          if (question.type === 'mcq') {
            answer.selectedOption = currentAnswers[question.id] !== undefined ? 
              currentAnswers[question.id] : null;
          } else {
            answer.answer = currentAnswers[question.id] || '';
          }
          
          return answer;
        });
        
        return {
          sectionId: section.id,
          answers: sectionAnswers
        };
      });
      
      await examService.saveExamProgress(attempt._id, { sections: sectionsData });
      setLastSaved(new Date());
      toast.success('Progress saved', { autoClose: 1000 });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle final submission
  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Save answers one last time before submitting
      await saveExamProgress();
      
      // Submit the exam
      await examService.submitExam(attempt._id);
      
      toast.success('Exam submitted successfully!');
      setSubmitted(true);
      
      // Navigate to results page
      navigate(`/exams/result/${attempt._id}`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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