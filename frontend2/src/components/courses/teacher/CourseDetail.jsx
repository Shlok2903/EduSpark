import React, { useState, useEffect } from 'react';
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
  TextField,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { 
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoLibrary as VideoLibraryIcon,
  TextSnippet as TextSnippetIcon,
  Quiz as QuizIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import courseService from '../../../services/courseService';
import sectionService from '../../../services/sectionService';
import moduleService from '../../../services/moduleService';
import './CourseDetail.css';

// Module type Icons by content type
const ModuleTypeIcon = ({ type }) => {
  switch(type) {
    case 'video':
      return <VideoLibraryIcon color="primary" />;
    case 'text':
      return <TextSnippetIcon color="primary" />;
    case 'quiz':
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
  const [error, setError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Section and Module state
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  
  // Form data
  const [sectionData, setSectionData] = useState({
    title: '',
    description: ''
  });
  
  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    contentType: 'text',
    content: {
      text: '',
      videoUrl: '',
      quiz: {
        questions: [{ 
          question: '', 
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ] 
        }]
      }
    }
  });
  
  // Edit states
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editSectionId, setEditSectionId] = useState(null);
  const [editModuleId, setEditModuleId] = useState(null);
  
  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);
      
      if (response.data) {
        // Verify the current user is the creator of the course OR an admin OR a tutor
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const isTutor = localStorage.getItem('isTutor') === 'true';
        
        if (!response.data.isCreator && !isAdmin && !isTutor) {
          setError('You do not have permission to access this course');
          navigate('/dashboard/courses');
          return;
        }
        
        setCourse(response.data);
      } else {
        setError('Failed to load course details');
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to fetch course details. Please try again later.');
      
      // Redirect if unauthorized
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        navigate('/dashboard/courses');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Section dialog handlers
  const handleOpenSectionDialog = (sectionId = null) => {
    if (sectionId) {
      // Edit mode
      const section = course.sections.find(s => s._id === sectionId || s.id === sectionId);
      if (section) {
        setSectionData({
          title: section.title,
          description: section.description || ''
        });
        setIsEditingSection(true);
        setEditSectionId(sectionId);
      }
    } else {
      // Create mode
      setSectionData({
        title: '',
        description: ''
      });
      setIsEditingSection(false);
      setEditSectionId(null);
    }
    
    setOpenSectionDialog(true);
  };
  
  const handleCloseSectionDialog = () => {
    setOpenSectionDialog(false);
    setSectionData({
      title: '',
      description: ''
    });
  };
  
  // Module dialog handlers
  const handleOpenModuleDialog = (sectionId, moduleId = null) => {
    console.log('Opening module dialog with sectionId:', sectionId);
    if (!sectionId) {
      toast.error('Section ID is required to add or edit modules');
      return;
    }
    
    setCurrentSectionId(sectionId);
    
    if (moduleId) {
      // Edit mode
      const section = course.sections.find(s => s._id === sectionId || s.id === sectionId);
      if (section) {
        const module = section.modules.find(m => m._id === moduleId || m.id === moduleId);
        if (module) {
          console.log('Module data for editing:', module);
          
          // Handle different content structures
          let contentText = '';
          let contentVideoUrl = '';
          let contentQuizQuestions = [];
          
          if (module.contentType === 'text') {
            contentText = module.textContent?.content || '';
          } else if (module.contentType === 'video') {
            contentVideoUrl = module.videoContent?.videoUrl || '';
          } else if (module.contentType === 'quiz') {
            contentQuizQuestions = module.quizContent?.questions || [];
          }
          
          setModuleData({
            title: module.title || '',
            description: module.description || '',
            contentType: module.contentType || 'text',
            content: {
              text: contentText,
              videoUrl: contentVideoUrl,
              quiz: {
                questions: contentQuizQuestions.length > 0 ? contentQuizQuestions : [{ 
                  question: '', 
                  options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                  ] 
                }]
              }
            }
          });
          
          setIsEditingModule(true);
          setEditModuleId(moduleId);
        }
      }
    } else {
      // Create mode
      setModuleData({
        title: '',
        description: '',
        contentType: 'text',
        content: {
          text: '',
          videoUrl: '',
          quiz: {
            questions: [{ 
              question: '', 
              options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
              ] 
            }]
          }
        }
      });
      setIsEditingModule(false);
      setEditModuleId(null);
    }
    
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
          questions: [{ 
            question: '', 
            options: [
              { text: '', isCorrect: false },
              { text: '', isCorrect: false }
            ] 
          }]
        }
      }
    });
  };
  
  // Section form handlers
  const handleSectionChange = (e) => {
    const { name, value } = e.target;
    setSectionData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Module form handlers
  const handleModuleChange = (e) => {
    const { name, value } = e.target;
    setModuleData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleContentTypeChange = (e) => {
    const value = e.target.value;
    setModuleData(prev => ({
      ...prev,
      contentType: value
    }));
  };
  
  const handleTextContentChange = (e) => {
    const value = e.target.value;
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        text: value
      }
    }));
  };
  
  const handleVideoUrlChange = (e) => {
    const value = e.target.value;
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        videoUrl: value
      }
    }));
  };
  
  // Quiz handlers
  const handleQuizQuestionChange = (index, value) => {
    const updatedQuestions = [...moduleData.content.quiz.questions];
    updatedQuestions[index].question = value;
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  const handleQuizOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...moduleData.content.quiz.questions];
    updatedQuestions[questionIndex].options[optionIndex].text = value;
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  const handleQuizOptionCorrectChange = (questionIndex, optionIndex) => {
    const updatedQuestions = [...moduleData.content.quiz.questions];
    
    // Set all options to false first
    updatedQuestions[questionIndex].options.forEach(option => {
      option.isCorrect = false;
    });
    
    // Set the selected option to true
    updatedQuestions[questionIndex].options[optionIndex].isCorrect = true;
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  const addQuizQuestion = () => {
    const updatedQuestions = [
      ...moduleData.content.quiz.questions,
      {
        question: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }
    ];
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  const addQuizOption = (questionIndex) => {
    const updatedQuestions = [...moduleData.content.quiz.questions];
    updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  const removeQuizQuestion = (questionIndex) => {
    if (moduleData.content.quiz.questions.length <= 1) return;
    
    const updatedQuestions = moduleData.content.quiz.questions.filter((_, index) => index !== questionIndex);
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  const removeQuizOption = (questionIndex, optionIndex) => {
    if (moduleData.content.quiz.questions[questionIndex].options.length <= 2) return;
    
    const updatedQuestions = [...moduleData.content.quiz.questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, index) => index !== optionIndex);
    
    setModuleData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        quiz: {
          ...prev.content.quiz,
          questions: updatedQuestions
        }
      }
    }));
  };
  
  // Save handlers
  const handleSaveSection = async () => {
    try {
      if (!sectionData.title) {
        toast.error('Section title is required');
        return;
      }

      if (isEditingSection) {
        // Update section
        await sectionService.updateSection(editSectionId, sectionData);
        toast.success('Section updated successfully');
      } else {
        // Create section
        await sectionService.createSection(courseId, sectionData);
        toast.success('Section created successfully');
      }
      
      // Refresh course data
      fetchCourseDetails();
      handleCloseSectionDialog();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleSaveModule = async () => {
    try {
      if (!moduleData.title) {
        toast.error('Module title is required');
        return;
      }

      // Check if section ID is available
      if (!currentSectionId) {
        toast.error('Section ID is missing. Please try again.');
        handleCloseModuleDialog();
        return;
      }

      // Validate content based on type
      if (moduleData.contentType === 'video' && !moduleData.content.videoUrl) {
        toast.error('Video URL is required');
        return;
      }

      if (moduleData.contentType === 'text' && !moduleData.content.text) {
        toast.error('Text content is required');
        return;
      }

      // Create a clean module object for the API
      const moduleToSave = {
        title: moduleData.title,
        description: moduleData.description,
        contentType: moduleData.contentType
      };

      // Add the appropriate content field based on type
      if (moduleData.contentType === 'text') {
        moduleToSave.textContent = moduleData.content.text;
      } else if (moduleData.contentType === 'video') {
        moduleToSave.videoContent = {
          videoUrl: moduleData.content.videoUrl
        };
      } else if (moduleData.contentType === 'quiz') {
        moduleToSave.quizContent = {
          questions: moduleData.content.quiz.questions
        };
      }

      console.log('Saving module with data:', moduleToSave);

      if (isEditingModule) {
        // Update module
        await moduleService.updateModule(editModuleId, moduleToSave);
        toast.success('Module updated successfully');
      } else {
        // Create module
        await moduleService.createModule(courseId, currentSectionId, moduleToSave);
        toast.success('Module created successfully');
      }
      
      // Refresh course data
      fetchCourseDetails();
      handleCloseModuleDialog();
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Delete handlers
  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? All modules within this section will also be deleted.')) {
      return;
    }
    
    try {
      // Make sure sectionId is not undefined
      if (!sectionId) {
        toast.error('Invalid section ID');
        return;
      }
      
      console.log('Deleting section:', sectionId);
      await sectionService.deleteSection(sectionId);
      toast.success('Section deleted successfully');
      fetchCourseDetails();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module?')) {
      return;
    }
    
    try {
      // Make sure moduleId is not undefined
      if (!moduleId) {
        toast.error('Invalid module ID');
        return;
      }
      
      console.log('Deleting module:', moduleId);
      await moduleService.deleteModule(moduleId);
      toast.success('Module deleted successfully');
      fetchCourseDetails();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module: ' + (error.response?.data?.message || error.message));
    }
  };
  
  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);
  
  if (loading) {
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
  
  if (!course) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography>Course not found</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" className="course-detail-container">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" className="breadcrumbs">
        <Link component={RouterLink} to="/dashboard/courses" color="inherit">
          My Courses
        </Link>
        <Typography color="textPrimary">{course.title}</Typography>
      </Breadcrumbs>
      
      {/* Course Header */}
      <Box className="course-header">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/manage-courses')}
          className="back-button"
        >
          Back to Courses
        </Button>
        <Box className="course-header-title" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" className="course-title">
            {course.title}
          </Typography>
          <Button
            startIcon={<SettingsIcon />}
            variant="outlined"
            onClick={() => navigate(`/dashboard/courses/edit/${courseId}`)}
          >
            Edit Course
          </Button>
        </Box>
        <Box className="course-info">
          <Chip 
            label={course.category || 'Uncategorized'} 
            className="course-category"
          />
          <Chip 
            label={course.level || 'All Levels'} 
            className="course-level"
          />
          <Typography variant="body1" className="course-students">
            Students: {course.enrolledCount || 0}
          </Typography>
        </Box>
      </Box>
      
      {/* Tabs */}
      <Paper className="course-tabs-container">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          className="course-tabs"
        >
          <Tab label="Content" />
          <Tab label="Students" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>
      
      {/* Tab Panels */}
      <Box className="tab-panel">
        {/* Content Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card className="course-sidebar">
                <CardContent>
                  <Box className="course-image-container">
                    <img 
                      src={course.imageUrl || 'https://via.placeholder.com/300x200?text=Course+Image'} 
                      alt={course.title}
                      className="course-image"
                    />
                  </Box>
                  
                  <Typography variant="h6" className="description-title">About this course</Typography>
                  <Typography variant="body2" className="course-description">
                    {course.description}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    className="preview-button"
                    onClick={() => window.open(`/courses/${courseId}`, '_blank')}
                  >
                    Preview as Student
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper className="course-content-paper">
                <Box className="content-header">
                  <Typography variant="h5" className="content-title">
                    Course Content
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenSectionDialog()}
                  >
                    Add Section
                  </Button>
                </Box>
                
                {course.sections && course.sections.length > 0 ? (
                  course.sections.map((section, index) => (
                    <Accordion key={section._id || section.id || index} className="section-accordion">
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        className="section-header"
                      >
                        <Typography variant="h6">{section.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails className="section-content">
                        <Box className="section-actions">
                          <Button
                            startIcon={<EditIcon />}
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSectionDialog(section._id || section.id);
                            }}
                            className="edit-button"
                          >
                            Edit Section
                          </Button>
                          <Button
                            startIcon={<DeleteIcon />}
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section._id || section.id);
                            }}
                            className="delete-button"
                          >
                            Delete
                          </Button>
                        </Box>
                        
                        <List className="module-list">
                          {section.modules && section.modules.length > 0 ? (
                            section.modules.map((module, moduleIndex) => (
                              <ListItem
                                key={module._id || module.id || moduleIndex}
                                className="module-item"
                              >
                                <ListItemIcon>
                                  <ModuleTypeIcon type={module.contentType || module.type} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={module.title}
                                  secondary={module.description}
                                />
                                <Box className="module-actions">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenModuleDialog(section._id || section.id, module._id || module.id)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteModule(module._id || module.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </ListItem>
                            ))
                          ) : (
                            <Typography variant="body2" className="no-modules">
                              No modules in this section
                            </Typography>
                          )}
                        </List>
                        
                        <Button
                          startIcon={<AddIcon />}
                          variant="outlined"
                          onClick={() => handleOpenModuleDialog(section._id || section.id)}
                          className="add-module-button"
                        >
                          Add Module
                        </Button>
                      </AccordionDetails>
                    </Accordion>
                  ))
                ) : (
                  <Typography variant="body1" className="no-content">
                    No content available for this course yet. Start by adding a section.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Students Tab */}
        {activeTab === 1 && (
          <Paper className="students-container">
            <Typography variant="h6">
              Student Management Coming Soon
            </Typography>
          </Paper>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 2 && (
          <Paper className="analytics-container">
            <Typography variant="h6">
              Course Analytics Coming Soon
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Section Dialog */}
      <Dialog
        open={openSectionDialog}
        onClose={handleCloseSectionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          {isEditingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Section Title"
            type="text"
            fullWidth
            name="title"
            value={sectionData.title}
            onChange={handleSectionChange}
            required
          />
          <TextField
            margin="dense"
            label="Section Description (optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            name="description"
            value={sectionData.description}
            onChange={handleSectionChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSectionDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveSection} color="primary" variant="contained">
            {isEditingSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Module Dialog */}
      <Dialog
        open={openModuleDialog}
        onClose={handleCloseModuleDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          {isEditingModule ? 'Edit Module' : 'Add New Module'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Module Title"
            type="text"
            fullWidth
            name="title"
            value={moduleData.title}
            onChange={handleModuleChange}
            required
          />
          <TextField
            margin="dense"
            label="Module Description (optional)"
            type="text"
            fullWidth
            multiline
            rows={2}
            name="description"
            value={moduleData.description}
            onChange={handleModuleChange}
          />
          
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>Content Type</Typography>
            <TextField
              select
              fullWidth
              value={moduleData.contentType}
              onChange={handleContentTypeChange}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
            </TextField>
          </Box>
          
          {/* Module content based on type */}
          <Box mt={3}>
            {moduleData.contentType === 'text' && (
              <TextField
                label="Text Content"
                multiline
                rows={8}
                fullWidth
                value={moduleData.content.text}
                onChange={handleTextContentChange}
              />
            )}
            
            {moduleData.contentType === 'video' && (
              <TextField
                label="Video URL"
                fullWidth
                value={moduleData.content.videoUrl}
                onChange={handleVideoUrlChange}
                placeholder="https://www.youtube.com/embed/..."
                helperText="Use embed URLs for YouTube, Vimeo, etc."
              />
            )}
            
            {moduleData.contentType === 'quiz' && (
              <Box className="quiz-editor">
                <Typography variant="subtitle1" gutterBottom>
                  Quiz Questions
                </Typography>
                
                {moduleData.content.quiz.questions.map((question, questionIndex) => (
                  <Box key={questionIndex} className="quiz-question-editor" mb={4}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="subtitle2">
                        Question {questionIndex + 1}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => removeQuizQuestion(questionIndex)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <TextField
                      label="Question"
                      fullWidth
                      value={question.question}
                      onChange={(e) => handleQuizQuestionChange(questionIndex, e.target.value)}
                      margin="dense"
                    />
                    
                    <Typography variant="subtitle2" mt={2} mb={1}>
                      Options (select one correct answer)
                    </Typography>
                    
                    {question.options.map((option, optionIndex) => (
                      <Box key={optionIndex} display="flex" alignItems="center" mb={1}>
                        <TextField
                          label={`Option ${optionIndex + 1}`}
                          fullWidth
                          value={option.text}
                          onChange={(e) => handleQuizOptionChange(questionIndex, optionIndex, e.target.value)}
                          margin="dense"
                        />
                        <IconButton
                          color={option.isCorrect ? "success" : "default"}
                          onClick={() => handleQuizOptionCorrectChange(questionIndex, optionIndex)}
                          sx={{ ml: 1 }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                        {question.options.length > 2 && (
                          <IconButton
                            color="error"
                            onClick={() => removeQuizOption(questionIndex, optionIndex)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => addQuizOption(questionIndex)}
                      sx={{ mt: 1 }}
                    >
                      Add Option
                    </Button>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={addQuizQuestion}
                  sx={{ mt: 2 }}
                >
                  Add Question
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModuleDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveModule} color="primary" variant="contained">
            {isEditingModule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseDetail; 