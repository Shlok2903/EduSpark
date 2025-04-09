import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider, 
  IconButton, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  FormControlLabel,
  Card,
  CardContent,
  LinearProgress,
  Slider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { courseService, sectionService, moduleService, enrollmentService } from '../../services/api';
import { handleError, handleSuccess } from '../../utils';
import Sidebar from '../common/sidebar/Sidebar';
import RichTextEditor from '../common/RichTextEditor';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import QuizIcon from '@mui/icons-material/Quiz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EnrollmentButton from './EnrollmentButton';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import axios from 'axios';
import { useSnackbar } from 'notistack';

// Module type Icons by content type
const ModuleTypeIcon = ({ type }) => {
  switch(type) {
    case 'video':
      return <VideoLibraryIcon color="primary" />;
    case 'text':
      return <TextSnippetIcon color="primary" />;
    case 'quizz':
      return <QuizIcon color="primary" />;
    default:
      return null;
  }
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // User role and enrollment state
  const [userState, setUserState] = useState({
    isCreator: false,
    isAdmin: localStorage.getItem('isAdmin') === 'true',
    isTutor: localStorage.getItem('isTutor') === 'true',
    isEnrolled: false,
    enrollmentData: null,
    loading: true,
    enrollmentDataLoaded: false
  });
  
  // Course state
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Section state
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [sectionData, setSectionData] = useState({
    title: '',
    description: '',
    deadline: null
  });
  const [sectionErrors, setSectionErrors] = useState({});
  const [addingSectionLoading, setAddingSectionLoading] = useState(false);
  
  // Module state
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    contentType: 'text',
    content: {
      text: '',
      videoUrl: '',
      quiz: {
        questions: []
      }
    }
  });
  const [moduleErrors, setModuleErrors] = useState({});
  const [addingModuleLoading, setAddingModuleLoading] = useState(false);
  
  // Added for new layout
  const [selectedModule, setSelectedModule] = useState(null);
  const [isFullscreenQuiz, setIsFullscreenQuiz] = useState(false);
  
  // Content state (for video, text, quiz)
  const [contentData, setContentData] = useState({
    videoUrl: '',
    textContent: '',
    quizQuestions: [{ question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }]
  });
  
  // Module view state
  const [openModuleViewDialog, setOpenModuleViewDialog] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Add this state to track if module view has been recorded
  const [moduleViewRecorded, setModuleViewRecorded] = useState(false);
  
  // Add new state for video tracking
  const [videoProgress, setVideoProgress] = useState({});
  
  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await courseService.getCourseById(courseId);
      
      if (response.success) {
        setCourse(response.data);
        
        // Check if user is the creator
        const isCreator = response.data.isCreator;
        const isEnrolled = response.data.isEnrolled;
        
        setUserState(prev => ({
          ...prev,
          isCreator,
          isEnrolled,
          loading: false
        }));
        
        // If enrolled, fetch enrollment details for progress info
        if (isEnrolled && !isCreator) {
          fetchEnrollmentDetails();
        }
      } else {
        setError(response.message || 'Failed to load course details');
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      const errorMsg = err.formattedMessage || 'Failed to fetch course details. Please try again later.';
      setError(errorMsg);
      handleError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch enrollment details if user is enrolled
  const fetchEnrollmentDetails = async () => {
    try {
      // Add a flag to prevent duplicate calls
      if (userState.enrollmentDataLoaded) {
        return;
      }
      
      const enrollmentData = await enrollmentService.getEnrollmentStatus(courseId);
      setUserState(prev => ({
        ...prev,
        enrollmentData,
        enrollmentDataLoaded: true
      }));
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
    }
  };
  
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]); // Only re-run when courseId changes
  
  // Handle section dialog
  const handleOpenSectionDialog = () => {
    setSectionData({
      title: '',
      description: '',
      deadline: null
    });
    setSectionErrors({});
    setOpenSectionDialog(true);
  };
  
  const handleCloseSectionDialog = () => {
    setOpenSectionDialog(false);
    setSectionData({
      title: '',
      description: '',
      deadline: null
    });
    setSectionErrors({});
  };
  
  const handleSectionChange = (e) => {
    const { name, value } = e.target;
    setSectionData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (sectionErrors[name]) {
      setSectionErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleSectionRichTextChange = (value) => {
    setSectionData(prev => ({
      ...prev,
      description: value
    }));
    if (sectionErrors.description) {
      setSectionErrors(prev => ({
        ...prev,
        description: ''
      }));
    }
  };
  
  const handleSectionDateChange = (date) => {
    setSectionData(prev => ({
      ...prev,
      deadline: date
    }));
  };
  
  const handleAddSection = async () => {
    // Validate
    const errors = {};
    if (!sectionData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!sectionData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setSectionErrors(errors);
      return;
    }

    setAddingSectionLoading(true);
    try {
      const response = await sectionService.createSection(courseId, sectionData);
      await fetchCourseDetails();
      handleSuccess('Section added successfully');
      handleCloseSectionDialog();
    } catch (error) {
      console.error('Error adding section:', error);
      handleError(error.formattedMessage || 'Error adding section. Please try again.');
    } finally {
      setAddingSectionLoading(false);
    }
  };
  
  // Handle module dialog
  const handleOpenModuleDialog = (sectionId) => {
    setCurrentSectionId(sectionId);
    setModuleData({
      title: '',
      description: '',
      contentType: 'text',
      content: {
        text: '',
        videoUrl: '',
        quiz: {
          questions: []
        }
      }
    });
    setContentData({
      videoUrl: '',
      textContent: '',
      quizQuestions: [{ question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }]
    });
    setModuleErrors({});
    setOpenModuleDialog(true);
  };
  
  const handleCloseModuleDialog = () => {
    setOpenModuleDialog(false);
    setCurrentSectionId(null);
    setModuleData({
      title: '',
      description: '',
      contentType: 'text',
      content: {
        text: '',
        videoUrl: '',
        quiz: {
          questions: []
        }
      }
    });
    setModuleErrors({});
  };
  
  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setModuleData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (moduleErrors[name]) {
      setModuleErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [name]: value
      }
    }));
  };
  
  // Add new handler for rich text editor in content
  const handleContentRichTextChange = (content) => {
    setContentData(prev => ({
      ...prev,
      textContent: content
    }));
  };
  
  // Handle quiz question changes
  const handleQuestionChange = (index, value) => {
    setModuleData(prev => {
      const newQuestions = [...prev.content.quiz.questions];
      newQuestions[index] = {
        ...newQuestions[index],
        question: value
      };
      return {
        ...prev,
        content: {
          ...prev.content,
          quiz: {
            questions: newQuestions
          }
        }
      };
    });
  };
  
  // Add handler for rich text in quiz questions
  const handleQuestionRichTextChange = (index, content) => {
    setContentData(prev => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, qIndex) =>
        qIndex === index ? { ...question, question: content } : question
      )
    }));
  };
  
  // Handle quiz option changes
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setModuleData(prev => {
      const newQuestions = [...prev.content.quiz.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        options: newOptions
      };
      return {
        ...prev,
        content: {
          ...prev.content,
          quiz: {
            questions: newQuestions
          }
        }
      };
    });
  };
  
  // Add handler for rich text in quiz options
  const handleOptionRichTextChange = (questionIndex, optionIndex, content) => {
    setContentData(prev => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((question, qIndex) =>
        qIndex === questionIndex ? { ...question, options: question.options.map((option, oIndex) =>
          oIndex === optionIndex ? { ...option, text: content } : option
        ) } : question
      )
    }));
  };
  
  // Add new question to quiz
  const handleAddQuizQuestion = () => {
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          questions: [
            ...prev.content.quiz.questions,
            {
              question: '',
              options: [''],
              correctOption: 0
            }
          ]
        }
      }
    }));
  };
  
  // Add new option to a question
  const handleAddOption = (questionIndex) => {
    setModuleData(prev => {
      const newQuestions = [...prev.content.quiz.questions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        options: [...newQuestions[questionIndex].options, '']
      };
      return {
        ...prev,
        content: {
          ...prev.content,
          quiz: {
            questions: newQuestions
          }
        }
      };
    });
  };
  
  const handleCorrectOptionChange = (questionIndex, value) => {
    setModuleData(prev => {
      const newQuestions = [...prev.content.quiz.questions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        correctOption: parseInt(value)
      };
      return {
        ...prev,
        content: {
          ...prev.content,
          quiz: {
            questions: newQuestions
          }
        }
      };
    });
  };
  
  const validateModuleForm = () => {
    const errors = {};
    
    if (!moduleData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!moduleData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    // Validate content based on content type
    if (moduleData.contentType === 'video' && !moduleData.content.videoUrl.trim()) {
      errors.videoUrl = 'Video URL is required';
    }
    
    if (moduleData.contentType === 'text' && !moduleData.content.text.trim()) {
      errors.text = 'Content is required';
    }
    
    if (moduleData.contentType === 'quizz') {
      const quizErrors = [];
      
      moduleData.content.quiz.questions.forEach((question, index) => {
        const questionErrors = {};
        
        if (!question.question.trim()) {
          questionErrors.question = 'Question text is required';
        }
        
        let hasCorrectOption = false;
        const optionErrors = [];
        
        question.options.forEach((option, optIndex) => {
          const optionError = {};
          
          if (!option.trim()) {
            optionError.text = 'Option text is required';
          }
          
          if (option === question.correctOption) {
            hasCorrectOption = true;
          }
          
          if (Object.keys(optionError).length > 0) {
            optionErrors[optIndex] = optionError;
          }
        });
        
        if (!hasCorrectOption) {
          questionErrors.options = 'At least one option must be marked as correct';
        }
        
        if (optionErrors.length > 0) {
          questionErrors.optionErrors = optionErrors;
        }
        
        if (Object.keys(questionErrors).length > 0) {
          quizErrors[index] = questionErrors;
        }
      });
      
      if (quizErrors.length > 0) {
        errors.quizQuestions = quizErrors;
      }
    }
    
    setModuleErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddModule = async () => {
    if (!validateModuleForm()) {
      return;
    }
    
    setAddingModuleLoading(true);
    
    try {
      const response = await moduleService.createModule(
        courseId, 
        currentSectionId, 
        moduleData
      );
      
      await fetchCourseDetails();
      
      handleSuccess('Module added successfully');
      handleCloseModuleDialog();
    } catch (err) {
      console.error('Error adding module:', err);
      handleError(err.formattedMessage || 'Failed to add module. Please try again.');
    } finally {
      setAddingModuleLoading(false);
    }
  };
  
  // Updated to handle module selection
  const handleSelectModule = (module) => {
    setSelectedModule(module);
    
    // Record view for enrolled users
    if (!userState.isCreator && userState.isEnrolled) {
      handleModuleView(module);
    }
    
    // If it's a quiz and we want fullscreen mode
    if (module.contentType === 'quizz') {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      setIsFullscreenQuiz(true);
    } else {
      setIsFullscreenQuiz(false);
    }
  };
  
  // Close fullscreen quiz view
  const handleCloseFullscreenQuiz = () => {
    setIsFullscreenQuiz(false);
  };
  
  // Handle module view
  const handleViewModule = (module) => {
    setCurrentModule(module);
    setModuleViewRecorded(false);  // Reset the flag when opening a new module
    
    // Reset quiz state if it's a quiz
    if (module.contentType === 'quizz') {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
    }
    
    setOpenModuleViewDialog(true);
    
    // Track the view after the dialog is opened
    if (!userState.isCreator && userState.isEnrolled) {
      handleModuleView(module);
    }
  };
  
  const handleCloseModuleViewDialog = () => {
    setOpenModuleViewDialog(false);
    setCurrentModule(null);
  };
  
  // Handle edit module
  const handleEditModule = (module) => {
    // Set current section ID
    setCurrentSectionId(module.sectionId);
    
    // Set module data
    setModuleData({
      title: module.title,
      description: module.description,
      contentType: module.contentType,
      content: {
        text: module.textContent?.content || '',
        videoUrl: module.videoContent?.videoUrl || '',
        quiz: {
          questions: module.quizContent?.questions || []
        }
      }
    });
    
    // Clear errors
    setModuleErrors({});
    
    // Open dialog
    setOpenModuleDialog(true);
  };
  
  // Handle delete module
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await moduleService.deleteModule(moduleId);
      
      if (response.success) {
        handleSuccess('Module deleted successfully');
        // Refresh course data
        fetchCourseDetails();
      } else {
        handleError(response.message || 'Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      handleError(error.formattedMessage || 'Failed to delete module. Please try again.');
    }
  };
  
  // Handle quiz answer selection
  const handleQuizAnswerChange = (questionIndex, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: optionIndex
    });
  };
  
  // Submit quiz answers and calculate score
  const handleSubmitQuiz = () => {
    if (!currentModule || !currentModule.quizContent) return;
    
    const questions = currentModule.quizContent.questions;
    let correctAnswers = 0;
    
    questions.forEach((question, qIndex) => {
      const selectedOptionIndex = quizAnswers[qIndex];
      
      if (selectedOptionIndex !== undefined) {
        const isCorrect = question.options[selectedOptionIndex].isCorrect;
        if (isCorrect) correctAnswers++;
      }
    });
    
    const scorePercentage = (correctAnswers / questions.length) * 100;
    setQuizScore(scorePercentage);
    setQuizSubmitted(true);

    // Track quiz completion if score meets passing threshold
    const passingScore = currentModule.quizContent.passingScore || 70;
    if (scorePercentage >= passingScore) {
      handleQuizCompletion(currentModule._id, scorePercentage, passingScore);
    }
  };
  
  // Handle enrollment status change
  const handleEnrollmentChange = (isEnrolled) => {
    // Don't trigger a full reload, just update the state
    setUserState(prev => ({
      ...prev,
      isEnrolled,
      // Reset enrollment data loaded flag to allow fetching fresh data
      enrollmentDataLoaded: false
    }));
    
    // Only fetch course details if there's a change in enrollment status
    if (isEnrolled !== userState.isEnrolled) {
      fetchCourseDetails();
    }
  };
  
  // Render module completion status for enrolled students
  const renderModuleCompletionStatus = (module) => {
    if (!userState.enrollmentData || !userState.isEnrolled) return null;
    
    const moduleProgress = userState.enrollmentData.sectionProgress
      ?.flatMap(section => section.moduleProgress)
      ?.find(mp => mp.moduleId === module._id);
    
    if (moduleProgress?.isCompleted) {
      return (
        <CheckCircleIcon color="success" sx={{ ml: 1 }} />
      );
    }
    
    return null;
  };
  
  // Modify handleModuleView to use the flag
  const handleModuleView = async (module) => {
    if (!userState.isEnrolled || userState.isCreator || moduleViewRecorded) return;
    
    try {
      // Track that the user has viewed this module
      await enrollmentService.trackModuleView(courseId, module._id);
      setModuleViewRecorded(true);
      
      // Update both progress bars immediately
      const updatedEnrollmentData = await enrollmentService.getEnrollmentStatus(courseId);
      setUserState(prev => ({
        ...prev,
        enrollmentData: updatedEnrollmentData
      }));

      // Update video progress if it's a video module
      if (module.contentType === 'video') {
        setVideoProgress(prev => ({
          ...prev,
          [module._id]: 100 // Set to 100% when module is completed
        }));
      }
    } catch (error) {
      console.error('Error tracking module view:', error);
    }
  };
  
  // Add function to handle video progress
  const handleVideoProgress = (moduleId, event) => {
    const video = event.target;
    const progress = (video.currentTime / video.duration) * 100;
    
    setVideoProgress(prev => ({
      ...prev,
      [moduleId]: progress
    }));
  };
  
  // Add function to handle video completion
  const handleVideoComplete = async (moduleId) => {
    if (!userState.isEnrolled || userState.isCreator || moduleViewRecorded) return;
    
    try {
      // Track that the user has completed this module
      await enrollmentService.trackModuleView(courseId, moduleId);
      setModuleViewRecorded(true);
      
      // Update both progress bars immediately
      const updatedEnrollmentData = await enrollmentService.getEnrollmentStatus(courseId);
      setUserState(prev => ({
        ...prev,
        enrollmentData: updatedEnrollmentData
      }));

      // Update video progress
      setVideoProgress(prev => ({
        ...prev,
        [moduleId]: 100 // Set to 100% when video is completed
      }));
    } catch (error) {
      console.error('Error tracking module completion:', error);
    }
  };
  
  // Update the handleQuizCompletion function
  const handleQuizCompletion = async (moduleId, score, passingScore) => {
    if (!userState.isEnrolled || userState.isCreator || moduleViewRecorded) return;
    
    // Only mark as complete if the score meets or exceeds the passing score
    if (score >= passingScore) {
      try {
        // Track that the user has completed this module
        await enrollmentService.trackModuleView(courseId, moduleId);
        setModuleViewRecorded(true);
        
        // Update both progress bars immediately
        const updatedEnrollmentData = await enrollmentService.getEnrollmentStatus(courseId);
        setUserState(prev => ({
          ...prev,
          enrollmentData: updatedEnrollmentData
        }));
      } catch (error) {
        console.error('Error tracking quiz completion:', error);
      }
    }
  };
  
  // Update the getYouTubeVideoId function to handle more URL formats
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/i,
      /youtube\.com\/v\/([^"&?\/\s]{11})/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };
  
  // Render module content directly in the right panel
  const renderSelectedContent = () => {
    if (!selectedModule) {
      // Show course description when no module is selected
      return (
        <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: '12px', bgcolor: '#fff' }}>
          <Typography variant="h4" gutterBottom>
            Course Introduction
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {course?.description}
            </Typography>
          </Box>
          
          {userState.isEnrolled && !userState.isCreator && userState.enrollmentData && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Progress: {userState.enrollmentData.progress || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={userState.enrollmentData.progress || 0} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}
          
          {!userState.isEnrolled && !userState.isCreator && (
            <Box sx={{ mt: 4 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Enroll in this course to start learning.
              </Alert>
              <EnrollmentButton 
                courseId={courseId} 
                onEnrollmentChange={handleEnrollmentChange} 
              />
            </Box>
          )}
        </Paper>
      );
    }

    // Render based on content type
    switch (selectedModule.contentType) {
      case 'video':
        // Extract video ID from the URL
        const videoUrl = selectedModule.videoContent.videoUrl;
        const videoId = getYouTubeVideoId(videoUrl);
        
        if (!videoId) {
          return (
            <Alert severity="error">
              Invalid YouTube video URL. Please check the URL format.
            </Alert>
          );
        }

        return (
          <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {selectedModule.title}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              {selectedModule.description}
            </Typography>
            
            <Box sx={{ 
              width: '100%', 
              aspectRatio: '16/9', 
              mb: 2,
              position: 'relative',
              bgcolor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              flexGrow: 1
            }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
            
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Video Progress: {Math.round(videoProgress[selectedModule._id] || 0)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={videoProgress[selectedModule._id] || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Paper>
        );
      
      case 'text':
        return (
          <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: '12px', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {selectedModule.title}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              {selectedModule.description}
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ mt: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: selectedModule.textContent.content }} />
          </Box>
          </Paper>
        );
      
      case 'quizz':
        // For quizzes, we'll use the fullscreen mode
        // But have a placeholder here in case we need to render in the panel
        return (
          <Paper elevation={2} sx={{ p: 4, height: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <QuizIcon sx={{ fontSize: 60, color: '#FDC886', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Quiz: {selectedModule.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
              This quiz will be displayed in fullscreen mode.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setIsFullscreenQuiz(true)}
              sx={{ 
                mt: 2, 
                bgcolor: '#FDC886', 
                color: '#37474F', 
                '&:hover': { bgcolor: '#f0aa75' } 
              }}
            >
              Start Quiz
            </Button>
          </Paper>
        );
      
      default:
        return (
          <Alert severity="info">
            Select a module from the course content to view it.
          </Alert>
        );
    }
  };

  // Fullscreen quiz component
  const renderFullscreenQuiz = () => {
    if (!selectedModule || selectedModule.contentType !== 'quizz' || !selectedModule.quizContent) {
      return null;
    }

    const passingScore = selectedModule.quizContent.passingScore || 70;
        
        return (
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        bgcolor: 'white', 
        zIndex: 1300,
        p: 4,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">{selectedModule.title}</Typography>
          <IconButton onClick={handleCloseFullscreenQuiz}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4 }}>
            {quizSubmitted ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '60vh' 
            }}>
                <Typography variant="h6" gutterBottom>
                  Quiz Result
                </Typography>
              
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                <CircularProgress
                  variant="determinate"
                  value={quizScore}
                  size={120}
                  thickness={5}
                  sx={{ 
                    color: quizScore >= passingScore ? '#4caf50' : '#f44336',
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {quizScore.toFixed(0)}%
                </Typography>
                </Box>
              </Box>
                
              <Alert severity={quizScore >= passingScore ? "success" : "error"} sx={{ mb: 4, width: '100%', maxWidth: 500 }}>
                  {quizScore >= passingScore 
                    ? `Congratulations! You've passed this quiz.` 
                    : `You need ${passingScore}% to pass. Please try again.`}
                </Alert>
                
              <Typography variant="h6" gutterBottom>Review Your Answers</Typography>
              
              {selectedModule.quizContent.questions.map((question, qIndex) => (
                <Paper 
                  key={qIndex} 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    width: '100%', 
                    maxWidth: 700,
                    borderLeft: '5px solid',
                    borderColor: question.options[quizAnswers[qIndex]]?.isCorrect ? '#4caf50' : '#f44336' 
                  }}
                >
                  <Typography variant="h6" gutterBottom dangerouslySetInnerHTML={{ __html: `${qIndex + 1}. ${question.question}` }} />
                  
                  {question.options.map((option, oIndex) => (
                    <Box 
                      key={oIndex}
                      sx={{
                        p: 2,
                        mt: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: oIndex === quizAnswers[qIndex] 
                          ? (option.isCorrect ? '#4caf50' : '#f44336') 
                          : (option.isCorrect ? '#e6f4ea' : '#e0e0e0'),
                        bgcolor: oIndex === quizAnswers[qIndex] 
                          ? (option.isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)') 
                          : (option.isCorrect ? 'rgba(76, 175, 80, 0.05)' : 'transparent'),
                      }}
                    >
                      <Typography dangerouslySetInnerHTML={{ __html: option.text }} />
                      
                      {option.isCorrect && (
                        <Typography variant="caption" sx={{ color: '#4caf50', display: 'block', mt: 1 }}>
                          Correct Answer
                        </Typography>
                      )}
                      
                      {oIndex === quizAnswers[qIndex] && !option.isCorrect && (
                        <Typography variant="caption" sx={{ color: '#f44336', display: 'block', mt: 1 }}>
                          Your Answer (Incorrect)
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Paper>
              ))}
              
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setQuizSubmitted(false)}
                  sx={{ borderColor: '#FDC886', color: '#37474F' }}
                >
                  Try Again
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleCloseFullscreenQuiz}
                  sx={{ bgcolor: '#FDC886', color: '#37474F', '&:hover': { bgcolor: '#f0aa75' } }}
                >
                  Return to Course
                </Button>
              </Box>
              </Box>
            ) : (
              <>
              <Typography variant="body1" gutterBottom>
                {selectedModule.description}
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Answer all questions and click submit to complete this quiz.
                </Alert>
                
                {selectedModule.quizContent.questions.map((question, qIndex) => (
                  <Card key={qIndex} sx={{ mb: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: `Question ${qIndex + 1}: ${question.question}` }} />
                      
                      <RadioGroup
                        value={quizAnswers[qIndex] !== undefined ? quizAnswers[qIndex] : null}
                        onChange={(e) => handleQuizAnswerChange(qIndex, parseInt(e.target.value))}
                      >
                        {question.options.map((option, oIndex) => (
                          <FormControlLabel
                            key={oIndex}
                            value={oIndex}
                            control={<Radio sx={{ color: '#FDC886', '&.Mui-checked': { color: '#FDC886' } }} />}
                            label={<span dangerouslySetInnerHTML={{ __html: option.text }} />}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: '1px solid #e0e0e0',
                              mb: 2,
                              width: '100%',
                              '&:hover': { bgcolor: 'rgba(253, 200, 134, 0.05)' },
                              ...(quizAnswers[qIndex] === oIndex ? {
                                bgcolor: 'rgba(253, 200, 134, 0.1)',
                                borderColor: '#FDC886'
                              } : {})
                            }}
                          />
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
              </Box>
                
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length !== selectedModule.quizContent.questions.length}
                  sx={{ 
                    bgcolor: '#FDC886', 
                    color: '#37474F', 
                    px: 4, 
                    py: 1.5, 
                    fontSize: '1.1rem',
                    '&:hover': { bgcolor: '#f0aa75' },
                    '&.Mui-disabled': { bgcolor: '#f5f5f5', color: '#bdbdbd' }
                  }}
                >
                  Submit Answers
                  </Button>
                </Box>
              </>
            )}
          </Box>
          </Box>
        );
  };
  
  // Update the useEffect for video completion
  useEffect(() => {
    if (currentModule?.contentType === 'video' && currentModule.videoContent?.videoUrl) {
      // Track video completion when the video ends
      const handleVideoEnd = () => {
        handleVideoComplete(currentModule._id);
      };

      window.addEventListener('videoComplete', handleVideoEnd);
      return () => {
        window.removeEventListener('videoComplete', handleVideoEnd);
      };
    }
  }, [currentModule]);

  // Add scroll handler
  useEffect(() => {
    const contentBox = document.querySelector('.content-box');
    let scrollTimeout;

    const handleScroll = () => {
      contentBox.classList.add('scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        contentBox.classList.remove('scrolling');
      }, 1000); // Hide scrollbar 1 second after scrolling stops
    };

    if (contentBox) {
      contentBox.addEventListener('scroll', handleScroll);
      return () => {
        contentBox.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, []);
  
  // Render content form based on selected type for module creation
  const renderContentForm = () => {
    switch (moduleData.contentType) {
      case 'video':
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Video URL (YouTube or Vimeo)"
              name="videoUrl"
              value={moduleData.content.videoUrl}
              onChange={handleContentChange}
              error={!!moduleErrors.content?.videoUrl}
              helperText={moduleErrors.content?.videoUrl}
              placeholder="https://www.youtube.com/embed/..."
            />
            <FormHelperText>
              Please use embedded video URLs (for YouTube, use the embed link format)
            </FormHelperText>
          </Box>
        );
      
      case 'text':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Content</Typography>
            <Box sx={{ minHeight: 300, mb: 2 }}>
              <RichTextEditor
                value={moduleData.content.text}
                onChange={handleContentChange}
                error={!!moduleErrors.content?.text}
                helperText={moduleErrors.content?.text}
                placeholder="Enter your content here..."
                minHeight={300}
              />
            </Box>
          </Box>
        );
      
      case 'quizz':
        return (
          <Box>
            {moduleData.content.quiz.questions.map((question, qIndex) => (
              <Box key={qIndex} sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <TextField
                  fullWidth
                  label={`Question ${qIndex + 1}`}
                  value={question.question}
                  onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  sx={{ mb: 2 }}
                />
                
                {question.options.map((option, oIndex) => (
                  <Box key={oIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    />
                    <Radio
                      checked={question.correctOption === oIndex}
                      onChange={(e) => handleCorrectOptionChange(qIndex, oIndex)}
                    />
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleAddOption(qIndex)}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddQuizQuestion}
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
            >
              Add Question
            </Button>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="main-content">
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
          <Button onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="main-content">
          <Alert severity="info">
            Course not found
          </Alert>
          <Button onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }
  
  // New layout with left sidebar and right content panel
  return (
    <Container maxWidth="xl" sx={{ height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <Box className="content-box" sx={{ 
          flexGrow: 1, 
          p: 3,
          width: '100%',
          maxWidth: 'calc(100% - 240px)', // 240px is the width of the sidebar
          height: '100vh',
          overflow: 'hidden', // Don't allow scrolling on the container
        }}>
          {/* Breadcrumbs navigation */}
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/courses" underline="hover">
              Courses
            </Link>
            <Typography color="text.primary">{course?.title || 'Course Details'}</Typography>
          </Breadcrumbs>
          
              {/* Course Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 500 }}>
                      {course.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        By: {course.createdBy?.name || 'Unknown Instructor'}
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        <Box 
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: '4px', 
                            bgcolor: course.isOptional ? '#FDC886' : '#FFB74D',
                            color: 'black',
                            display: 'inline-block'
                          }}
                        >
                          {course.isOptional ? 'Optional' : 'Mandatory'}
                        </Box>
                      </Box>
                      {course.deadline && (
                        <Typography variant="body2">
                          Deadline: {new Date(course.deadline).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    {/* Show different controls based on user role */}
                    {userState.isCreator || userState.isAdmin ? (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={handleOpenSectionDialog}
                    sx={{ 
                      borderRadius: '8px',
                      backgroundColor: '#FDC886', 
                      color: '#37474F',
                      '&:hover': { backgroundColor: '#f0aa75' },
                    }}
                      >
                        Add Section
                      </Button>
                    ) : (
                      <Box sx={{ minHeight: '40px' }}> {/* Add fixed height container */}
                        <EnrollmentButton 
                          courseId={courseId} 
                          onEnrollmentChange={handleEnrollmentChange} 
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
              
          {/* Two column layout for course content */}
          <Box sx={{ 
            display: 'flex', 
            height: 'calc(100vh - 200px)', // Subtract header height from viewport
            overflow: 'hidden'
          }}>
            {/* Left column - Course sections and modules */}
            <Box sx={{ 
              width: '350px', 
              mr: 3, 
              overflowY: 'auto',
              borderRadius: '12px',
              bgcolor: '#f9f9f9',
              p: 2,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#bdbdbd',
                borderRadius: '6px',
              },
            }}>
              <Typography variant="h6" sx={{ mb: 2, px: 1 }}>
                Course Content
              </Typography>
              
              {(!course.sections || course.sections.length === 0) ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  No sections found. {userState.isCreator ? "Add sections to organize your course content." : "The instructor hasn't added any content yet."}
                </Alert>
              ) : (
                course.sections.map((section, index) => (
                  <Accordion 
                    key={section._id} 
                    defaultExpanded={index === 0}
                    sx={{ 
                      mb: 2, 
                      boxShadow: 'none', 
                      '&:before': { display: 'none' },
                      bgcolor: 'transparent',
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        bgcolor: '#f0f0f0', 
                        borderRadius: '8px',
                        '&.Mui-expanded': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          Section {index + 1}: {section.title}
                        </Typography>
                        {/* Only show add module button for creators/admins */}
                        {(userState.isCreator || userState.isAdmin) && (
                          <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex' }}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModuleDialog(section._id);
                              }}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ 
                      bgcolor: '#f9f9f9', 
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                      p: 1
                    }}>
                      {/* Modules in this section */}
                      {(!section.modules || section.modules.length === 0) ? (
                        <Alert severity="info" sx={{ my: 2 }}>
                          No modules in this section
                        </Alert>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {section.modules.map((module, mIndex) => (
                            <ListItem 
                              key={module._id} 
                              button
                              onClick={() => handleSelectModule(module)}
                              sx={{ 
                                borderRadius: '8px',
                                mb: 1,
                                transition: 'all 0.2s',
                                bgcolor: selectedModule?._id === module._id ? 'rgba(253, 200, 134, 0.2)' : 'transparent',
                                border: selectedModule?._id === module._id ? '1px solid #FDC886' : '1px solid transparent',
                                '&:hover': {
                                  bgcolor: 'rgba(253, 200, 134, 0.1)',
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: '36px' }}>
                                {module.contentType === 'video' && <VideoLibraryIcon sx={{ color: '#FDC886' }} />}
                                {module.contentType === 'text' && <TextSnippetIcon sx={{ color: '#FDC886' }} />}
                                {module.contentType === 'quizz' && <QuizIcon sx={{ color: '#FDC886' }} />}
                              </ListItemIcon>
                              <ListItemText 
                                primary={`${mIndex + 1}. ${module.title}`} 
                                primaryTypographyProps={{ 
                                  fontSize: '0.9rem',
                                  fontWeight: selectedModule?._id === module._id ? 600 : 400 
                                }}
                              />
                              
                              {/* Show completion status for enrolled students */}
                              {renderModuleCompletionStatus(module)}
                              
                              {/* Module actions for admin/creator */}
                                {(userState.isCreator || userState.isAdmin) && (
                                <Box sx={{ ml: 1, display: 'flex' }}>
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                    sx={{ mr: 0.5 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditModule(module);
                                    }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteModule(module._id);
                                    }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                              </Box>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      )}
                      
                      {/* Only show add module button for creators/admins */}
                      {(userState.isCreator || userState.isAdmin) && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenModuleDialog(section._id)}
                          sx={{ 
                            mt: 1,
                            borderColor: '#FDC886',
                            color: '#37474F',
                            '&:hover': {
                              borderColor: '#f0aa75',
                              bgcolor: 'rgba(253, 200, 134, 0.1)',
                            }
                          }}
                        >
                          Add Module
                        </Button>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
              
              {/* Only show add section button at bottom for creators/admins */}
              {(userState.isCreator || userState.isAdmin) && (
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenSectionDialog}
                  sx={{ 
                    mt: 2,
                    borderColor: '#FDC886',
                    color: '#37474F',
                    '&:hover': {
                      borderColor: '#f0aa75',
                      bgcolor: 'rgba(253, 200, 134, 0.1)',
                    }
                  }}
                  fullWidth
                >
                  Add Section
                </Button>
              )}
            </Box>
            
            {/* Right column - Content display */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#bdbdbd',
                borderRadius: '6px',
              },
            }}>
              {renderSelectedContent()}
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Fullscreen Quiz View */}
      {isFullscreenQuiz && renderFullscreenQuiz()}
      
      {/* Section Dialog */}
      <Dialog
        open={openSectionDialog}
        onClose={handleCloseSectionDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add New Section
          <IconButton
            aria-label="close"
            onClick={handleCloseSectionDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Section Title"
              name="title"
              value={sectionData.title}
              onChange={handleSectionChange}
              error={!!sectionErrors.title}
              helperText={sectionErrors.title}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
            <Box sx={{ minHeight: 200, mb: 2 }}>
              <RichTextEditor
                value={sectionData.description}
                onChange={handleSectionRichTextChange}
                error={!!sectionErrors.description}
                helperText={sectionErrors.description}
                placeholder="Enter section description..."
                minHeight={200}
              />
            </Box>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Deadline (Optional)"
                value={sectionData.deadline}
                onChange={handleSectionDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSectionDialog}>Cancel</Button>
          <Button 
            onClick={handleAddSection}
            variant="contained"
            disabled={addingSectionLoading}
          >
            {addingSectionLoading ? <CircularProgress size={24} /> : 'Add Section'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Module Dialog */}
      <Dialog
        open={openModuleDialog}
        onClose={handleCloseModuleDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Add New Module
          <IconButton
            aria-label="close"
            onClick={handleCloseModuleDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Module Title"
              name="title"
              value={moduleData.title}
              onChange={handleModuleChange}
              error={!!moduleErrors.title}
              helperText={moduleErrors.title}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Module Description"
              name="description"
              value={moduleData.description}
              onChange={handleModuleChange}
              error={!!moduleErrors.description}
              helperText={moduleErrors.description}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Content Type</InputLabel>
              <Select
                name="contentType"
                value={moduleData.contentType}
                onChange={handleModuleChange}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="quizz">Quiz</MenuItem>
              </Select>
            </FormControl>
            
            {/* Render content form based on selected type */}
            {renderContentForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModuleDialog}>Cancel</Button>
          <Button 
            onClick={handleAddModule}
            variant="contained"
            disabled={addingModuleLoading}
          >
            {addingModuleLoading ? <CircularProgress size={24} /> : 'Add Module'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseDetail; 