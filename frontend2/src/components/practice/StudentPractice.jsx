import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
  Paper,
  Alert,
  Grid,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material';
import { School, Timer, EmojiEvents, History, Add, PlayArrow, AccessTime, Check } from '@mui/icons-material';
import { toast } from 'react-toastify';
import practiceService from '../../services/practiceService';
import './StudentPractice.css';

const difficultyLevels = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const StudentPractice = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [courses, setCourses] = useState([]);
  const [practice, setPractice] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [score, setScore] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [practiceHistory, setPracticeHistory] = useState([]);
  
  const [practiceParams, setPracticeParams] = useState({
    courseId: '',
    difficulty: 'medium',
    numberOfQuestions: 5
  });

  // Fetch enrolled courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await practiceService.getEnrolledCourses();
        if (response.data) {
          setCourses(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
        toast.error('Could not load your enrolled courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch practice history
  useEffect(() => {
    if (activeTab === 1) {
      fetchPracticeHistory();
    }
  }, [activeTab]);

  const fetchPracticeHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await practiceService.getPracticeHistory();
      if (response) {
        setPracticeHistory(response);
      }
    } catch (error) {
      console.error('Failed to fetch practice history:', error);
      toast.error('Could not load your practice history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleParamChange = (e) => {
    setPracticeParams({
      ...practiceParams,
      [e.target.name]: e.target.value
    });
  };

  const handleGeneratePractice = async () => {
    if (!practiceParams.courseId) {
      toast.error('Please select a course first');
      return;
    }

    try {
      setGenerating(true);
      
      // Convert question count to number if it's a string
      const params = {
        ...practiceParams,
        numberOfQuestions: parseInt(practiceParams.numberOfQuestions)
      };
      
      const response = await practiceService.generatePractice(params);
      
      if (response) {
        console.log('Practice generated:', response);
        setPractice(response);
        // Initialize user answers object
        const answers = {};
        response.questions.forEach((q, index) => {
          answers[index] = null;
        });
        setUserAnswers(answers);
        setPracticeComplete(false);
        setScore(null);
      }
    } catch (error) {
      console.error('Failed to generate practice:', error);
      toast.error(error.response?.data?.message || 'Could not generate practice questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLoadPractice = async (practiceId) => {
    try {
      setLoadingPractice(true);
      const response = await practiceService.getPracticeById(practiceId);
      
      if (response) {
        setPractice(response);
        
        // Initialize user answers object
        const answers = {};
        if (response.isCompleted) {
          // If practice is already completed, use the saved answers
          response.questions.forEach((q, index) => {
            const optionIndex = q.options.findIndex(opt => opt === q.userAnswer);
            answers[index] = optionIndex >= 0 ? optionIndex : null;
          });
          setPracticeComplete(true);
          const score = Math.round((response.correctAnswers / response.questions.length) * 100);
          setScore(score);
        } else {
          // If practice is not completed, initialize empty answers
          response.questions.forEach((q, index) => {
            answers[index] = null;
          });
          setPracticeComplete(false);
          setScore(null);
        }
        
        setUserAnswers(answers);
        setActiveTab(0); // Switch to the quiz tab
      }
    } catch (error) {
      console.error('Failed to load practice:', error);
      toast.error('Could not load the selected practice quiz');
    } finally {
      setLoadingPractice(false);
    }
  };

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: optionIndex
    });
  };

  const handleSubmitPractice = async () => {
    // Check if all questions are answered
    const unansweredQuestions = Object.values(userAnswers).filter(ans => ans === null).length;
    
    if (unansweredQuestions > 0) {
      toast.warning(`You have ${unansweredQuestions} unanswered questions. Are you sure you want to submit?`);
      return;
    }

    try {
      setSubmitting(true);
      const answersArray = Object.entries(userAnswers).map(([questionIndex, optionIndex]) => ({
        questionId: practice.questions[parseInt(questionIndex)]._id,
        answer: practice.questions[parseInt(questionIndex)].options[optionIndex]
      }));
      
      const response = await practiceService.submitPracticeAttempt(practice._id, answersArray);
      
      if (response) {
        setPracticeComplete(true);
        // Calculate score as percentage
        const score = Math.round((response.correctAnswers / response.questions.length) * 100);
        setScore(score);
        toast.success('Practice submitted successfully!');
        fetchPracticeHistory(); // Refresh the history
      }
    } catch (error) {
      console.error('Failed to submit practice:', error);
      toast.error(error.response?.data?.message || 'Could not submit your practice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPractice = () => {
    setPractice(null);
    setPracticeComplete(false);
    setScore(null);
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId || c._id === courseId);
    return course ? course.title : 'Unknown Course';
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render practice history
  const renderPracticeHistory = () => (
    <Box className="practice-history">
      <Typography variant="h6" gutterBottom>
        Your Practice History
      </Typography>
      
      {loadingHistory ? (
        <Box className="loading-state">
          <CircularProgress size={30} />
          <Typography>Loading your practice history...</Typography>
        </Box>
      ) : practiceHistory.length === 0 ? (
        <Alert severity="info">
          You haven't completed any practice quizzes yet. Start practicing to see your history!
        </Alert>
      ) : (
        <List className="history-list">
          {practiceHistory.map((item) => (
            <ListItem 
              key={item._id} 
              className={`history-item ${item.isCompleted ? 'completed' : 'incomplete'}`}
            >
              <ListItemIcon>
                {item.isCompleted ? (
                  <Badge 
                    badgeContent={`${Math.round((item.correctAnswers / item.numberOfQuestions) * 100)}%`} 
                    color={
                      (item.correctAnswers / item.numberOfQuestions) >= 0.8 ? "success" : 
                      (item.correctAnswers / item.numberOfQuestions) >= 0.6 ? "warning" : "error"
                    }
                  >
                    <Check color="primary" />
                  </Badge>
                ) : (
                  <AccessTime color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textSecondary">
                      {item.isCompleted 
                        ? `Completed: ${formatDate(item.completedAt)}` 
                        : `Started: ${formatDate(item.createdAt)}`}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="textSecondary">
                      {item.numberOfQuestions} questions • {item.difficulty} difficulty
                    </Typography>
                  </>
                }
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => handleLoadPractice(item._id)}
                disabled={loadingPractice}
              >
                {item.isCompleted ? 'Review' : 'Continue'}
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  // Render the practice form
  const renderPracticeForm = () => (
    <Card className="practice-form-card">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Generate Practice Questions
        </Typography>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Course</InputLabel>
          <Select
            name="courseId"
            value={practiceParams.courseId}
            onChange={handleParamChange}
            label="Select Course"
            disabled={loading || generating}
          >
            {courses.map(course => (
              <MenuItem key={course.id || course._id} value={course.id || course._id}>
                {course.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Difficulty Level</InputLabel>
          <Select
            name="difficulty"
            value={practiceParams.difficulty}
            onChange={handleParamChange}
            label="Difficulty Level"
            disabled={generating}
          >
            {difficultyLevels.map(level => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          name="numberOfQuestions"
          label="Number of Questions"
          type="number"
          fullWidth
          margin="normal"
          value={practiceParams.numberOfQuestions}
          onChange={handleParamChange}
          InputProps={{ inputProps: { min: 1, max: 20 } }}
          disabled={generating}
        />
        
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || generating || !practiceParams.courseId}
          onClick={handleGeneratePractice}
          startIcon={<Add />}
          sx={{ mt: 2 }}
        >
          {generating ? <CircularProgress size={24} /> : 'Generate Practice'}
        </Button>
      </CardContent>
    </Card>
  );

  // Render the practice questions
  const renderPracticeQuestions = () => (
    <Box className="practice-questions">
      <Paper className="practice-header">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5">
              Practice: {getCourseName(practice.courseId)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {practice.questions.length} questions • {practice.difficulty} difficulty
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Chip 
              icon={<School />} 
              label={getCourseName(practice.courseId)} 
              color="primary" 
              variant="outlined" 
              sx={{ mr: 1 }}
            />
            <Chip 
              icon={<Timer />} 
              label="No time limit" 
              variant="outlined" 
            />
          </Grid>
        </Grid>
      </Paper>

      {practice.questions.map((question, questionIndex) => (
        <Card key={questionIndex} className="question-card">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {questionIndex + 1}. {question.question}
            </Typography>
            
            <FormControl component="fieldset" disabled={practiceComplete}>
              <RadioGroup
                value={userAnswers[questionIndex] !== null ? userAnswers[questionIndex].toString() : ''}
                onChange={(e) => handleAnswerChange(questionIndex, parseInt(e.target.value))}
              >
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    value={optionIndex.toString()}
                    control={<Radio />}
                    label={option}
                    className={
                      practiceComplete && question.isCorrect && userAnswers[questionIndex] === optionIndex ? 'correct-answer' : 
                      (practiceComplete && !question.isCorrect && userAnswers[questionIndex] === optionIndex ? 'incorrect-answer' : '')
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>
            
            {practiceComplete && (
              <Box className="answer-feedback" mt={2}>
                {question.isCorrect ? (
                  <Alert severity="success">Correct! Well done!</Alert>
                ) : (
                  <Alert severity="error">
                    Incorrect. The correct answer is: {question.correctAnswer}
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {!practiceComplete ? (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={submitting}
          onClick={handleSubmitPractice}
          className="submit-button"
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit Answers'}
        </Button>
      ) : (
        <Card className="results-card">
          <CardContent>
            <Box textAlign="center">
              <EmojiEvents color="primary" sx={{ fontSize: 60 }} />
              <Typography variant="h5" gutterBottom>
                Practice Complete!
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                Your Score: {score}%
              </Typography>
              <Typography variant="body1" paragraph>
                {score >= 80 ? 'Excellent job!' : 
                 score >= 60 ? 'Good effort! Keep practicing.' : 
                 'You might want to review this material and try again.'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNewPractice}
              >
                Practice Again
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Main render
  return (
    <Box className="student-practice-container">
      <Typography variant="h4" className="page-title">
        Practice Questions
      </Typography>
      <Typography variant="body1" className="page-description">
        Generate AI-powered practice questions based on your enrolled courses to test your knowledge.
      </Typography>
      
      {practice ? (
        // Show practice quiz
        renderPracticeQuestions()
      ) : (
        // Show tabs when no active practice
        <Box className="practice-content">
          {loading ? (
            <Box className="loading-state">
              <CircularProgress />
              <Typography>Loading your courses...</Typography>
            </Box>
          ) : courses.length === 0 ? (
            <Alert severity="info" className="no-courses-alert">
              You are not enrolled in any courses. Please enroll in a course to practice.
            </Alert>
          ) : (
            <>
              <Paper className="tabs-container">
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab icon={<Add />} label="New Practice" />
                  <Tab icon={<History />} label="Practice History" />
                </Tabs>
              </Paper>
              
              <Box className="tab-content">
                {activeTab === 0 ? (
                  renderPracticeForm()
                ) : (
                  renderPracticeHistory()
                )}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StudentPractice; 