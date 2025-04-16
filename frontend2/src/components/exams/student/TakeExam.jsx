import React, { useState, useEffect } from 'react';
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
  DialogTitle
} from '@mui/material';
import { 
  Timer as TimerIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import './TakeExam.css';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
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
  
  useEffect(() => {
    startExam();
  }, [examId]);
  
  // Timer effect
  useEffect(() => {
    let timer;
    
    if (attempt && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prevTime => {
          const newTime = prevTime - 1;
          
          // Save time remaining periodically (every 30 seconds)
          if (newTime % 30 === 0) {
            saveTimeRemaining(newTime);
          }
          
          // Auto-submit when time runs out
          if (newTime <= 0) {
            clearInterval(timer);
            // Show time's up notification
            toast.error("Time's up! Your exam is being submitted automatically.");
            
            // Auto-submit the exam and redirect to exams page
            (async () => {
              try {
                await handleSubmitExam();
                // We don't need to navigate here as handleSubmitExam already does that
              } catch (error) {
                console.error('Error auto-submitting exam:', error);
                // If we couldn't submit via handleSubmitExam, try direct API call
                try {
                  await examService.submitExam(attempt._id);
                  navigate('/exams');
                } catch (secondError) {
                  console.error('Second attempt to submit exam failed:', secondError);
                  toast.error('Failed to submit your exam. Please try manually.');
                }
              }
            })();
            
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [attempt, timeRemaining]);
  
  const startExam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Attempt to start the exam
      const response = await examService.startExam(examId);
      
      if (response.attempt) {
        // Set the attempt data
        setAttempt(response.attempt);
        
        // Initialize timeRemaining
        setTimeRemaining(response.attempt.timeRemaining);
        
        // Get exam details
        const examResponse = await examService.getExamById(examId);
        if (examResponse.exam) {
          setExam(examResponse.exam);
        }
        
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
      
      // Handle specific error codes
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        if (errorData.errorCode === 'NOT_PUBLISHED') {
          setError({
            title: 'Exam Not Available',
            message: 'This exam is not available yet. Please check back later.'
          });
        } 
        else if (errorData.errorCode === 'NOT_STARTED') {
          const startTime = new Date(errorData.startTime);
          setError({
            title: 'Exam Not Started',
            message: `This exam will start on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`
          });
        } 
        else if (errorData.errorCode === 'ALREADY_ENDED') {
          setError({
            title: 'Exam Ended',
            message: 'This exam has already ended and is no longer available.'
          });
        }
        else if (errorData.errorCode === 'ALREADY_COMPLETED') {
          setError({
            title: 'Exam Already Completed',
            message: 'You have already completed this exam.',
            redirectUrl: errorData.attemptId ? `/exams/result/${errorData.attemptId}` : '/exams',
            redirectLabel: 'View Result'
          });
        }
        else {
          setError({
            title: 'Error Starting Exam',
            message: errorData.message || 'Failed to start exam. Please try again.'
          });
        }
      } else {
        setError({
          title: 'Error',
          message: 'Failed to start exam. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const saveTimeRemaining = async (time) => {
    try {
      await examService.updateTimeRemaining(attempt._id, time);
    } catch (error) {
      console.error('Error saving time:', error);
    }
  };
  
  const handleSaveProgress = async () => {
    try {
      setLoadingSubmit(true);
      await examService.saveExamProgress(attempt._id, {
        answers,
        timeRemaining
      });
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setLoadingSubmit(false);
    }
  };
  
  const handleSubmitExam = async () => {
    try {
      // Save progress first
      await examService.saveExamProgress(attempt._id, {
        answers,
        timeRemaining
      });
      
      // Submit the exam
      setLoadingSubmit(true);
      await examService.submitExam(attempt._id);
      toast.success('Exam submitted successfully');
      navigate('/exams');
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setLoadingSubmit(false);
      setSubmitDialogOpen(false);
    }
  };
  
  const handleAnswerChange = (sectionId, questionId, value, type) => {
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
      
      return newAnswers;
    });
  };
  
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
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
        <Typography>Loading exam...</Typography>
      </Box>
    );
  }
  
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
  
  const currentSectionData = exam.sections[currentSection];
  const currentQuestionData = currentSectionData.questions[currentQuestion];
  
  // Calculate total questions and current progress
  const totalQuestions = exam.sections.reduce(
    (total, section) => total + section.questions.length, 
    0
  );
  
  // Calculate current question number overall
  const currentQuestionNumber = exam.sections.slice(0, currentSection).reduce(
    (count, section) => count + section.questions.length, 
    0
  ) + currentQuestion + 1;
  
  return (
    <Box className="take-exam-container">
      <Box className="exam-header">
        <Typography variant="h5" className="exam-title">
          {exam.title}
        </Typography>
        
        <Box className="exam-timer">
          <TimerIcon color={timeRemaining < 300 ? "error" : "primary"} />
          <Typography 
            variant="h6" 
            color={timeRemaining < 300 ? "error" : "primary"}
          >
            {formatTime(timeRemaining)}
          </Typography>
        </Box>
      </Box>
      
      <Box className="exam-progress">
        <Typography variant="body2">
          Question {currentQuestionNumber} of {totalQuestions}
        </Typography>
        <Typography variant="body2">
          Section: {currentSectionData.title}
        </Typography>
      </Box>
      
      <Grid container spacing={3} className="exam-content">
        <Grid item xs={12} md={8}>
          <Card className="question-card">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Question {currentQuestion + 1}: {currentQuestionData.marks} marks
              </Typography>
              
              <Typography variant="h6" className="question-text">
                {currentQuestionData.question}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
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
        
        <Grid item xs={12} md={4}>
          <Paper className="actions-panel">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveProgress}
              disabled={loadingSubmit}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loadingSubmit ? <CircularProgress size={24} /> : 'Save Progress'}
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckIcon />}
              onClick={() => setSubmitDialogOpen(true)}
              disabled={loadingSubmit}
              fullWidth
            >
              Submit Exam
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Question Navigation
            </Typography>
            
            {exam.sections.map((section, sIndex) => (
              <Box key={sIndex} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  {section.title}
                </Typography>
                
                <Box className="question-buttons">
                  {section.questions.map((_, qIndex) => {
                    const isAnswered = answers[section._id]?.[section.questions[qIndex]._id]?.answer || 
                                     answers[section._id]?.[section.questions[qIndex]._id]?.selectedOption !== null;
                    
                    return (
                      <Button
                        key={qIndex}
                        variant={currentSection === sIndex && currentQuestion === qIndex ? "contained" : "outlined"}
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
      
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
      >
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit this exam? Once submitted, you won't be able to make any changes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmitExam} color="primary" disabled={loadingSubmit}>
            {loadingSubmit ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeExam; 