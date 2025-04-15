import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Badge,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  CardActions,
  LinearProgress,
  FormHelperText,
  InputAdornment,
  Container,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  School,
  Timer,
  EmojiEvents,
  History,
  Add,
  PlayArrow,
  AccessTime,
  Check,
  Close,
  FullscreenExit,
  Help,
  Visibility,
  QuestionAnswer,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import practiceService from "../../services/practiceService";
import "./StudentPractice.css";
import { useParams, useNavigate } from "react-router-dom";

const difficultyLevels = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

// Global styles for pulse animation and fullscreen practice
const globalStyles = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .question-feedback {
    transition: all 0.3s ease;
  }
  
  .question-feedback.correct {
    background-color: rgba(76, 175, 80, 0.1);
    border-left: 4px solid #4caf50;
  }
  
  .question-feedback.incorrect {
    background-color: rgba(244, 67, 54, 0.1);
    border-left: 4px solid #f44336;
  }
  
  .question-card {
    transition: all 0.3s ease;
    margin-bottom: 16px;
  }
  
  .question-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .practice-form-card:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
`;

const StudentPractice = ({ fullScreenMode = false, practiceId = null }) => {
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
  const [fullScreen, setFullScreen] = useState(fullScreenMode || false);
  const [timer, setTimer] = useState(null);
  const timerIntervalRef = useRef(null);
  const { practiceId: urlPracticeId } = useParams();
  const navigate = useNavigate();

  const [practiceParams, setPracticeParams] = useState({
    courseId: "",
    difficulty: "medium",
    numberOfQuestions: 5,
  });

  const [historyFilters, setHistoryFilters] = useState({
    status: "all",
    courseId: "all",
  });

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(true);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
        console.error("Failed to fetch enrolled courses:", error);
        toast.error("Could not load your enrolled courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch practice history when tab changes to history or after completing a practice
  useEffect(() => {
    if (activeTab === 1) {
      fetchPracticeHistory();
    }
  }, [activeTab]);
  
  // Refresh history after submitting practice
  useEffect(() => {
    if (practiceComplete) {
      // Refresh practice history when a practice is completed
      fetchPracticeHistory();
    }
  }, [practiceComplete]);

  const fetchPracticeHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await practiceService.getPracticeHistory();
      console.log('Practice history response:', response);
      
      // Check if response exists and has the expected format
      if (response && Array.isArray(response)) {
        setPracticeHistory(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Handle case where data might be nested in a data property
        setPracticeHistory(response.data);
      } else {
        console.error('Unexpected practice history format:', response);
        setPracticeHistory([]);
        toast.error("Couldn't load practice history: unexpected data format");
      }
    } catch (error) {
      console.error("Failed to fetch practice history:", error);
      setPracticeHistory([]);
      toast.error("Could not load your practice history");
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
      [e.target.name]: e.target.value,
    });
  };

  const handleGeneratePractice = async () => {
    if (!practiceParams.courseId) {
      toast.error("Please select a course first");
      return;
    }

    try {
      setGenerating(true);

      // Convert question count to number if it's a string
      const params = {
        ...practiceParams,
        numberOfQuestions: parseInt(practiceParams.numberOfQuestions),
      };

      const response = await practiceService.generatePractice(params);
      console.log(response);

      if (response) {
        console.log("Practice generated:", response);
        // Navigate to the fullscreen practice
        navigate(`/practice/${response._id}`);
      }
    } catch (error) {
      console.error("Failed to generate practice:", error);
      toast.error(
        error.response?.data?.message ||
          "Could not generate practice questions. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // If in fullScreenMode and practiceId is provided, load that practice automatically
  useEffect(() => {
    if (fullScreenMode && urlPracticeId) {
      handleLoadPractice(urlPracticeId);
    }
  }, [fullScreenMode, urlPracticeId]);

  const handleLoadPractice = async (practiceId) => {
    if (!fullScreenMode) {
      // If we're not in fullscreen mode, redirect to the fullscreen route
      navigate(`/practice/${practiceId}`);
      return;
    }
    
    try {
      setLoadingPractice(true);
      
      // Start the practice to initialize timer
      const response = await practiceService.startPractice(practiceId);

      if (response) {
        setPractice(response);
        setFullScreen(true);

        // Initialize user answers object
        const answers = {};
        if (response.isCompleted) {
          // If practice is already completed, use the saved answers
          response.questions.forEach((q, index) => {
            const optionIndex = q.options.findIndex(
              (opt) => opt === q.userAnswer
            );
            answers[index] = optionIndex >= 0 ? optionIndex : null;
          });
          setPracticeComplete(true);
          const score = Math.round(
            (response.correctAnswers / response.questions.length) * 100
          );
          setScore(score);
        } else {
          // If practice is not completed, initialize empty answers
          response.questions.forEach((q, index) => {
            answers[index] = null;
          });
          setPracticeComplete(false);
          setScore(null);
          
          // Set timer
          const timerValue = response.timeRemaining || response.timeLimit || response.questions.length * 60;
          console.log("Setting timer value:", timerValue);
          setTimer(timerValue);
          
          // Start the timer
          if (timerValue > 0) {
            startTimer(response._id);
          }
        }

        setUserAnswers(answers);
        setActiveTab(0); // Switch to the quiz tab
      }
    } catch (error) {
      console.error("Failed to load practice:", error);
      toast.error("Could not load the selected practice quiz");
    } finally {
      setLoadingPractice(false);
    }
  };
  
  // Start the timer
  const startTimer = (practiceId) => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    console.log("Starting timer for practice ID:", practiceId);
    
    // Create new timer interval
    timerIntervalRef.current = setInterval(() => {
      setTimer((prevTime) => {
        console.log("Timer tick:", prevTime);
        if (prevTime <= 0) {
          clearInterval(timerIntervalRef.current);
          handleSubmitPractice(true);
          return 0;
        }
        
        const newTime = prevTime - 1;
        
        // Save time to server every 30 seconds
        if (newTime % 30 === 0) {
          practiceService.updateTimeRemaining(practiceId, newTime)
            .catch(err => console.error("Error updating time:", err));
        }
        
        return newTime;
      });
    }, 1000);
  };
  
  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: optionIndex,
    });
  };

  // Submit practice answers
  const handleSubmitPractice = async (autoSubmit = false) => {
    if (!practice) return;

    try {
      // Check if we need to show the confirmation dialog
      if (!autoSubmit && !showSubmitDialog) {
        // Calculate if all questions are answered
        const answeredCount = Object.values(userAnswers).filter(val => val !== null).length;
        const allAnswered = answeredCount === practice.questions.length;
        setAllQuestionsAnswered(allAnswered);
        setShowSubmitDialog(true);
        return;
      }
      
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      setSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers = Object.entries(userAnswers).map(([questionIndex, optionIndex]) => {
        const question = practice.questions[parseInt(questionIndex)];
        return {
          questionId: question._id,
          answer: optionIndex !== null ? question.options[optionIndex] : null
        };
      }).filter(a => a.answer !== null);

      // Call API to submit answers
      const response = await practiceService.submitPracticeAttempt(
        practice._id,
        formattedAnswers
      );

      console.log("Practice submission response:", response);
      
      // Update UI with results
      setPractice(response);
      setPracticeComplete(true);
      
      // Calculate score
      const score = Math.round(
        (response.correctAnswers / response.questions.length) * 100
      );
      setScore(score);
      
      // Show success message
      toast.success(
        autoSubmit 
          ? "Time's up! Your practice has been submitted automatically." 
          : "Practice submitted successfully!"
      );
      
      // Display toast with score
      setTimeout(() => {
        toast.info(`You scored ${score}% (${response.correctAnswers}/${response.questions.length} correct)`);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to submit practice:", error);
      toast.error("Failed to submit your practice answers. Please try again.");
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
    const course = courses.find((c) => c.id === courseId || c._id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Filter practice history based on selected filters
  const filteredPracticeHistory = useMemo(() => {
    if (!practiceHistory || !Array.isArray(practiceHistory)) {
      return [];
    }

    return practiceHistory.filter(item => {
      // Filter by status
      if (historyFilters.status !== 'all') {
        if (historyFilters.status === 'completed' && !item.isCompleted) {
          return false;
        }
        if (historyFilters.status === 'pending' && item.isCompleted) {
          return false;
        }
      }

      // Filter by course
      if (historyFilters.courseId !== 'all') {
        // Handle both string IDs and object IDs
        const itemCourseId = typeof item.courseId === 'object' ? 
          (item.courseId?._id || item.courseId?.id) : 
          item.courseId;
          
        if (itemCourseId !== historyFilters.courseId) {
          return false;
        }
      }

      return true;
    });
  }, [practiceHistory, historyFilters]);

  // Render practice history
  const renderPracticeHistory = () => (
    <Box className="practice-history">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Your Practice History</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={historyFilters.status}
              onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">In Progress</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Course</InputLabel>
            <Select
              value={historyFilters.courseId}
              onChange={(e) => setHistoryFilters({ ...historyFilters, courseId: e.target.value })}
              label="Course"
            >
              <MenuItem value="all">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id || course._id} value={course.id || course._id}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loadingHistory ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredPracticeHistory.length > 0 ? (
        <Grid container spacing={2}>
          {filteredPracticeHistory.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ pb: 0 }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    background: item.isCompleted ? 
                      `linear-gradient(135deg, ${
                        item.correctAnswers / item.numberOfQuestions >= 0.8
                          ? '#4caf50'
                          : item.correctAnswers / item.numberOfQuestions >= 0.6
                          ? '#ff9800'
                          : '#f44336'
                      } 50%, transparent 50%)` : 
                      'none',
                    width: '40px',
                    height: '40px'
                  }} />
                  
                  <Typography variant="h6" sx={{ mb: 1, pr: 4 }}>
                    {item.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <School fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {getCourseName(item.courseId)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Help fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {item.numberOfQuestions} questions • {item.difficulty} difficulty
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {item.isCompleted
                        ? `Completed: ${formatDate(item.completedAt)}`
                        : `Started: ${formatDate(item.createdAt)}`}
                    </Typography>
                  </Box>
                  
                  {item.isCompleted && (
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Score:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={
                            item.correctAnswers / item.numberOfQuestions >= 0.8
                              ? "success.main"
                              : item.correctAnswers / item.numberOfQuestions >= 0.6
                              ? "warning.main"
                              : "error.main"
                          }
                        >
                          {Math.round((item.correctAnswers / item.numberOfQuestions) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate"
                        value={(item.correctAnswers / item.numberOfQuestions) * 100}
                        color={
                          item.correctAnswers / item.numberOfQuestions >= 0.8
                            ? "success"
                            : item.correctAnswers / item.numberOfQuestions >= 0.6
                            ? "warning"
                            : "error"
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={item.isCompleted ? <Visibility /> : <PlayArrow />}
                    onClick={() => handleLoadPractice(item._id)}
                    disabled={loadingPractice}
                  >
                    {item.isCompleted ? "Review" : "Continue"}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : historyFilters.status !== 'all' || historyFilters.courseId !== 'all' ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No practice quizzes found with the selected filters.
          </Alert>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => setHistoryFilters({ status: 'all', courseId: 'all' })}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : practiceHistory.length > 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No practice quizzes found with the selected filters.
          </Alert>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => setHistoryFilters({ status: 'all', courseId: 'all' })}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            You haven't completed any practice quizzes yet.
          </Alert>
          <Typography variant="body1" gutterBottom>
            Start practicing now to see your history here!
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setActiveTab(0)}
            sx={{ mt: 2 }}
          >
            Create a Practice Quiz
          </Button>
        </Paper>
      )}
    </Box>
  );

  // Render the practice form
  const renderPracticeForm = () => (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6
        }
      }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
          Generate Practice Questions
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select a course, difficulty level, and number of questions to generate a personalized practice quiz.
          </Typography>
        </Box>

        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel>Select Course</InputLabel>
          <Select
            name="courseId"
            value={practiceParams.courseId}
            onChange={handleParamChange}
            label="Select Course"
            disabled={loading || generating}
          >
            {courses.map((course) => (
              <MenuItem
                key={course.id || course._id}
                value={course.id || course._id}
              >
                {course.title}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Choose a course you're enrolled in</FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel>Difficulty Level</InputLabel>
          <Select
            name="difficulty"
            value={practiceParams.difficulty}
            onChange={handleParamChange}
            label="Difficulty Level"
            disabled={generating}
          >
            {difficultyLevels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Select a challenge level appropriate for your knowledge</FormHelperText>
        </FormControl>

        <TextField
          name="numberOfQuestions"
          label="Number of Questions"
          type="number"
          fullWidth
          margin="normal"
          variant="outlined"
          value={practiceParams.numberOfQuestions}
          onChange={handleParamChange}
          InputProps={{ 
            inputProps: { min: 1, max: 20 },
            startAdornment: (
              <InputAdornment position="start">
                <QuestionAnswer color="action" fontSize="small" />
              </InputAdornment>
            )
          }}
          helperText={`Time limit: approximately ${practiceParams.numberOfQuestions} minute${practiceParams.numberOfQuestions !== 1 ? 's' : ''}`}
          disabled={generating}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || generating || !practiceParams.courseId}
          onClick={handleGeneratePractice}
          startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <Add />}
          sx={{ mt: 3, mb: 1, py: 1 }}
        >
          {generating ? "Generating..." : "Generate Practice"}
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
              {practice.questions.length} questions • {practice.difficulty}{" "}
              difficulty
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: "right" }}>
            <Chip
              icon={<School />}
              label={getCourseName(practice.courseId)}
              color="primary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            {timer !== null && (
              <Chip 
                icon={<Timer />} 
                label={formatTime(timer)}
                color={timer < 60 ? "error" : timer < 180 ? "warning" : "primary"}
                variant={timer < 60 ? "filled" : "outlined"}
                sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 'bold',
                  height: 'auto', 
                  padding: '10px',
                  animation: timer < 60 ? 'pulse 1s infinite' : 'none'
                }}
              />
            )}
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
                value={
                  userAnswers[questionIndex] !== null
                    ? userAnswers[questionIndex].toString()
                    : ""
                }
                onChange={(e) =>
                  handleAnswerChange(questionIndex, parseInt(e.target.value))
                }
              >
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    value={optionIndex.toString()}
                    control={<Radio />}
                    label={option}
                    className={
                      practiceComplete
                        ? question.correctAnswer === option
                          ? "correct-answer"
                          : userAnswers[questionIndex] === optionIndex &&
                            question.correctAnswer !== option
                          ? "incorrect-answer"
                          : ""
                        : ""
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {practiceComplete && (
              <Box className="answer-feedback" mt={2}>
                {question.correctAnswer ===
                question.options[userAnswers[questionIndex]] ? (
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
          onClick={() => handleSubmitPractice(false)}
          className="submit-button"
        >
          {submitting ? <CircularProgress size={24} /> : "Submit Answers"}
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
                {score >= 80
                  ? "Excellent job!"
                  : score >= 60
                  ? "Good effort! Keep practicing."
                  : "You might want to review this material and try again."}
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

  // Handle exiting fullscreen mode
  const handleExitFullScreen = () => {
    // Ask for confirmation if the quiz is not completed
    if (!practiceComplete && practice) {
      if (window.confirm("Are you sure you want to exit? Your progress will be saved.")) {
        if (fullScreenMode) {
          // If directly loaded in fullscreen mode, go back to practice list
          navigate('/practice');
        } else {
          setFullScreen(false);
        }
      }
    } else {
      if (fullScreenMode) {
        navigate('/practice');
      } else {
        setFullScreen(false);
      }
    }
  };

  // Main render with fullscreen support
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <style>{globalStyles}</style>
      
      {/* Header section with navigation and tabs */}
      {fullScreenMode ? (
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={handleExitFullScreen}
              aria-label="exit fullscreen"
            >
              <FullscreenExit />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
              Practice Mode
            </Typography>
            {timer !== null && (
              <Chip 
                icon={<Timer />} 
                label={formatTime(timer)}
                color={timer < 60 ? "error" : timer < 180 ? "warning" : "primary"}
                variant={timer < 60 ? "filled" : "outlined"}
                sx={{ 
                  fontSize: '1rem', 
                  fontWeight: 'bold',
                  height: 'auto', 
                  padding: '8px',
                  animation: timer < 60 ? 'pulse 1s infinite' : 'none',
                  mr: 2
                }}
              />
            )}
          </Toolbar>
        </AppBar>
      ) : (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            aria-label="practice tabs"
            sx={{ 
              '& .MuiTab-root': {
                fontWeight: 'medium',
                px: 4,
                py: 2
              }
            }}
          >
            <Tab 
              icon={<School fontSize="small" />} 
              iconPosition="start"
              label="Generate Practice" 
            />
            <Tab 
              icon={<History fontSize="small" />} 
              iconPosition="start"
              label="Practice History" 
              sx={{ 
                '& .MuiBadge-badge': {
                  right: -16,
                  top: -2,
                }
              }}
            />
          </Tabs>
        </Box>
      )}

      {/* Loading state for initial data */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      ) : fullScreen ? (
        /* Full-screen practice quiz */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {renderPracticeQuestions()}
        </Box>
      ) : (
        /* Practice form and history tabs */
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: { xs: 1, sm: 2, md: 3 },
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : 'grey.50'
        }}>
          <Container maxWidth="lg">
            {activeTab === 0 ? renderPracticeForm() : renderPracticeHistory()}
          </Container>
        </Box>
      )}

      {/* Submit confirmation dialog */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        aria-labelledby="submit-dialog-title"
      >
        <DialogTitle id="submit-dialog-title">
          Submit Practice Quiz?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your answers? This action cannot be undone.
            {!allQuestionsAnswered && (
              <Typography color="error" sx={{ mt: 1 }}>
                Warning: You have {practice?.questions?.length - Object.values(userAnswers).filter(Boolean).length} unanswered questions.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSubmitDialog(false)} 
            color="primary"
          >
            Continue Quiz
          </Button>
          <Button 
            onClick={() => {
              setShowSubmitDialog(false);
              handleSubmitPractice();
            }} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Submit Quiz
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentPractice;
