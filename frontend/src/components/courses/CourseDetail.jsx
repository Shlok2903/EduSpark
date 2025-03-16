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
  CardContent
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { courseService, sectionService, moduleService } from '../../services/api';
import { handleError, handleSuccess } from '../../utils';
import Sidebar from '../common/sidebar/Sidebar';
import RichTextEditor from '../common/RichTextEditor';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import QuizIcon from '@mui/icons-material/Quiz';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
  
  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await courseService.getCourseById(courseId);
      
      if (response.success) {
        setCourse(response.data);
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
  
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);
  
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
    
    // Reset quiz state if it's a quiz
    if (module.contentType === 'quizz') {
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
    }
    
    setOpenModuleViewDialog(true);
  };
  
  const handleCloseModuleViewDialog = () => {
    setOpenModuleViewDialog(false);
    setCurrentModule(null);
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
  };
  
  // Render module content based on type
  const renderModuleContent = () => {
    if (!currentModule) return null;
    
    switch (currentModule.contentType) {
      case 'video':
        return (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <iframe
              width="100%"
              height="480"
              src={currentModule.videoContent?.videoUrl}
              title={currentModule.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
        );
      
      case 'text':
        return (
          <Box sx={{ p: 2 }}>
            <DialogContentText component="div" dangerouslySetInnerHTML={{ __html: currentModule.textContent?.content }} />
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
    <div className="home-container">
      <Sidebar />
      <div className="main-content">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/courses');
            }}
          >
            Courses
          </Link>
          <Typography color="text.primary">{course.title}</Typography>
        </Breadcrumbs>
        
        {/* Course Header */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: '12px',
            backgroundImage: course.imageUrl ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${course.imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: course.imageUrl ? 'white' : 'inherit',
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                {course.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {course.description}
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Instructor: {course.createdBy?.name || 'Unknown'}
                </Typography>
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
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenSectionDialog}
                sx={{ borderRadius: '8px' }}
              >
                Add Section
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Course Sections */}
        <Typography variant="h5" sx={{ mb: 2 }}>
          Course Content
        </Typography>
        
        {(!course.sections || course.sections.length === 0) ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No sections found. Add sections to organize your course content.
          </Alert>
        ) : (
          course.sections.map((section, index) => (
            <Accordion key={section._id} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Section {index + 1}: {section.title}
                  </Typography>
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
                    No modules found in this section. Add modules to provide content.
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
                          <ModuleTypeIcon type={module.contentType} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${mIndex + 1}. ${module.title}`} 
                          secondary={<span dangerouslySetInnerHTML={{ __html: module.description }} />}
                        />
                        <IconButton 
                          size="small"
                          onClick={() => handleViewModule(module)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenModuleDialog(section._id)}
                  sx={{ mt: 2 }}
                >
                  Add Module
                </Button>
              </AccordionDetails>
            </Accordion>
          ))
        )}
        
        {/* Add Section Button at bottom */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenSectionDialog}
          sx={{ mt: 3, borderRadius: '8px' }}
        >
          Add Section
        </Button>
        
        {/* Section Dialog */}
        <Dialog 
          open={openSectionDialog} 
          onClose={handleCloseSectionDialog}
          maxWidth="sm"
          fullWidth
          className="editor-dialog"
          sx={{
            '.MuiDialogContent-root': {
              overflow: 'visible', // This helps with editor dropdown menus
            }
          }}
        >
          <DialogTitle>Add New Section</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Section Title"
              name="title"
              value={sectionData.title}
              onChange={handleSectionChange}
              fullWidth
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
                minHeight={180}
              />
            </Box>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Deadline (optional)"
                value={sectionData.deadline}
                onChange={handleSectionDateChange}
                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
              />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSectionDialog}>Cancel</Button>
            <Button 
              onClick={handleAddSection} 
              variant="contained" 
              color="primary"
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
          className="editor-dialog"
          sx={{
            '.MuiDialogContent-root': {
              overflow: 'visible', // This helps with editor dropdown menus
            }
          }}
        >
          <DialogTitle>Add New Module</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Module Title"
              name="title"
              value={moduleData.title}
              onChange={handleModuleChange}
              fullWidth
              error={!!moduleErrors.title}
              helperText={moduleErrors.title}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
            <Box sx={{ minHeight: 200, mb: 2 }}>
              <RichTextEditor
                value={moduleData.description}
                onChange={(content) => {
                  setModuleData(prev => ({
                    ...prev,
                    description: content
                  }));
                  if (moduleErrors.description) {
                    setModuleErrors(prev => ({
                      ...prev,
                      description: ''
                    }));
                  }
                }}
                error={!!moduleErrors.description}
                helperText={moduleErrors.description}
                placeholder="Enter module description..."
                minHeight={120}
              />
            </Box>
            
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Content Type</InputLabel>
              <Select
                name="contentType"
                value={moduleData.contentType}
                onChange={handleModuleChange}
                label="Content Type"
              >
                <MenuItem value="text">Text Content</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="quizz">Quiz</MenuItem>
              </Select>
            </FormControl>
            
            {/* Render content form based on selected type */}
            {renderContentForm()}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModuleDialog}>Cancel</Button>
            <Button 
              onClick={handleAddModule} 
              variant="contained" 
              color="primary"
              disabled={addingModuleLoading}
            >
              {addingModuleLoading ? <CircularProgress size={24} /> : 'Add Module'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Module View Dialog */}
        <Dialog
          open={openModuleViewDialog}
          onClose={handleCloseModuleViewDialog}
          maxWidth="md"
          fullWidth
        >
          {currentModule && (
            <>
              <DialogTitle>
                {currentModule.title}
              </DialogTitle>
              <DialogContent>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  gutterBottom
                  dangerouslySetInnerHTML={{ __html: currentModule.description }}
                />
                <Divider sx={{ my: 2 }} />
                {renderModuleContent()}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseModuleViewDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </div>
    </div>
  );
};

export default CourseDetail; 