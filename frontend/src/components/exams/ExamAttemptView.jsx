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
  CircularProgress,
  TextField,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { examService } from '../../services/api';
import Sidebar from '../common/sidebar/Sidebar';
import { handleError, handleSuccess } from '../../utils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

function ExamAttemptView() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [marks, setMarks] = useState({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const isTeacher = localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('isTutor') === 'true';

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      setLoading(true);
      try {
        const attemptData = await examService.getExamAttempt(attemptId);
        if (attemptData) {
          setAttempt(attemptData);
          
          // Also fetch the exam details
          if (attemptData.examId) {
            const examData = await examService.getExamById(attemptData.examId);
            setExam(examData);
            
            // Flatten the questions for easier access
            const flattenedQuestions = [];
            examData.sections.forEach(section => {
              section.questions.forEach(question => {
                flattenedQuestions.push({
                  ...question,
                  sectionTitle: section.title
                });
              });
            });
            setQuestions(flattenedQuestions);
            
            // Initialize feedback and marks
            const feedbackObj = {};
            const marksObj = {};
            attemptData.answers.forEach(answer => {
              feedbackObj[answer.questionId] = answer.feedback || '';
              marksObj[answer.questionId] = answer.marks !== undefined ? answer.marks : '';
            });
            setFeedback(feedbackObj);
            setMarks(marksObj);
          }
        }
      } catch (error) {
        console.error('Error fetching attempt details:', error);
        handleError('Failed to load exam attempt details');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFeedbackChange = (questionId, value) => {
    setFeedback(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMarksChange = (questionId, value) => {
    // Ensure the value is a number and within range
    const numValue = value === '' ? '' : Number(value);
    const question = questions.find(q => q._id === questionId);
    
    if (numValue === '' || (numValue >= 0 && numValue <= question.marks)) {
      setMarks(prev => ({
        ...prev,
        [questionId]: numValue
      }));
    }
  };

  const handleSaveGrading = async () => {
    setSaving(true);
    
    try {
      // Validate that all subjective/file-upload questions have marks
      const incompleteGrading = questions.some(q => {
        if (q.type !== 'mcq') {
          const answer = attempt.answers.find(a => a.questionId === q._id);
          return answer && marks[q._id] === '';
        }
        return false;
      });
      
      if (incompleteGrading) {
        handleError('Please provide marks for all questions before submitting');
        setSaving(false);
        return;
      }
      
      const gradingData = attempt.answers.map(answer => {
        let updatedAnswer = {
          ...answer
        };
        
        if (marks[answer.questionId] !== undefined) {
          updatedAnswer.marks = Number(marks[answer.questionId]);
        }
        
        if (feedback[answer.questionId]) {
          updatedAnswer.feedback = feedback[answer.questionId];
        }
        
        return updatedAnswer;
      });
      
      const response = await examService.gradeExam(attemptId, { answers: gradingData });
      
      if (response) {
        handleSuccess('Exam graded successfully');
        setAttempt(response);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      handleError('Failed to save grading');
    } finally {
      setSaving(false);
      setConfirmSubmit(false);
    }
  };

  const getAnswerForQuestion = (questionId) => {
    return attempt?.answers?.find(a => a.questionId === questionId) || null;
  };

  const getSelectedOption = (question, answer) => {
    if (!question || !answer || !answer.selectedOption) return null;
    
    return question.options?.find(opt => opt._id === answer.selectedOption) || null;
  };

  const isCorrectMCQAnswer = (question, answer) => {
    if (!question || !answer || question.type !== 'mcq') return false;
    
    const selectedOption = getSelectedOption(question, answer);
    return selectedOption?.isCorrect || false;
  };

  const getTotalScore = () => {
    if (!attempt || !attempt.answers) return 0;
    
    return attempt.answers.reduce((total, answer) => {
      return total + (answer.marks || 0);
    }, 0);
  };

  const getPassFailStatus = () => {
    if (!exam || !attempt || attempt.status !== 'graded') return null;
    
    const totalScore = getTotalScore();
    const percentage = (totalScore / exam.totalMarks) * 100;
    const isPassed = percentage >= exam.passingPercentage;
    
    return (
      <Chip 
        label={isPassed ? 'PASSED' : 'FAILED'} 
        color={isPassed ? 'success' : 'error'}
        sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2, px: 1 }}
      />
    );
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

  const formatTime = (seconds) => {
    if (!seconds) return '0m 0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
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

  if (!exam || !attempt) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Alert severity="error">
            Exam attempt not found or you don't have permission to view it.
          </Alert>
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
            onClick={() => navigate(isTeacher ? `/exams/results/${exam._id}` : '/exams')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {exam.title} - Exam Result
          </Typography>
          
          {attempt.status === 'graded' && getPassFailStatus()}
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Result Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Student
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {attempt.studentId?.name || 'Unknown'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={attempt.status?.toUpperCase() || 'UNKNOWN'} 
                      color={
                        attempt.status === 'graded' ? 'success' : 
                        attempt.status === 'submitted' ? 'info' : 
                        attempt.status === 'in-progress' ? 'warning' : 
                        'default'
                      }
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Start Time
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(attempt.startTime)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Submit Time
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {attempt.submittedAt ? formatDate(attempt.submittedAt) : 'Not submitted'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Time Spent
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatTime(attempt.timeSpent)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Time Limit
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatTime(exam.duration * 60)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {attempt.status === 'graded' && (
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary" gutterBottom>
                      {getTotalScore()} / {exam.totalMarks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {((getTotalScore() / exam.totalMarks) * 100).toFixed(1)}% (Pass: {exam.passingPercentage}%)
                    </Typography>
                  </Box>
                )}
                
                {isTeacher && attempt.status !== 'in-progress' && attempt.status !== 'graded' && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => setConfirmSubmit(true)}
                    sx={{ mt: 2 }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Submit Grading'}
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Question Navigation</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
                  {questions.map((question, index) => {
                    const answer = getAnswerForQuestion(question._id);
                    const labelText = `Q${index + 1}: ${
                      question.type === 'mcq' ? 'Multiple Choice' : 
                      question.type === 'subjective' ? 'Subjective' : 
                      'File Upload'
                    }`;
                    
                    return (
                      <Step key={question._id}>
                        <StepLabel 
                          onClick={() => setActiveStep(index)}
                          sx={{ cursor: 'pointer' }}
                          StepIconProps={{
                            icon: index + 1,
                            active: activeStep === index
                          }}
                          optional={
                            question.type === 'mcq' && answer ? (
                              isCorrectMCQAnswer(question, answer) ? (
                                <Typography variant="caption" color="success.main">
                                  Correct
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="error.main">
                                  Incorrect
                                </Typography>
                              )
                            ) : null
                          }
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: activeStep === index ? 'bold' : 'normal',
                              color: activeStep === index ? 'primary.main' : 'text.primary'
                            }}
                          >
                            {labelText}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {question.marks} marks - {question.sectionTitle}
                          </Typography>
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            {questions[activeStep] && (
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">
                      Question {activeStep + 1} of {questions.length}
                    </Typography>
                    <Chip 
                      label={`${questions[activeStep].marks} marks`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    {questions[activeStep].questionText}
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    {(() => {
                      const question = questions[activeStep];
                      const answer = getAnswerForQuestion(question._id);
                      
                      if (question.type === 'mcq') {
                        const selectedOption = getSelectedOption(question, answer);
                        const isCorrect = isCorrectMCQAnswer(question, answer);
                        
                        return (
                          <Box>
                            <FormControl component="fieldset" fullWidth>
                              <FormLabel>Student Answer:</FormLabel>
                              <RadioGroup value={answer?.selectedOption || ''}>
                                {question.options?.map((option) => (
                                  <FormControlLabel
                                    key={option._id}
                                    value={option._id}
                                    control={
                                      <Radio 
                                        disabled
                                        color={
                                          option.isCorrect ? 'success' : 
                                          option._id === answer?.selectedOption && !option.isCorrect ? 'error' : 
                                          'primary'
                                        }
                                      />
                                    }
                                    label={
                                      <Box display="flex" alignItems="center">
                                        <Typography variant="body1">{option.text}</Typography>
                                        {option.isCorrect && (
                                          <CheckCircleIcon color="success" sx={{ ml: 1 }} fontSize="small" />
                                        )}
                                        {option._id === answer?.selectedOption && !option.isCorrect && (
                                          <CancelIcon color="error" sx={{ ml: 1 }} fontSize="small" />
                                        )}
                                      </Box>
                                    }
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>
                            
                            <Box sx={{ mt: 2 }}>
                              {answer ? (
                                <Alert severity={isCorrect ? 'success' : 'error'}>
                                  {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                                </Alert>
                              ) : (
                                <Alert severity="warning">Not Answered</Alert>
                              )}
                            </Box>
                          </Box>
                        );
                      } else if (question.type === 'subjective') {
                        return (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Student Answer:
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                              {answer?.answerText ? (
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                  {answer.answerText}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No answer provided
                                </Typography>
                              )}
                            </Paper>
                            
                            {isTeacher && (
                              <Box sx={{ mt: 3 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      label="Marks"
                                      type="number"
                                      value={marks[question._id]}
                                      onChange={(e) => handleMarksChange(question._id, e.target.value)}
                                      fullWidth
                                      InputProps={{ 
                                        inputProps: { 
                                          min: 0, 
                                          max: question.marks,
                                          step: 0.5
                                        } 
                                      }}
                                      helperText={`Out of ${question.marks} marks`}
                                      disabled={attempt.status === 'graded'}
                                    />
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={8}>
                                    <TextField
                                      label="Feedback"
                                      multiline
                                      rows={2}
                                      value={feedback[question._id] || ''}
                                      onChange={(e) => handleFeedbackChange(question._id, e.target.value)}
                                      fullWidth
                                      disabled={attempt.status === 'graded'}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                            
                            {!isTeacher && answer?.feedback && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Teacher Feedback:
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)' }}>
                                  <Typography variant="body2">
                                    {answer.feedback}
                                  </Typography>
                                </Paper>
                              </Box>
                            )}
                            
                            {!isTeacher && attempt.status === 'graded' && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Marks Awarded: 
                                  <Typography component="span" fontWeight="bold" color="primary" ml={1}>
                                    {answer?.marks !== undefined ? answer.marks : 0} / {question.marks}
                                  </Typography>
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      } else if (question.type === 'file-upload') {
                        return (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Student Submission:
                            </Typography>
                            
                            {answer?.fileUrl ? (
                              <Box sx={{ mb: 2 }}>
                                <Link href={answer.fileUrl} target="_blank" rel="noopener">
                                  <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                  >
                                    Download Submission
                                  </Button>
                                </Link>
                              </Box>
                            ) : (
                              <Alert severity="warning" sx={{ mb: 2 }}>
                                No file submitted
                              </Alert>
                            )}
                            
                            {isTeacher && (
                              <Box sx={{ mt: 3 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={4}>
                                    <TextField
                                      label="Marks"
                                      type="number"
                                      value={marks[question._id]}
                                      onChange={(e) => handleMarksChange(question._id, e.target.value)}
                                      fullWidth
                                      InputProps={{ 
                                        inputProps: { 
                                          min: 0, 
                                          max: question.marks,
                                          step: 0.5
                                        } 
                                      }}
                                      helperText={`Out of ${question.marks} marks`}
                                      disabled={attempt.status === 'graded'}
                                    />
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={8}>
                                    <TextField
                                      label="Feedback"
                                      multiline
                                      rows={2}
                                      value={feedback[question._id] || ''}
                                      onChange={(e) => handleFeedbackChange(question._id, e.target.value)}
                                      fullWidth
                                      disabled={attempt.status === 'graded'}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                            
                            {!isTeacher && answer?.feedback && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Teacher Feedback:
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)' }}>
                                  <Typography variant="body2">
                                    {answer.feedback}
                                  </Typography>
                                </Paper>
                              </Box>
                            )}
                            
                            {!isTeacher && attempt.status === 'graded' && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Marks Awarded: 
                                  <Typography component="span" fontWeight="bold" color="primary" ml={1}>
                                    {answer?.marks !== undefined ? answer.marks : 0} / {question.marks}
                                  </Typography>
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      }
                    })()}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      onClick={handleBack}
                      disabled={activeStep === 0}
                      startIcon={<NavigateBeforeIcon />}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      disabled={activeStep === questions.length - 1}
                      endIcon={<NavigateNextIcon />}
                    >
                      Next
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
      
      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
      >
        <DialogTitle>Submit Grading</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit the grading for this exam attempt? This will finalize the student's score and make the results visible to them.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGrading} 
            color="primary"
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Submitting...' : 'Confirm Submission'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExamAttemptView; 