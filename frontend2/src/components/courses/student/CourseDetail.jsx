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
} from "@mui/icons-material";
import { courseService, enrollmentService } from "../../../services/api";
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

  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);

      if (response.success && response.data) {
        setCourse(response.data);
        // console.log(response.data);
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
  const handleQuizAnswer = (questionIndex, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: optionIndex,
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

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

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
                {selectedModule.contentType === "text" &&
                  selectedModule.textContent && (
                    <Box className="text-content">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedModule.textContent.content,
                        }}
                      />
                    </Box>
                  )}

                {/* Quiz Content */}
                {selectedModule.contentType === "quiz" &&
                  selectedModule.quizContent && (
                    <Box className="quiz-container">
                      {!quizSubmitted ? (
                        <>
                          {selectedModule.quizContent.questions.map(
                            (question, questionIndex) => (
                              <Box
                                key={questionIndex}
                                className="quiz-question"
                                mb={4}
                              >
                                <Typography variant="h6">
                                  Question {questionIndex + 1}:{" "}
                                  {question.question}
                                </Typography>
                                <List>
                                  {question.options.map(
                                    (option, optionIndex) => (
                                      <ListItem
                                        key={optionIndex}
                                        button
                                        onClick={() =>
                                          handleQuizAnswer(
                                            questionIndex,
                                            optionIndex
                                          )
                                        }
                                        className={`quiz-option ${
                                          quizAnswers[questionIndex] ===
                                          optionIndex
                                            ? "selected"
                                            : ""
                                        }`}
                                      >
                                        <ListItemText primary={option.text} />
                                      </ListItem>
                                    )
                                  )}
                                </List>
                              </Box>
                            )
                          )}

                          <Box mt={2} display="flex" justifyContent="flex-end">
                            <Button
                              onClick={handleQuizSubmit}
                              color="primary"
                              variant="contained"
                              disabled={
                                Object.keys(quizAnswers).length !==
                                selectedModule.quizContent.questions.length
                              }
                            >
                              Submit Quiz
                            </Button>
                          </Box>
                        </>
                      ) : (
                        <Box className="quiz-results">
                          <Typography variant="h6">Quiz Results</Typography>
                          <Typography variant="h4" className="quiz-score">
                            Your Score: {quizScore}%
                          </Typography>
                          <Typography variant="body1" mb={3}>
                            {quizScore >= 70
                              ? "Congratulations! You passed the quiz."
                              : "You need 70% to pass this quiz. Try again."}
                          </Typography>

                          <Button
                            onClick={resetQuizState}
                            color="secondary"
                            variant="outlined"
                            sx={{ mr: 2 }}
                          >
                            Try Again
                          </Button>

                          <Button
                            onClick={resetModuleContent}
                            color="primary"
                            variant="contained"
                          >
                            Return to Course
                          </Button>
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
