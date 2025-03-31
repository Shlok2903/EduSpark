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
    contentType: 'text', // Default to text
  });
  const [moduleErrors, setModuleErrors] = useState({});
  const [addingModuleLoading, setAddingModuleLoading] = useState(false);
  
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
  };
  
  const handleSectionChange = (e) => {
    const { name, value } = e.target;
    setSectionData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (sectionErrors[name]) {
      setSectionErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Add new handler for rich text editor changes
  const handleSectionRichTextChange = (content) => {
    setSectionData(prev => ({
      ...prev,
      description: content
    }));
    
    // Clear validation error when user edits
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
  
  const validateSectionForm = () => {
    const errors = {};
    
    if (!sectionData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!sectionData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setSectionErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddSection = async () => {
    if (!validateSectionForm()) {
      return;
    }
    
    setAddingSectionLoading(true);
    
    try {
      // Make the actual API call to create a section
      const response = await sectionService.createSection(courseId, {
        title: sectionData.title,
        description: sectionData.description,
        deadline: sectionData.deadline
      });
      
      if (response.success) {
        // Refresh course data to get the updated sections
        await fetchCourseDetails();
        
        handleSuccess('Section added successfully');
        handleCloseSectionDialog();
      } else {
        handleError(response.message || 'Failed to add section');
      }
    } catch (err) {
      console.error('Error adding section:', err);
      handleError(err.formattedMessage || 'Failed to add section. Please try again.');
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
  };
  
  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setModuleData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (moduleErrors[name]) {
      setModuleErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
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
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...contentData.quizQuestions];
    updatedQuestions[index][field] = value;
    
    setContentData(prev => ({
      ...prev,
      quizQuestions: updatedQuestions
    }));
  };
  
  // Add handler for rich text in quiz questions
  const handleQuestionRichTextChange = (index, content) => {
    const updatedQuestions = [...contentData.quizQuestions];
    updatedQuestions[index].question = content;
    
    setContentData(prev => ({
      ...prev,
      quizQuestions: updatedQuestions
    }));
  };
  
  // Handle quiz option changes
  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...contentData.quizQuestions];
    
    if (field === 'isCorrect' && value === true) {
      // If making this option correct, make all others incorrect
      updatedQuestions[questionIndex].options.forEach((option, idx) => {
        option.isCorrect = idx === optionIndex;
      });
    } else {
      updatedQuestions[questionIndex].options[optionIndex][field] = value;
    }
    
    setContentData(prev => ({
      ...prev,
      quizQuestions: updatedQuestions
    }));
  };
  
  // Add handler for rich text in quiz options
  const handleOptionRichTextChange = (questionIndex, optionIndex, content) => {
    const updatedQuestions = [...contentData.quizQuestions];
    updatedQuestions[questionIndex].options[optionIndex].text = content;
    
    setContentData(prev => ({
      ...prev,
      quizQuestions: updatedQuestions
    }));
  };
  
  // Add new question to quiz
  const addQuestion = () => {
    setContentData(prev => ({
      ...prev,
      quizQuestions: [
        ...prev.quizQuestions,
        { question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }
      ]
    }));
  };
  
  // Add new option to a question
  const addOption = (questionIndex) => {
    const updatedQuestions = [...contentData.quizQuestions];
    updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    
    setContentData(prev => ({
      ...prev,
      quizQuestions: updatedQuestions
    }));
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
    if (moduleData.contentType === 'video' && !contentData.videoUrl.trim()) {
      errors.videoUrl = 'Video URL is required';
    }
    
    if (moduleData.contentType === 'text' && !contentData.textContent.trim()) {
      errors.textContent = 'Content is required';
    }
    
    if (moduleData.contentType === 'quizz') {
      const quizErrors = [];
      
      contentData.quizQuestions.forEach((question, index) => {
        const questionErrors = {};
        
        if (!question.question.trim()) {
          questionErrors.question = 'Question text is required';
        }
        
        let hasCorrectOption = false;
        const optionErrors = [];
        
        question.options.forEach((option, optIndex) => {
          const optionError = {};
          
          if (!option.text.trim()) {
            optionError.text = 'Option text is required';
          }
          
          if (option.isCorrect) {
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
      // Prepare module data based on content type
      const moduleDataToSend = {
        title: moduleData.title,
        description: moduleData.description,
        contentType: moduleData.contentType
      };
      
      // Add content specific data based on type
      switch (moduleData.contentType) {
        case 'video':
          moduleDataToSend.videoUrl = contentData.videoUrl;
          break;
        case 'text':
          moduleDataToSend.textContent = contentData.textContent;
          break;
        case 'quizz':
          moduleDataToSend.quizQuestions = contentData.quizQuestions;
          moduleDataToSend.passingScore = 70; // Default passing score
          break;
        default:
          break;
      }
      
      // Make the actual API call to create a module
      const response = await moduleService.createModule(
        courseId, 
        currentSectionId, 
        moduleDataToSend
      );
      
      if (response.success) {
        // Refresh course data to get the updated modules
        await fetchCourseDetails();
        
        handleSuccess('Module added successfully');
        handleCloseModuleDialog();
      } else {
        handleError(response.message || 'Failed to add module');
      }
    } catch (err) {
      console.error('Error adding module:', err);
      handleError(err.formattedMessage || 'Failed to add module. Please try again.');
    } finally {
      setAddingModuleLoading(false);
    }
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
      contentType: module.contentType
    });
    
    // Set content data based on module type
    if (module.contentType === 'video' && module.videoContent) {
      setContentData({
        ...contentData,
        videoUrl: module.videoContent.videoUrl
      });
    } else if (module.contentType === 'text' && module.textContent) {
      setContentData({
        ...contentData,
        textContent: module.textContent.content
      });
    } else if (module.contentType === 'quizz' && module.quizContent) {
      setContentData({
        ...contentData,
        quizQuestions: module.quizContent.questions || []
      });
    }
    
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
  
  // Render module content based on type
  const renderModuleContent = () => {
    if (!currentModule) return null;
    
    switch (currentModule.contentType) {
      case 'video':
        // Extract video ID from the URL
        const videoUrl = currentModule.videoContent.videoUrl;
        const videoId = getYouTubeVideoId(videoUrl);
        
        if (!videoId) {
          return (
            <Alert severity="error">
              Invalid YouTube video URL. Please check the URL format.
            </Alert>
          );
        }

        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ 
              width: '100%', 
              aspectRatio: '16/9', 
              mb: 2,
              position: 'relative',
              bgcolor: '#000',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* YouTube Player with default controls */}
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
            
            {/* Video Progress Bar */}
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Video Progress: {Math.round(videoProgress[currentModule._id] || 0)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={videoProgress[currentModule._id] || 0} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        );
      
      case 'text':
        return (
          <Box sx={{ p: 2 }}>
            <div dangerouslySetInnerHTML={{ __html: currentModule.textContent.content }} />
          </Box>
        );
      
      case 'quizz':
        if (!currentModule.quizContent) return null;
        
        const passingScore = currentModule.quizContent.passingScore || 70;
        
        return (
          <Box sx={{ p: 2 }}>
            {quizSubmitted ? (
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  Quiz Result
                </Typography>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  {quizScore.toFixed(0)}%
                </Typography>
                
                <Alert severity={quizScore >= passingScore ? "success" : "error"} sx={{ mb: 2 }}>
                  {quizScore >= passingScore 
                    ? `Congratulations! You've passed this quiz.` 
                    : `You need ${passingScore}% to pass. Please try again.`}
                </Alert>
                
                <Button variant="outlined" onClick={() => setQuizSubmitted(false)}>
                  Try Again
                </Button>
              </Box>
            ) : (
              <>
                {currentModule.quizContent.questions.map((question, qIndex) => (
                  <Card key={qIndex} sx={{ mb: 3, bgcolor: '#f9f9f9' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom dangerouslySetInnerHTML={{ __html: `Question ${qIndex + 1}: ${question.question}` }} />
                      
                      <RadioGroup
                        value={quizAnswers[qIndex] !== undefined ? quizAnswers[qIndex] : null}
                        onChange={(e) => handleQuizAnswerChange(qIndex, parseInt(e.target.value))}
                      >
                        {question.options.map((option, oIndex) => (
                          <FormControlLabel
                            key={oIndex}
                            value={oIndex}
                            control={<Radio />}
                            label={<span dangerouslySetInnerHTML={{ __html: option.text }} />}
                          />
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
                
                <Box textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(quizAnswers).length !== currentModule.quizContent.questions.length}
                  >
                    Submit
                  </Button>
                </Box>
              </>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };
  
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
              value={contentData.videoUrl}
              onChange={handleContentChange}
              error={!!moduleErrors.videoUrl}
              helperText={moduleErrors.videoUrl}
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
                value={contentData.textContent}
                onChange={handleContentRichTextChange}
                error={!!moduleErrors.textContent}
                helperText={moduleErrors.textContent}
                placeholder="Enter your content here..."
                minHeight={300}
              />
            </Box>
          </Box>
        );
      
      case 'quizz':
        return (
          <Box sx={{ mt: 2 }}>
            {contentData.quizQuestions.map((question, qIndex) => (
              <Paper key={qIndex} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Question {qIndex + 1}
                </Typography>
                
                <RichTextEditor
                  value={question.question}
                  onChange={(content) => handleQuestionRichTextChange(qIndex, content)}
                  error={!!moduleErrors.quizQuestions?.[qIndex]?.question}
                  helperText={moduleErrors.quizQuestions?.[qIndex]?.question}
                  placeholder="Enter question here..."
                  minHeight={120}
                />
                
                {moduleErrors.quizQuestions?.[qIndex]?.options && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {moduleErrors.quizQuestions[qIndex].options}
                  </Alert>
                )}
                
                {question.options.map((option, oIndex) => (
                  <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 2 }}>
                      <RichTextEditor
                        value={option.text}
                        onChange={(content) => handleOptionRichTextChange(qIndex, oIndex, content)}
                        error={!!moduleErrors.quizQuestions?.[qIndex]?.optionErrors?.[oIndex]?.text}
                        helperText={moduleErrors.quizQuestions?.[qIndex]?.optionErrors?.[oIndex]?.text}
                        placeholder={`Option ${oIndex + 1}`}
                        minHeight={80}
                      />
                    </Box>
                    <FormControl>
                      <Select
                        value={option.isCorrect}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, 'isCorrect', e.target.value)}
                        size="small"
                      >
                        <MenuItem value={true}>Correct</MenuItem>
                        <MenuItem value={false}>Incorrect</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                ))}
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => addOption(qIndex)}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>
              </Paper>
            ))}
            
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={addQuestion}
              sx={{ mt: 1 }}
            >
              Add Question
            </Button>
          </Box>
        );
        
      default:
        return null;
    }
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
          overflowY: 'auto', // Add vertical scroll
          '&::-webkit-scrollbar': {
            width: '8px',
            display: 'none',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
          '&.scrolling::-webkit-scrollbar': {
            display: 'block',
          },
        }}>
          {/* Breadcrumbs navigation */}
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/courses" underline="hover">
              Courses
            </Link>
            <Typography color="text.primary">{course?.title || 'Course Details'}</Typography>
          </Breadcrumbs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* Course Header */}
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '12px', minHeight: '200px' }}>
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
                        sx={{ borderRadius: '8px' }}
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
                
                {/* Display progress for enrolled students */}
                {userState.isEnrolled && !userState.isCreator && userState.enrollmentData && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      Your Progress: {userState.enrollmentData.progress || 0}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={userState.enrollmentData.progress || 0} 
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                )}
              </Paper>
              
              {/* Course Sections */}
              <Typography variant="h5" sx={{ mb: 2 }}>
                Course Content
              </Typography>
              
              {(!course.sections || course.sections.length === 0) ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  No sections found. {userState.isCreator ? "Add sections to organize your course content." : "The instructor hasn't added any content yet."}
                </Alert>
              ) : (
                course.sections.map((section, index) => (
                  <Accordion key={section._id} defaultExpanded={index === 0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography variant="h6">
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
                    <AccordionDetails>
                      <Typography 
                        variant="body1" 
                        sx={{ mb: 2 }}
                        dangerouslySetInnerHTML={{ __html: section.description }}
                      />
                      
                      {section.deadline && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          Section Deadline: {new Date(section.deadline).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      )}
                      
                      {/* Modules in this section */}
                      {(!section.modules || section.modules.length === 0) ? (
                        <Alert severity="info" sx={{ my: 2 }}>
                          No modules found in this section. {userState.isCreator ? "Add modules to provide content." : "The instructor hasn't added any content yet."}
                        </Alert>
                      ) : (
                        <List>
                          {section.modules.map((module, mIndex) => (
                            <ListItem 
                              key={module._id} 
                              sx={{ 
                                bgcolor: '#f5f5f5', 
                                mb: 1, 
                                borderRadius: '8px',
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <ListItemIcon>
                                {module.contentType === 'video' && <VideoLibraryIcon />}
                                {module.contentType === 'text' && <TextSnippetIcon />}
                                {module.contentType === 'quizz' && <QuizIcon />}
                              </ListItemIcon>
                              <ListItemText 
                                primary={`${mIndex + 1}. ${module.title}`} 
                                secondary={`${module.contentType.charAt(0).toUpperCase() + module.contentType.slice(1)} content`}
                              />
                              
                              {/* Show completion status for enrolled students */}
                              {renderModuleCompletionStatus(module)}
                              
                              {/* Module actions */}
                              <Box>
                                <Button 
                                  variant="outlined" 
                                  size="small" 
                                  startIcon={<PlayArrowIcon />} 
                                  sx={{ mr: 1, borderRadius: '20px' }}
                                  onClick={() => handleViewModule(module)}
                                >
                                  View
                                </Button>
                                
                                {/* Only show edit/delete buttons for creators/admins */}
                                {(userState.isCreator || userState.isAdmin) && (
                                  <>
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      sx={{ mr: 1 }}
                                      onClick={() => handleEditModule(module)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleDeleteModule(module._id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
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
                          sx={{ mt: 1 }}
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
                  sx={{ mt: 2 }}
                >
                  Add Section
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
      
      {/* Module View Dialog */}
      <Dialog
        open={openModuleViewDialog}
        onClose={handleCloseModuleViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentModule?.title}
          <IconButton
            aria-label="close"
            onClick={handleCloseModuleViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderModuleContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModuleViewDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Section Dialog */}
      <Dialog
        open={openSectionDialog}
        onClose={handleCloseSectionDialog}
        maxWidth="md"
        fullWidth
      >
        {/* Existing dialog content */}
      </Dialog>
      
      {/* Module Dialog */}
      <Dialog
        open={openModuleDialog}
        onClose={handleCloseModuleDialog}
        maxWidth="md"
        fullWidth
      >
        {/* Existing dialog content */}
      </Dialog>
    </Container>
  );
};

export default CourseDetail; 