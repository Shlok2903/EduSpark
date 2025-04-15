import React, { useState, useEffect, useRef } from "react";
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

const StudentPractice = ({ fullScreenMode }) => {
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
  const { practiceId } = useParams();
  const navigate = useNavigate();

  const [practiceParams, setPracticeParams] = useState({
    courseId: "",
    difficulty: "medium",
    numberOfQuestions: 5,
  });

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

  // If in fullScreenMode and practiceId is provided, load that practice automatically
  useEffect(() => {
    if (fullScreenMode && practiceId) {
      handleLoadPractice(practiceId);
    }
  }, [fullScreenMode, practiceId]);

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

  const handleSubmitPractice = async (isAutoSubmit = false) => {
    // Check if all questions are answered
    const unansweredQuestions = Object.values(userAnswers).filter(
      (ans) => ans === null
    ).length;

    if (!isAutoSubmit && unansweredQuestions > 0) {
      toast.warning(
        `You have ${unansweredQuestions} unanswered questions. Are you sure you want to submit?`
      );
      return;
    }

    try {
      // Clear timer interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      setSubmitting(true);
      
      // Create answers array from userAnswers
      const answersArray = Object.entries(userAnswers).map(
        ([questionIndex, optionIndex]) => ({
          questionId: practice.questions[parseInt(questionIndex)]._id,
          answer: optionIndex !== null 
            ? practice.questions[parseInt(questionIndex)].options[optionIndex]
            : null,
        })
      );

      // If auto-submit due to timer, show a toast notification
      if (isAutoSubmit) {
        toast.info("Time's up! Your answers have been automatically submitted.");
      }

      const response = await practiceService.submitPracticeAttempt(
        practice._id,
        answersArray
      );

      if (response) {
        setPracticeComplete(true);
        // Calculate score as percentage
        const score = Math.round(
          (response.correctAnswers / response.questions.length) * 100
        );
        setScore(score);
        
        if (!isAutoSubmit) {
          toast.success("Practice submitted successfully!");
        }
        
        fetchPracticeHistory(); // Refresh the history
      }
    } catch (error) {
      console.error("Failed to submit practice:", error);
      toast.error(
        error.response?.data?.message ||
          "Could not submit your practice. Please try again."
      );
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
          You haven't completed any practice quizzes yet. Start practicing to
          see your history!
        </Alert>
      ) : (
        <List className="history-list">
          {practiceHistory.map((item) => (
            <ListItem
              key={item._id}
              className={`history-item ${
                item.isCompleted ? "completed" : "incomplete"
              }`}
            >
              <ListItemIcon>
                {item.isCompleted ? (
                  <Badge
                    badgeContent={`${Math.round(
                      (item.correctAnswers / item.numberOfQuestions) * 100
                    )}%`}
                    color={
                      item.correctAnswers / item.numberOfQuestions >= 0.8
                        ? "success"
                        : item.correctAnswers / item.numberOfQuestions >= 0.6
                        ? "warning"
                        : "error"
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
                    <Typography
                      component="span"
                      variant="body2"
                      color="textSecondary"
                    >
                      {item.isCompleted
                        ? `Completed: ${formatDate(item.completedAt)}`
                        : `Started: ${formatDate(item.createdAt)}`}
                    </Typography>
                    <br />
                    <Typography
                      component="span"
                      variant="body2"
                      color="textSecondary"
                    >
                      {item.numberOfQuestions} questions • {item.difficulty}{" "}
                      difficulty
                    </Typography>
                  </>
                }
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => navigate(`/practice/${item._id}`)}
                disabled={loadingPractice}
              >
                {item.isCompleted ? "Review" : "Continue"}
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
            {courses.map((course) => (
              <MenuItem
                key={course.id || course._id}
                value={course.id || course._id}
              >
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
            {difficultyLevels.map((level) => (
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
          {generating ? <CircularProgress size={24} /> : "Generate Practice"}
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
    <>
      {fullScreen ? (
        <Dialog
          fullScreen
          open={fullScreen}
          onClose={handleExitFullScreen}
        >
          <AppBar position="static" color="default" elevation={0}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleExitFullScreen}
                aria-label="close"
              >
                <FullscreenExit />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1 }}>
                Practice Quiz
              </Typography>
              {timer !== null && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: timer < 60 ? 'error.main' : timer < 180 ? 'warning.main' : 'primary.main',
                  bgcolor: timer < 60 ? 'error.light' : timer < 180 ? 'warning.light' : 'primary.light',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  mr: 2,
                  fontWeight: 'bold',
                  border: timer < 60 ? '2px solid #f44336' : timer < 180 ? '2px solid #ff9800' : '1px solid #3f51b5',
                  animation: timer < 60 ? 'pulse 1s infinite' : 'none'
                }}>
                  <Timer sx={{ mr: 1, fontSize: '1.5rem' }} />
                  <Typography variant="h5" fontFamily="monospace" fontWeight="bold">
                    {formatTime(timer)}
                  </Typography>
                </Box>
              )}
            </Toolbar>
          </AppBar>
          
          <Box sx={{ p: 3 }}>
            {loading || loadingPractice ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={60} />
              </Box>
            ) : practice ? (
              renderPracticeQuestions()
            ) : (
              <Typography>No practice found</Typography>
            )}
          </Box>
        </Dialog>
      ) : (
        <Box className="student-practice-container">
          <Typography variant="h4" className="page-title">
            Practice Questions
          </Typography>
          <Typography variant="body1" className="page-description">
            Generate AI-powered practice questions based on your enrolled courses to
            test your knowledge.
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
                  You are not enrolled in any courses. Please enroll in a course to
                  practice.
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
                    {activeTab === 0
                      ? renderPracticeForm()
                      : renderPracticeHistory()}
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      )}
      <style jsx="true">{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default StudentPractice;
