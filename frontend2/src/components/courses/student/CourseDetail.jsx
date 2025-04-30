import React, { useState, useEffect } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider, 
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import { 
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  VideoLibrary as VideoLibraryIcon,
  TextSnippet as TextSnippetIcon,
  Quiz as QuizIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import { courseService, enrollmentService, quizService } from "../../../services/api";
import "./CourseDetail.css";

// Module type Icons by content type
const ModuleTypeIcon = ({ type }) => {
  switch (type) {
    case "video":
      return <VideoLibraryIcon color="primary" />;
    case "text":
      return <TextSnippetIcon color="primary" />;
    case "quiz":
      return <QuizIcon color="primary" />;
    default:
      return null;
  }
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Course state
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Enrollment state
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  // Module view state
  const [selectedModule, setSelectedModule] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Quiz state
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [quizTimer, setQuizTimer] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  // Add these state variables for quiz data
  const [quizInfo, setQuizInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // New state variables for submitQuizAnswers
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);
  
  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);
      
      if (response.success && response.data) {
        // Process course data to strip out quiz questions
        if (response.data.sections) {
          response.data.sections.forEach(section => {
            if (section.modules) {
              section.modules.forEach(module => {
                // For quiz modules, remove the questions to prevent full loading
                if (module.contentType === 'quiz' || module.contentType === 'quizz') {
                  if (module.quizContent) {
                    // Save metadata but remove questions
                    const metadata = {
                      passingScore: module.quizContent.passingScore,
                      timer: module.quizContent.timer,
                      deadline: module.quizContent.deadline,
                      maxAttempts: module.quizContent.maxAttempts,
                      totalMarks: module.quizContent.totalMarks,
                      // Keep track of question count but remove actual questions
                      questionCount: module.quizContent.questions?.length || 0
                    };
                    
                    // Replace questions with empty array to avoid loading all data
                    module._originalQuestionsCount = module.quizContent.questions?.length || 0;
                    module.quizContent.questions = [];
                    module.quizContent._metadata = metadata;
                  }
                  
                  if (module.content?.quiz) {
                    // Same approach for alternative data structure
                    const metadata = {
                      passingScore: module.content.quiz.passingScore,
                      timer: module.content.quiz.timer,
                      deadline: module.content.quiz.deadline,
                      maxAttempts: module.content.quiz.maxAttempts,
                      totalMarks: module.content.quiz.totalMarks,
                      questionCount: module.content.quiz.questions?.length || 0
                    };
                    
                    module._originalQuestionsCount = module.content.quiz.questions?.length || 0;
                    module.content.quiz.questions = [];
                    module.content.quiz._metadata = metadata;
                  }
                }
              });
            }
          });
        }
        
        setCourse(response.data);
        
        // If enrolled, fetch enrollment details for progress info
        if (response.data.isEnrolled) {
          // If enrollment data is already included, use it
          if (response.data.enrollment) {
            setEnrollmentData(response.data.enrollment);
          } else {
            // Otherwise fetch enrollment details separately
          fetchEnrollmentDetails();
          }
        }
      } else {
        setError(response.message || "Failed to load course details");
      }
    } catch (err) {
      console.error("Error fetching course details:", err);
      setError("Failed to fetch course details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch enrollment details if user is enrolled
  const fetchEnrollmentDetails = async () => {
    try {
      setEnrollmentLoading(true);
      const response = await enrollmentService.getEnrollmentStatus(courseId);
      setEnrollmentData(response);
    } catch (error) {
      console.error("Error fetching enrollment details:", error);
    } finally {
      setEnrollmentLoading(false);
    }
  };
  
  // Enroll in the course
  const handleEnroll = async () => {
    try {
      setLoading(true);
      const response = await enrollmentService.enrollCourse(courseId);
      
      if (response.success) {
        // Show success message
        alert("Successfully enrolled in the course!");
        // Refresh course data to update enrollment status
        fetchCourseDetails();
      } else {
        alert(response.message || "Failed to enroll in the course");
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      
      // Display specific error message if provided by the server
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Failed to enroll in the course. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle module click
  const handleModuleClick = (module) => {
    // Allow clicking only if enrolled or if user is creator/admin
    if (
      course.isEnrolled ||
      course.isCreator ||
      course.isAdmin ||
      course.isTutor
    ) {
      console.log("Module selected:", module);
      
      // For quiz modules, we need to navigate to a dedicated quiz page instead of showing in sidebar
      if (module.contentType === "quiz" || module.contentType === "quizz") {
        console.log("Quiz module selected, redirecting to full screen quiz");
        navigate(`/courses/${courseId}/quiz/${module._id || module.id}`);
        return; // Exit early, don't set selectedModule
      }
      
      setSelectedModule(module);
      
      // Record module view if enrolled
      if (course.isEnrolled) {
        recordModuleView(module.id || module._id);
      }
    } else {
      // Prompt to enroll if not enrolled
      if (
        window.confirm(
          "You need to enroll in this course to view its content. Would you like to enroll now?"
        )
      ) {
        handleEnroll();
      }
    }
  };
  
  // Record module view
  const recordModuleView = async (moduleId) => {
    if (!moduleId) {
      console.error("Missing moduleId for recording view");
      return;
    }

    try {
      // Make sure we have both courseId and moduleId for the API
      await enrollmentService.recordModuleView({
        courseId: courseId,
        moduleId: moduleId,
      });
    } catch (error) {
      console.error("Error recording module view:", error);
      // Continue without failing - this is a non-critical operation
    }
  };
  
  // Check if module is completed
  const isModuleCompleted = (moduleId) => {
    if (!enrollmentData || !enrollmentData.sectionProgress) return false;
    
    // Loop through all sections and their modules to find if this module is completed
    for (const section of enrollmentData.sectionProgress) {
      for (const moduleProgress of section.moduleProgress) {
        if (
          moduleProgress.moduleId.toString() === moduleId.toString() &&
          moduleProgress.isCompleted
        ) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Get overall course progress
  const getCourseProgress = () => {
    if (!enrollmentData || !enrollmentData.progress) return 0;
    return enrollmentData.progress;
  };
  
  // Mark module as completed
  const markModuleAsCompleted = async (moduleId) => {
    try {
      const response = await enrollmentService.completeModule(
        courseId,
        moduleId
      );
      if (response.success) {
        // Refresh enrollment data
        fetchEnrollmentDetails(); 
      }
    } catch (error) {
      console.error("Error marking module as completed:", error);
      alert("Failed to mark module as completed. Please try again.");
    }
  };
  
  // Handle quiz submission
  const handleQuizSubmit = async () => {
    if (!selectedModule) return;

    try {
      // Check if quiz content exists
      if (
        !selectedModule.content ||
        !selectedModule.content.quiz ||
        !selectedModule.content.quiz.questions
      ) {
        console.error("Quiz content is missing");
        return;
      }

      const questions = selectedModule.content.quiz.questions;
      let correctAnswers = 0;
      
      questions.forEach((question, index) => {
        const userAnswerIndex = quizAnswers[index];
        if (
          userAnswerIndex !== undefined &&
          question.options[userAnswerIndex].isCorrect
        ) {
          correctAnswers++;
        }
      });
      
      const score = (correctAnswers / questions.length) * 100;
      setQuizScore(score);
      setQuizSubmitted(true);
      
      // Submit quiz to server
      await enrollmentService.submitQuiz(
        selectedModule.id || selectedModule._id,
        quizAnswers,
        score
      );
      
      // Mark module as completed if score is passing (e.g., > 70%)
      if (score >= 70) {
        await markModuleAsCompleted(selectedModule.id || selectedModule._id);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };
  
  // Handle quiz answer selection
  const handleQuizAnswer = (questionId, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionIndex,
    });
  };
  
  // Reset quiz state
  const resetQuizState = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Reset module content
  const resetModuleContent = () => {
    setSelectedModule(null);
    resetQuizState();
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fetch only quiz info (metadata)
  const fetchQuizInfo = async (moduleId) => {
    try {
      setLoadingQuiz(true);
      
      // Always fetch quiz info from API - don't rely on potentially unsafe data from course object
      console.log("Fetching quiz info from API for module:", moduleId);
      const response = await quizService.getQuizInfo(moduleId);
      console.log("Quiz info response:", response);
      setQuizInfo(response);
    } catch (error) {
      console.error("Error fetching quiz info:", error);
      alert("Could not load quiz information");
    } finally {
      setLoadingQuiz(false);
    }
  };
  
  // Start a quiz and fetch questions
  const startQuiz = async (moduleId) => {
    try {
      setLoadingQuiz(true);
      
      // 1. Start the quiz attempt
      const response = await quizService.startQuiz(moduleId);
      
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
      console.error("Error starting quiz:", error);
      alert(error.response?.data?.message || "Failed to start quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };
  
  // Submit the quiz
  const submitQuiz = async (attemptId) => {
    try {
      setLoadingQuiz(true);
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
      
      // Close quiz attempt view if passing score achieved
      if (result.attempt.isPassed) {
        await markModuleAsCompleted(quizAttempt.moduleId);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz");
    } finally {
      setLoadingQuiz(false);
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
  
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  // Fetch quiz questions
  const fetchQuizQuestions = async (moduleId) => {
    try {
      setLoadingQuizQuestions(true);
      console.log("Fetching quiz questions for module:", moduleId);
      const response = await quizService.getQuizQuestions(moduleId);
      console.log("Quiz questions response:", response);
      
      if (response && response.questions) {
        setQuizQuestions(response.questions);
        
        // Update the selected module with the fetched questions
        if (selectedModule) {
          const updatedModule = { ...selectedModule };
          if (updatedModule.quizContent) {
            updatedModule.quizContent.questions = response.questions;
          } else if (updatedModule.content && updatedModule.content.quiz) {
            updatedModule.content.quiz.questions = response.questions;
          }
          setSelectedModule(updatedModule);
        }
        
        return response.questions;
      } else {
        console.error("Invalid quiz questions response:", response);
        return [];
      }
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      alert("Could not load quiz questions. Please try again.");
      return [];
    } finally {
      setLoadingQuizQuestions(false);
    }
  };

  // Submit quiz answers
  const submitQuizAnswers = async () => {
    try {
      setSubmittingQuiz(true);
      
      if (!selectedModule || !quizAnswers || Object.keys(quizAnswers).length === 0) {
        alert("Please answer at least one question before submitting.");
        return;
      }
      
      const submissionData = {
        moduleId: selectedModule._id,
        answers: quizAnswers,
        timeSpent: quizTimer ? (quizInfo.timer * 60) - quizTimer : quizInfo.timer * 60,
      };
      
      console.log("Submitting quiz answers:", submissionData);
      const response = await quizService.submitQuizAnswers(submissionData);
      console.log("Quiz submission response:", response);
      
      if (response && response.score !== undefined) {
        setQuizResult(response);
        setQuizSubmitted(true);
        
        // Check if the student passed the quiz
        const passed = response.score >= quizInfo.passingScore;
        setQuizPassed(passed);
        
        // If passed, mark the module as completed
        if (passed) {
          await markModuleAsCompleted(selectedModule._id);
        }
        
        // Refresh attempts count
        if (selectedModule) {
          fetchQuizAttempts(selectedModule._id);
        }
        
        // Show appropriate message
        if (passed) {
          alert(`Congratulations! You passed the quiz with a score of ${response.score}/${quizInfo.totalMarks}.`);
        } else {
          alert(`You scored ${response.score}/${quizInfo.totalMarks}. The passing score is ${quizInfo.passingScore}. Try again!`);
        }
      } else {
        alert("Error submitting quiz. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmittingQuiz(false);
    }
  };
  
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (!course) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography>Course not found</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" className="course-detail-container">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" className="breadcrumbs">
        <Link component={RouterLink} to="/courses" color="inherit">
          My Courses
        </Link>
        <Typography color="textPrimary">{course.title}</Typography>
      </Breadcrumbs>
      
      {/* Course Header */}
      <Box className="course-header">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/courses")}
          className="back-button"
        >
          Back to Courses
        </Button>
        <Typography variant="h4" className="course-title">
          {course.title}
        </Typography>
        <Box className="course-info">
          <Chip label={course.category} className="course-category" />
          <Chip label={course.level} className="course-level" />
          <Typography variant="body1" className="course-instructor">
            Instructor:{" "}
            {course.instructor ||
              (course.createdBy && course.createdBy.name) ||
              "Unknown"}
          </Typography>
        </Box>
      </Box>
      
      {/* Course Content Layout */}
      <Box className="course-content">
        {/* Left Sidebar - Course sections and modules */}
          <Paper className="course-content-paper">
            <Typography variant="h5" className="content-title">
              Course Content
            </Typography>
            
            {course.sections && course.sections.length > 0 ? (
              course.sections.map((section, index) => (
              <Accordion
                key={section.id || index}
                className="section-accordion"
              >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    className="section-header"
                  >
                    <Typography variant="h6">{section.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails className="section-content">
                    <List className="module-list">
                      {section.modules && section.modules.length > 0 ? (
                        section.modules.map((module, moduleIndex) => (
                          <ListItem
                            key={module.id || moduleIndex}
                            button
                          selected={
                            selectedModule &&
                            (selectedModule.id === module.id ||
                              selectedModule._id === module._id)
                          }
                          onClick={() => handleModuleClick(module)}
                          className={`module-item ${
                            !course.isEnrolled &&
                            !course.isCreator &&
                            !course.isAdmin &&
                            !course.isTutor
                              ? "locked"
                              : "clickable"
                          }`}
                          >
                            <ListItemIcon>
                            {isModuleCompleted(module.id || module._id) ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <ModuleTypeIcon type={module.contentType} />
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={module.title}
                              secondary={module.description}
                            />
                          {!course.isEnrolled &&
                          !course.isCreator &&
                          !course.isAdmin &&
                          !course.isTutor ? (
                            <Typography variant="caption" color="textSecondary">
                              Enroll to view
                            </Typography>
                          ) : (
                              <PlayArrowIcon color="primary" />
                            )}
                          </ListItem>
                        ))
                      ) : (
                      <Typography variant="body2">
                        No modules found in this section
                      </Typography>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body1" className="no-content">
                No content available for this course yet.
              </Typography>
            )}
          </Paper>

        {/* Right Side - Selected Module Content */}
        <Paper className="module-content-container">
          {selectedModule ? (
            <>
              <Box className="module-content-header">
                <Typography variant="h5">{selectedModule.title}</Typography>
                <Button onClick={resetModuleContent} startIcon={<CloseIcon />}>
                  Close
                </Button>
              </Box>
              <Box className="module-content-body">
                {/* Video Content */}
                {selectedModule.contentType === "video" &&
                  selectedModule.videoContent && (
                <Box className="video-container">
                  <iframe
                        src={selectedModule.videoContent.videoUrl}
                        title={selectedModule.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="video-player"
                  ></iframe>
                </Box>
              )}
              
                {/* Text Content */}
                {selectedModule.contentType === "text" && (
                  <Box className="text-content">
                    {console.log('Text Module Data:', selectedModule)}
                    {selectedModule.textContent && typeof selectedModule.textContent.content === 'string' ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedModule.textContent.content
                        }}
                      />
                    ) : (
                      <Typography variant="body1">
                        No content available for this module.
                      </Typography>
                    )}
                  </Box>
                )}
              
                {/* Quiz Content */}
                {(selectedModule.contentType === "quiz" || selectedModule.contentType === "quizz") &&
                  (selectedModule.quizContent || selectedModule.content?.quiz) && (
                <Box className="quiz-container">
                      {/* Show loading indicator when fetching quiz data */}
                      {loadingQuiz && (
                        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                          <CircularProgress />
                        </Box>
                      )}
                      
                      {/* Show quiz info and start button */}
                      {!loadingQuiz && !quizAttempt && quizInfo && (
                        <Box className="quiz-info">
                          <Typography variant="h6" gutterBottom>
                            Quiz: {selectedModule.title}
                          </Typography>
                          
                          <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2">Number of Questions</Typography>
                                <Typography variant="body1">
                                  {quizInfo.quizInfo.totalQuestions}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2">Total Marks</Typography>
                                <Typography variant="body1">
                                  {quizInfo.quizInfo.totalMarks}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2">Passing Score</Typography>
                                <Typography variant="body1">
                                  {quizInfo.quizInfo.passingScore}%
                                </Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="subtitle2">Time Limit</Typography>
                                <Typography variant="body1">
                                  {quizInfo.quizInfo.timer 
                                    ? `${quizInfo.quizInfo.timer} minutes` 
                                    : 'No time limit'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>
                          
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => startQuiz(selectedModule._id || selectedModule.id)}
                            startIcon={<QuizIcon />}
                            disabled={quizInfo.maxAttemptsReached || quizInfo.isDeadlinePassed}
                          >
                            Start Quiz
                          </Button>
                        </Box>
                      )}
                      
                      {/* Quiz taking interface */}
                      {!loadingQuiz && quizAttempt && quizQuestions.length > 0 && !quizSubmitted && (
                        <Box className="quiz-questions">
                          {/* Quiz Header with Timer */}
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: 3,
                              pb: 2,
                              borderBottom: '1px solid #eee'
                            }}
                          >
                            <Typography variant="h6">
                              {selectedModule.title}
                            </Typography>
                            
                            {quizTimer > 0 && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                color: quizTimer < 300 ? 'error.main' : 'primary.main'
                              }}>
                                <TimerIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                  {formatTime(quizTimer)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          {/* Questions */}
                          {quizQuestions.map((question, questionIndex) => (
                            <Box
                              key={question._id || questionIndex}
                              className="quiz-question"
                              mb={4}
                              p={2}
                              sx={{ 
                                borderRadius: 1,
                                border: '1px solid #eee',
                                '&:hover': { borderColor: '#ddd' }
                              }}
                            >
                              <Typography variant="subtitle1" gutterBottom>
                                <strong>Question {questionIndex + 1}:</strong> {typeof question.question === 'string' ? question.question : ''}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" display="block" mb={2}>
                                {question.marks > 1 ? `${question.marks} marks` : '1 mark'}
                              </Typography>
                              
                              <RadioGroup
                                value={quizAnswers[question._id] !== undefined ? 
                                  quizAnswers[question._id] : ''}
                                onChange={(e) => handleQuizAnswer(question._id, Number(e.target.value))}
                              >
                                {(question.options || []).map((option, optionIndex) => (
                                  <FormControlLabel
                                    key={optionIndex}
                                    value={optionIndex}
                                    control={<Radio />}
                                    label={typeof option === 'string' ? option : (option.text || '')}
                                    sx={{ mb: 1 }}
                                  />
                                ))}
                              </RadioGroup>
                            </Box>
                          ))}
                          
                          <Box mt={3} display="flex" justifyContent="space-between">
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={() => setSelectedModule(null)}
                            >
                              Save & Exit
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => submitQuizAnswers()}
                              disabled={
                                Object.keys(quizAnswers).length !== quizQuestions.length
                              }
                            >
                              Submit Quiz
                            </Button>
                          </Box>
                        </Box>
                      )}
                      
                      {/* Quiz results */}
                      {quizSubmitted && (
                    <Box className="quiz-results">
                          <Typography variant="h6" gutterBottom>Quiz Results</Typography>
                          
                          <Box
                            sx={{
                              p: 3,
                              mb: 3,
                              backgroundColor: quizScore >= (quizInfo?.quizInfo?.passingScore || 70) 
                                ? 'success.light' 
                                : 'error.light',
                              borderRadius: 2,
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="h4" className="quiz-score" gutterBottom>
                        Your Score: {quizScore}%
                      </Typography>
                      <Typography variant="body1">
                              {quizScore >= (quizInfo?.quizInfo?.passingScore || 70)
                                ? "Congratulations! You passed the quiz."
                                : `You need ${quizInfo?.quizInfo?.passingScore || 70}% to pass this quiz.`}
                            </Typography>
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={4}>
                              <Typography variant="subtitle2">Questions</Typography>
                              <Typography variant="body1">
                                {quizAttempt?.totalQuestions || quizQuestions.length}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                              <Typography variant="subtitle2">Correct Answers</Typography>
                              <Typography variant="body1">
                                {Math.round(quizScore * 
                                 (quizAttempt?.totalQuestions || quizQuestions.length) / 100)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                              <Typography variant="subtitle2">Time Taken</Typography>
                              <Typography variant="body1">
                                {quizAttempt && quizAttempt.startTime && quizAttempt.endTime ? 
                                  `${Math.round((new Date(quizAttempt.endTime) - new Date(quizAttempt.startTime)) / 60000)} minutes` 
                                  : "N/A"}
                      </Typography>
                            </Grid>
                          </Grid>

                          <Box>
                            <Button
                              onClick={() => {
                                setQuizAttempt(null);
                                resetQuizState();
                                // Re-fetch quiz info to get updated attempt count
                                fetchQuizInfo(selectedModule._id || selectedModule.id);
                              }}
                              color="secondary"
                              variant="outlined"
                              sx={{ mr: 2 }}
                              disabled={quizInfo?.maxAttemptsReached}
                            >
                              Try Again
                            </Button>
                            <Button
                              onClick={() => setSelectedModule(null)}
                              color="primary"
                              variant="contained"
                            >
                              Back to Course
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              {selectedModule.contentType !== "quiz" && (
                <Box className="module-content-footer">
                <Button
                  onClick={() => {
                      if (!isModuleCompleted(selectedModule._id)) {
                        markModuleAsCompleted(selectedModule._id);
                    }
                  }}
                  color="primary"
                  variant="contained"
                    disabled={isModuleCompleted(selectedModule._id)}
                >
                    {isModuleCompleted(selectedModule._id)
                      ? "Already Completed"
                      : "Mark as Completed"}
                </Button>
                </Box>
              )}
            </>
          ) : (
            <Box
              className="module-content-body"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Typography variant="h6" color="textSecondary">
                Select a module from the left sidebar to view its content
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default CourseDetail; 
