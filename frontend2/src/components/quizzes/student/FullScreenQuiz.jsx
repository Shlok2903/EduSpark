import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  CircularProgress,
  Grid,
  Container,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Timer as TimerIcon,
  Quiz as QuizIcon
} from '@mui/icons-material';
import { quizService, courseService, enrollmentService } from '../../../services/api';

const FullScreenQuiz = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizInfo, setQuizInfo] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
  const [error, setError] = useState('');
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fetch quiz info
  const fetchQuizInfo = async () => {
    try {
      setLoading(true);
      
      // Get course info for breadcrumbs
      const courseResponse = await courseService.getCourseById(courseId);
      if (courseResponse.success && courseResponse.data) {
        setCourseTitle(courseResponse.data.title);
      }
      
      // Get quiz info without questions
      const response = await quizService.getQuizInfo(quizId);
      console.log('Quiz info:', response);
      setQuizInfo(response);
      setQuizTitle(response.quizInfo.title || 'Quiz');
      
    } catch (error) {
      console.error('Error fetching quiz info:', error);
      setError('Failed to load quiz information');
    } finally {
      setLoading(false);
    }
  };
  
  // Start quiz and fetch questions
  const startQuiz = async () => {
    try {
      setLoading(true);
      
      // 1. Start the quiz attempt
      const response = await quizService.startQuiz(quizId);
      
      if (response.attempt) {
        setQuizAttempt(response.attempt);
        
        // 2. Now fetch the questions securely from the server
        const questionsResponse = await quizService.getQuizQuestions(response.attempt._id);
        
        if (!questionsResponse.questions || questionsResponse.questions.length === 0) {
          throw new Error('No questions available for this quiz');
        }
        
        setQuizQuestions(questionsResponse.questions || []);
        
        // 3. Set up timer if the quiz has a time limit
        if (response.attempt.timeRemaining > 0) {
          setQuizTimer(response.attempt.timeRemaining);
          
          // Start the timer
          const intervalId = setInterval(() => {
            setQuizTimer(prevTime => {
              const newTime = prevTime - 1;
              
              // Save time to server every 30 seconds
              if (newTime % 30 === 0) {
                quizService.updateTimeRemaining(response.attempt._id, newTime)
                  .catch(err => console.error('Error updating time:', err));
              }
              
              // Auto-submit when time runs out
              if (newTime <= 0) {
                submitQuiz(response.attempt._id);
                clearInterval(intervalId);
                return 0;
              }
              
              return newTime;
            });
          }, 1000);
          
          setTimerInterval(intervalId);
        }
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      setError(error.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle quiz answer selection
  const handleQuizAnswer = (questionId, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionIndex,
    });
  };
  
  // Submit quiz
  const submitQuiz = async (attemptId) => {
    try {
      setLoading(true);
      
      // Clear timer interval if exists
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Save progress first
      await quizService.saveQuizProgress(attemptId, {
        answers: quizAnswers,
        timeRemaining: quizTimer || 0
      });
      
      // Submit the quiz
      const result = await quizService.submitQuiz(attemptId);
      
      // Update quiz results
      setQuizSubmitted(true);
      setQuizScore(result.attempt.percentage);
      
      // If passed, mark module as completed
      if (result.attempt.isPassed) {
        try {
          await enrollmentService.completeModule(courseId, quizId);
        } catch (err) {
          console.error('Error marking module as completed:', err);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };
  
  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);
  
  // Initialize component
  useEffect(() => {
    if (courseId && quizId) {
      fetchQuizInfo();
    }
  }, [courseId, quizId]);
  
  if (loading && !quizAttempt) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/courses" color="inherit">
          My Courses
        </Link>
        <Link component={RouterLink} to={`/courses/${courseId}`} color="inherit">
          {courseTitle}
        </Link>
        <Typography color="textPrimary">{quizTitle}</Typography>
      </Breadcrumbs>
      
      {/* Quiz Info Screen */}
      {!quizAttempt && quizInfo && (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/courses/${courseId}`)}
              sx={{ mr: 2 }}
            >
              Back to Course
            </Button>
            <Typography variant="h4">{quizTitle}</Typography>
          </Box>
          
          <Box sx={{ mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Number of Questions</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {quizInfo.quizInfo.totalQuestions}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Total Marks</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {quizInfo.quizInfo.totalMarks}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Passing Score</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {quizInfo.quizInfo.passingScore}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Time Limit</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {quizInfo.quizInfo.timer 
                    ? `${quizInfo.quizInfo.timer} minutes` 
                    : 'No time limit'}
                </Typography>
              </Grid>
              {quizInfo.quizInfo.maxAttempts > 0 && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Maximum Attempts</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {quizInfo.quizInfo.maxAttempts} 
                    {quizInfo.previousAttempts > 0 && 
                      ` (Used: ${quizInfo.previousAttempts})`}
                  </Typography>
                </Grid>
              )}
              
              {quizInfo.quizInfo.deadline && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">Deadline</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(quizInfo.quizInfo.deadline).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
          
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={startQuiz}
              startIcon={<QuizIcon />}
              disabled={quizInfo.maxAttemptsReached || quizInfo.isDeadlinePassed}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Start Quiz
            </Button>
          </Box>
          
          {quizInfo.maxAttemptsReached && (
            <Typography color="error" sx={{ mt: 3, textAlign: 'center' }}>
              You have reached the maximum number of attempts for this quiz.
            </Typography>
          )}
          
          {quizInfo.isDeadlinePassed && (
            <Typography color="error" sx={{ mt: 3, textAlign: 'center' }}>
              The deadline for this quiz has passed.
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Quiz Questions */}
      {quizAttempt && quizQuestions.length > 0 && !quizSubmitted && (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          {/* Quiz Header with Timer */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 4,
              pb: 2,
              borderBottom: '1px solid #eee'
            }}
          >
            <Typography variant="h5">
              {quizTitle}
            </Typography>
            
            {quizTimer > 0 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: quizTimer < 300 ? 'error.main' : 'primary.main',
                bgcolor: quizTimer < 300 ? 'error.light' : 'primary.light',
                px: 2,
                py: 1,
                borderRadius: 2
              }}>
                <TimerIcon sx={{ mr: 1 }} />
                <Typography variant="h6" fontFamily="monospace">
                  {formatTime(quizTimer)}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Questions */}
          <Box sx={{ mb: 4 }}>
            {quizQuestions.map((question, questionIndex) => (
              <Paper
                key={question._id || questionIndex}
                elevation={1}
                sx={{ 
                  mb: 3, 
                  p: 3, 
                  borderRadius: 2,
                  border: '1px solid #eee',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Question {questionIndex + 1} of {quizQuestions.length}
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                  {question.question}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" mb={2}>
                  {question.marks > 1 ? `${question.marks} marks` : '1 mark'}
                </Typography>
                
                <RadioGroup
                  value={quizAnswers[question._id] !== undefined ? 
                    quizAnswers[question._id] : ''}
                  onChange={(e) => handleQuizAnswer(question._id, Number(e.target.value))}
                >
                  {question.options.map((option, optionIndex) => (
                    <FormControlLabel
                      key={optionIndex}
                      value={optionIndex}
                      control={<Radio />}
                      label={option.text || option}
                      sx={{ 
                        mb: 1, 
                        p: 1, 
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                      }}
                    />
                  ))}
                </RadioGroup>
              </Paper>
            ))}
          </Box>
          
          {/* Bottom Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 4,
              pt: 2,
              borderTop: '1px solid #eee'
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              Save & Exit
            </Button>
            
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1, textAlign: 'right' }}>
                {Object.keys(quizAnswers).length} of {quizQuestions.length} questions answered
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => submitQuiz(quizAttempt._id)}
                disabled={loading}
                sx={{ minWidth: 150 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Submit Quiz'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Quiz Results */}
      {quizSubmitted && (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/courses/${courseId}`)}
              sx={{ mr: 2 }}
            >
              Back to Course
            </Button>
            <Typography variant="h4">Quiz Results</Typography>
          </Box>
          
          <Box
            sx={{
              p: 4,
              mb: 4,
              backgroundColor: quizScore >= (quizInfo?.quizInfo?.passingScore || 70) 
                ? 'success.light' 
                : 'error.light',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h3" gutterBottom>
              {quizScore}%
            </Typography>
            <Typography variant="h6">
              {quizScore >= (quizInfo?.quizInfo?.passingScore || 70)
                ? "Congratulations! You passed the quiz."
                : `You need ${quizInfo?.quizInfo?.passingScore || 70}% to pass this quiz.`}
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Questions</Typography>
              <Typography variant="body1" fontWeight="medium">
                {quizAttempt?.totalQuestions || quizQuestions.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Correct Answers</Typography>
              <Typography variant="body1" fontWeight="medium">
                {Math.round(quizScore * 
                  (quizAttempt?.totalQuestions || quizQuestions.length) / 100)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Time Taken</Typography>
              <Typography variant="body1" fontWeight="medium">
                {quizAttempt && quizAttempt.startTime && quizAttempt.endTime ? 
                  `${Math.round((new Date(quizAttempt.endTime) - new Date(quizAttempt.startTime)) / 60000)} minutes` 
                  : "N/A"}
              </Typography>
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/courses/${courseId}`)}
              sx={{ minWidth: 200 }}
            >
              Return to Course
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default FullScreenQuiz; 