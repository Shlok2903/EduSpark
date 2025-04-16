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
      
      // Clear existing history before fetching new data
      setPracticeHistory([]);
      
      // Fetch practice history from server
      const history = await practiceService.getPracticeHistory();
      console.log('Practice history response:', history);
      
      if (!history) {
        console.error('Failed to fetch practice history: No data returned');
        toast.error("Could not load practice history");
        return;
      }
      
      // Ensure we have an array of history items
      if (Array.isArray(history)) {
        setPracticeHistory(history);
      } else if (history.data && Array.isArray(history.data)) {
        setPracticeHistory(history.data);
      } else {
        console.error('Unexpected practice history format:', history);
        toast.error("Couldn't load practice history: unexpected data format");
      }
    } catch (error) {
      console.error("Failed to fetch practice history:", error);
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

  // If in fullScreenMode and practiceId is provided from URL, load that practice automatically
  useEffect(() => {
    if (fullScreenMode && urlPracticeId) {
      console.log("Auto-loading practice from URL param:", urlPracticeId);
      handleLoadPractice(urlPracticeId);
    }
  }, [fullScreenMode, urlPracticeId]);

  // Start the timer
  const startTimer = async (practiceId) => {
    try {
      // Only call the start practice API once to initialize/get timer
      const response = await practiceService.startPractice(practiceId);
      console.log("Practice started:", response);
      
      if (!response) {
        console.error("Failed to start practice: Invalid response");
        toast.error("Could not start practice timer");
        return;
      }
      
      // Check if practice has expired
      if (response.timeExpired) {
        console.log("Practice has expired, auto-submitting");
        toast.info(response.message || "This practice has expired. Auto-submitting with current answers.");
        
        // Update practice state
        setPractice(prev => ({
          ...prev,
          isCompleted: true,
          timeExpired: true
        }));
        
        // Auto-submit the practice
        await handleSubmitPractice(true);
        return;
      }
      
      // Update practice with the returned data
      setPractice(prevPractice => ({
        ...prevPractice,
        ...response
      }));
      
      // Calculate time remaining based on start time and time limit
      let timerValue;
      const now = new Date();
      const startTime = response.startTime ? new Date(response.startTime) : now;
      const timeLimit = response.timeLimit || (response.questions?.length * 60);
      
      // If the quiz has a start time, calculate remaining time
      if (response.startTime) {
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        timerValue = Math.max(0, timeLimit - elapsedSeconds);
        
        // If time has already expired, auto-submit
        if (timerValue <= 0) {
          console.log("Time already expired, auto-submitting");
          setTimer(0);
          handleSubmitPractice(true);
          return;
        }
      } else {
        // New practice, use full time limit
        timerValue = timeLimit;
      }
      
      console.log("Setting timer value:", timerValue);
      setTimer(timerValue);
      
      // Clear any existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Start the timer countdown WITHOUT sending constant API calls
      timerIntervalRef.current = setInterval(() => {
        setTimer(prevTimer => {
          // When timer reaches zero, auto-submit
          if (prevTimer <= 1) {
            clearInterval(timerIntervalRef.current);
            handleSubmitPractice(true);
            return 0;
          }
          
          return prevTimer - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error starting timer:", error);
      toast.error("Failed to start practice timer");
    }
  };
  
  // Function to check if a practice is expired
  const isPracticeExpired = (practice) => {
    if (!practice || !practice.startTime) return false;
    
    const now = new Date();
    const startTime = new Date(practice.startTime);
    const timeLimit = practice.timeLimit || (practice.questions?.length * 60);
    const endTime = new Date(startTime.getTime() + (timeLimit * 1000));
    
    // Return true only if the quiz has actually expired
    return now > endTime;
  };

  // Function to calculate remaining time in seconds
  const calculateRemainingTime = (practice) => {
    if (!practice || !practice.startTime) return 0;
    
    const now = new Date();
    const startTime = new Date(practice.startTime);
    const timeLimit = practice.timeLimit || (practice.questions?.length * 60);
    const endTime = new Date(startTime.getTime() + (timeLimit * 1000));
    
    return Math.max(0, Math.floor((endTime - now) / 1000));
  };

  // Update handleLoadPractice to redirect to full practice page when clicked from history
  const handleLoadPractice = async (practiceId) => {
    try {
      // If we're not in fullscreen mode, redirect to the fullscreen route
      if (!fullScreenMode) {
        console.log("Redirecting to full practice page:", practiceId);
        navigate(`/practice/${practiceId}`);
        return;
      }
      
      console.log("Loading practice:", practiceId);
      setLoadingPractice(true);
      setPractice(null);
      
      const practiceData = await practiceService.getPracticeById(practiceId);
      console.log("Practice data loaded:", practiceData);
      
      if (!practiceData || !practiceData._id) {
        console.error("Failed to load practice: Invalid response format", practiceData);
        toast.error("Could not load practice. Please try again.");
        return;
      }
      
      // Initialize the practice state
      setPractice(practiceData);
      
      // Initialize user answers object
      const initialAnswers = {};
      if (practiceData.questions && Array.isArray(practiceData.questions)) {
        practiceData.questions.forEach((question, index) => {
          if (question.userAnswer) {
            initialAnswers[index] = practiceData.questions[index].options.indexOf(question.userAnswer);
          }
        });
      } else {
        console.error("Practice questions are not in expected format:", practiceData);
        toast.error("Practice questions could not be loaded properly");
        return;
      }
      
      setUserAnswers(initialAnswers);
      
      // Check if already completed
      if (practiceData.isCompleted) {
        console.log("Practice is already completed, showing results");
        setPracticeComplete(true);
        setScore({
          correct: practiceData.correctAnswers,
          total: practiceData.questions.length,
          percentage: (practiceData.correctAnswers / practiceData.questions.length) * 100,
        });
        return;
      }
      
      // Check if practice time has expired but not marked as completed
      if (!practiceData.isCompleted && practiceData.startTime && isPracticeExpired(practiceData)) {
        console.log("Practice time has expired, auto-submitting");
        toast.info("This practice session has expired. Auto-submitting with current answers.");
        await handleSubmitPractice(true);
        return;
      }
      
      // Practice is still active, calculate remaining time and start timer
      console.log("Practice is in progress, continuing with time remaining");
      const remainingTime = calculateRemainingTime(practiceData);
      if (remainingTime > 0) {
        console.log(`${remainingTime} seconds remaining for this practice`);
        toast.info(`You have ${formatTime(remainingTime)} remaining to complete this quiz`);
      }
      
      // Start the timer
      await startTimer(practiceId);
      
    } catch (error) {
      console.error("Error loading practice:", error);
      toast.error("Failed to load practice. Please try again.");
    } finally {
      setLoadingPractice(false);
    }
  };

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: optionIndex,
    });
  };

  // Submit practice answers
  const handleSubmitPractice = async (autoSubmit = false) => {
    if (!practice || !practice._id) {
      toast.error("No active practice to submit");
      return;
    }

    try {
      setSubmitting(true);

      // Stop the timer if it's running
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Format answers for submission
      const formattedAnswers = Object.entries(userAnswers).map(([questionIndex, optionIndex]) => {
        const question = practice.questions[parseInt(questionIndex)];
        const selectedOption = question.options[optionIndex];
        
        return {
          questionId: question._id.toString(),
          answer: selectedOption
        };
      });

      console.log("Submitting practice answers:", {
        practiceId: practice._id,
        answers: formattedAnswers
      });

      // Submit answers to server
      const result = await practiceService.submitPracticeAttempt(practice._id, formattedAnswers);
      console.log("Practice submission result:", result);

      if (!result) {
        throw new Error("Failed to submit practice: No response from server");
      }

      // Update practice with results
      setPractice(result);
      setPracticeComplete(true);

      // Calculate and set score
      const correctCount = result.correctAnswers || 0;
      const totalQuestions = result.questions?.length || 1;
      const percentage = (correctCount / totalQuestions) * 100;
      
      setScore({
        correct: correctCount,
        total: totalQuestions,
        percentage: percentage
      });

      // Show success message
      if (autoSubmit) {
        toast.info("Time's up! Your practice has been submitted automatically.");
      } else {
        toast.success("Practice submitted successfully!");
      }

      // Refresh practice history
      fetchPracticeHistory();
    } catch (error) {
      console.error("Error submitting practice:", error);
      toast.error("Failed to submit practice. Please try again.");
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

  // Determine the status of a practice item
  const getPracticeStatus = (practice) => {
    if (practice.isCompleted) {
      return { status: 'completed', label: 'Completed', icon: <Check fontSize="small" color="success" /> };
    }
    
    if (isPracticeExpired(practice)) {
      return { status: 'expired', label: 'Expired', icon: <Timer fontSize="small" color="error" /> };
    }
    
    return { status: 'in-progress', label: 'In Progress', icon: <PlayArrow fontSize="small" color="primary" /> };
  };

  // Format a practice item's completion time or remaining time
  const formatPracticeTime = (practice) => {
    if (practice.isCompleted) {
      return `Completed: ${formatDate(practice.completedAt || practice.createdAt)}`;
    }
    
    if (practice.startTime) {
      const remainingTime = calculateRemainingTime(practice);
      if (remainingTime <= 0) {
        return "Time expired";
      }
      return `${formatTime(remainingTime)} remaining`;
    }
    
    return `Created: ${formatDate(practice.createdAt)}`;
  };

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
          {filteredPracticeHistory.map((item) => {
            const status = getPracticeStatus(item);
            return (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card 
                  elevation={2}
                  onClick={() => handlePracticeItemClick(item._id)}
                  sx={{ 
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
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
                        {formatPracticeTime(item)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {status.icon}
                      <Typography variant="body2" sx={{ ml: 1 }} color={
                        status.status === 'completed' ? 'success.main' :
                        status.status === 'expired' ? 'error.main' : 'primary.main'
                      }>
                        {status.label}
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
                      color={status.status === 'in-progress' ? 'primary' : 'secondary'}
                      size="small"
                      startIcon={status.status === 'in-progress' ? <PlayArrow /> : <Visibility />}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handlePracticeItemClick(item._id);
                      }}
                      disabled={loadingPractice}
                    >
                      {status.status === 'in-progress' ? "Continue" : "Review"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
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
    <Box className="practice-questions-container">
      {loadingPractice ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading practice...
          </Typography>
        </Box>
      ) : !practice ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No practice loaded. Please select from history or generate a new practice.
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Practice header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {practice.title}
            </Typography>
            
            {!practiceComplete && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={<Timer />} 
                  label={formatTime(timer)}
                  color={timer < 60 ? "error" : "default"}
                  sx={{ 
                    fontWeight: 'bold', 
                    animation: timer < 60 ? 'pulse 1s infinite' : 'none',
                    mr: 1
                  }}
                />
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmitPractice(false)}
                  disabled={submitting}
                  startIcon={<Check />}
                >
                  {submitting ? 'Submitting...' : 'Submit Answers'}
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Practice complete banner */}
          {practiceComplete && score && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: score.percentage >= 70 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                border: `1px solid ${score.percentage >= 70 ? '#4caf50' : '#ff9800'}`,
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Practice Complete!
                  </Typography>
                  <Typography>
                    You scored <strong>{score.correct}</strong> out of <strong>{score.total}</strong> ({Math.round(score.percentage)}%)
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleNewPractice}
                  startIcon={<Add />}
                >
                  New Practice
                </Button>
              </Box>
            </Paper>
          )}
          
          {/* Questions list */}
          {practice.questions?.map((question, questionIndex) => (
            <Card 
              key={question._id} 
              className="question-card"
              sx={{ 
                mb: 3, 
                borderLeft: practiceComplete && question.isCorrect !== undefined 
                  ? (question.isCorrect ? '4px solid #4caf50' : '4px solid #f44336') 
                  : 'none',
                backgroundColor: practiceComplete && question.isCorrect !== undefined
                  ? (question.isCorrect ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)')
                  : 'white'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Question {questionIndex + 1}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {question.question}
                </Typography>
                
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={userAnswers[questionIndex] !== undefined ? userAnswers[questionIndex] : ''}
                    onChange={(e) => handleAnswerChange(questionIndex, parseInt(e.target.value))}
                  >
                    {question.options.map((option, optionIndex) => (
                      <FormControlLabel
                        key={optionIndex}
                        value={optionIndex}
                        control={<Radio />}
                        label={option}
                        disabled={practiceComplete}
                        sx={{
                          backgroundColor: practiceComplete && question.correctAnswer === option
                            ? 'rgba(76, 175, 80, 0.1)'
                            : (practiceComplete && userAnswers[questionIndex] === optionIndex && question.correctAnswer !== option
                              ? 'rgba(244, 67, 54, 0.1)'
                              : 'transparent'),
                          p: 1,
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: practiceComplete ? 'inherit' : 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      />
                    ))}
                  </RadioGroup>
                  
                  {practiceComplete && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Correct Answer: {question.correctAnswer}
                      </Typography>
                      {/* Add explanation if available */}
                      {question.explanation && (
                        <Typography variant="body2">
                          {question.explanation}
                        </Typography>
                      )}
                    </Box>
                  )}
                </FormControl>
              </CardContent>
            </Card>
          ))}
        </Box>
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

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Handle clicking a practice history item
  const handlePracticeItemClick = (practiceId) => {
    console.log("Practice item clicked:", practiceId);
    
    // If we're not in fullscreen mode, navigate to the practice
    navigate(`/practice/${practiceId}`);
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
