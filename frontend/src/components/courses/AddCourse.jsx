import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import QuizIcon from '@mui/icons-material/Quiz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { courseService, sectionService, moduleService } from '../../services/api';
import { handleError, handleSuccess } from '../../utils';

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

const AddCourse = ({ onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isOptional: true,
    deadline: null,
    courseImage: null
  });
  
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  
  // Section state
  const [sections, setSections] = useState([]);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(null);
  const [sectionData, setSectionData] = useState({
    title: '',
    description: '',
    deadline: null
  });
  const [sectionErrors, setSectionErrors] = useState({});
  
  // Module state
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [moduleData, setModuleData] = useState({
    title: '',
    description: '',
    contentType: 'text', // Default to text
  });
  const [moduleErrors, setModuleErrors] = useState({});
  
  // Content state (for video, text, quiz)
  const [contentData, setContentData] = useState({
    videoUrl: '',
    textContent: '',
    quizQuestions: [{ question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }]
  });
  
  // Progress state
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle course input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle switch changes
  const handleSwitchChange = (e) => {
    setFormData({
      ...formData,
      isOptional: e.target.checked
    });
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      deadline: date
    });
  };
  
  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          courseImage: 'Image size should be less than 5MB'
        });
        return;
      }
      
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setErrors({
          ...errors,
          courseImage: 'Only JPEG, JPG and PNG files are allowed'
        });
        return;
      }
      
      setFormData({
        ...formData,
        courseImage: file
      });
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear validation error
      if (errors.courseImage) {
        setErrors({
          ...errors,
          courseImage: ''
        });
      }
    }
  };
  
  // Validate course form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.courseImage) {
      newErrors.courseImage = 'Course image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle section dialog
  const handleOpenSectionDialog = (sectionIndex = null) => {
    if (sectionIndex !== null) {
      // Edit existing section
      const section = sections[sectionIndex];
      setSectionData({
        title: section.title,
        description: section.description,
        deadline: section.deadline
      });
      setCurrentSectionIndex(sectionIndex);
    } else {
      // Add new section
      setSectionData({
        title: '',
        description: '',
        deadline: null
      });
      setCurrentSectionIndex(null);
    }
    
    setSectionErrors({});
    setOpenSectionDialog(true);
  };
  
  const handleCloseSectionDialog = () => {
    setOpenSectionDialog(false);
    setCurrentSectionIndex(null);
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
  
  const handleAddSection = () => {
    if (!validateSectionForm()) {
      return;
    }
    
    const newSection = {
      title: sectionData.title,
      description: sectionData.description,
      deadline: sectionData.deadline,
      id: `temp_section_${Date.now()}`,
      modules: []
    };
    
    if (currentSectionIndex !== null) {
      // Update existing section
      const updatedSections = [...sections];
      updatedSections[currentSectionIndex] = {
        ...updatedSections[currentSectionIndex],
        ...newSection,
        id: updatedSections[currentSectionIndex].id,
        modules: updatedSections[currentSectionIndex].modules
      };
      setSections(updatedSections);
    } else {
      // Add new section
      setSections([...sections, newSection]);
    }
    
    handleCloseSectionDialog();
  };
  
  const handleDeleteSection = (index) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    setSections(updatedSections);
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
  
  // Handle quiz question changes
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...contentData.quizQuestions];
    updatedQuestions[index][field] = value;
    
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
      let hasErrors = false;
      
      contentData.quizQuestions.forEach((question, index) => {
        const questionErrors = {};
        
        if (!question.question.trim()) {
          questionErrors.question = 'Question text is required';
          hasErrors = true;
        }
        
        let hasCorrectOption = false;
        const optionErrors = [];
        
        question.options.forEach((option, optIndex) => {
          const optionError = {};
          
          if (!option.text.trim()) {
            optionError.text = 'Option text is required';
            hasErrors = true;
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
          hasErrors = true;
        }
        
        if (optionErrors.length > 0) {
          questionErrors.optionErrors = optionErrors;
        }
        
        if (Object.keys(questionErrors).length > 0) {
          quizErrors[index] = questionErrors;
        }
      });
      
      if (hasErrors) {
        errors.quizQuestions = quizErrors;
      }
    }
    
    setModuleErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddModule = () => {
    if (!validateModuleForm()) {
      return;
    }
    
    // Generate a temporary id for this module
    const newModule = {
      id: `temp_module_${Date.now()}`,
      title: moduleData.title,
      description: moduleData.description,
      contentType: moduleData.contentType,
      createdAt: new Date().toISOString()
    };
    
    // Add content based on type
    switch (moduleData.contentType) {
      case 'video':
        newModule.videoContent = { videoUrl: contentData.videoUrl };
        break;
        
      case 'text':
        newModule.textContent = { content: contentData.textContent };
        break;
        
      case 'quizz':
        newModule.quizContent = {
          questions: contentData.quizQuestions,
          passingScore: 70
        };
        break;
        
      default:
        break;
    }
    
    // Add the new module to the appropriate section
    const updatedSections = sections.map(section => {
      if (section.id === currentSectionId) {
        return {
          ...section,
          modules: [...section.modules, newModule]
        };
      }
      return section;
    });
    
    setSections(updatedSections);
    handleCloseModuleDialog();
  };
  
  const handleDeleteModule = (sectionId, moduleIndex) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const updatedModules = [...section.modules];
        updatedModules.splice(moduleIndex, 1);
        return {
          ...section,
          modules: updatedModules
        };
      }
      return section;
    });
    
    setSections(updatedSections);
  };
  
  // Render content form based on selected type
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
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Content"
              name="textContent"
              value={contentData.textContent}
              onChange={handleContentChange}
              error={!!moduleErrors.textContent}
              helperText={moduleErrors.textContent}
              placeholder="Enter your content here..."
            />
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
                
                <TextField
                  fullWidth
                  label="Question"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                  error={!!moduleErrors.quizQuestions?.[qIndex]?.question}
                  helperText={moduleErrors.quizQuestions?.[qIndex]?.question}
                  sx={{ mb: 2 }}
                />
                
                {moduleErrors.quizQuestions?.[qIndex]?.options && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {moduleErrors.quizQuestions[qIndex].options}
                  </Alert>
                )}
                
                {question.options.map((option, oIndex) => (
                  <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${oIndex + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                      error={!!moduleErrors.quizQuestions?.[qIndex]?.optionErrors?.[oIndex]?.text}
                      helperText={moduleErrors.quizQuestions?.[qIndex]?.optionErrors?.[oIndex]?.text}
                      sx={{ mr: 2 }}
                    />
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      // First create the course
      const response = await courseService.createCourse({
        title: formData.title,
        description: formData.description,
        isOptional: formData.isOptional,
        deadline: formData.deadline ? formData.deadline.toISOString() : null,
        courseImage: formData.courseImage
      });
      
      if (response.success) {
        const courseId = response.data._id;
        
        // Now create each section and its modules
        for (const section of sections) {
          try {
            // Create section
            const sectionResponse = await sectionService.createSection(courseId, {
              title: section.title,
              description: section.description,
              deadline: section.deadline
            });
            
            if (sectionResponse.success && section.modules && section.modules.length > 0) {
              const sectionId = sectionResponse.data._id;
              
              // Create modules for this section
              for (const module of section.modules) {
                try {
                  // Prepare module data based on content type
                  const moduleData = {
                    title: module.title,
                    description: module.description,
                    contentType: module.contentType
                  };
                  
                  // Add specific content based on type
                  if (module.contentType === 'video' && module.videoContent) {
                    moduleData.videoUrl = module.videoContent.videoUrl;
                  } else if (module.contentType === 'text' && module.textContent) {
                    moduleData.textContent = module.textContent.content;
                  } else if (module.contentType === 'quizz' && module.quizContent) {
                    moduleData.quizQuestions = module.quizContent.questions;
                    moduleData.passingScore = module.quizContent.passingScore || 70;
                  }
                  
                  await moduleService.createModule(courseId, sectionId, moduleData);
                } catch (moduleError) {
                  console.error('Error creating module:', moduleError);
                  // Continue with other modules
                }
              }
            }
          } catch (sectionError) {
            console.error('Error creating section:', sectionError);
            // Continue with other sections
          }
        }
        
        handleSuccess('Course created successfully with all sections and modules!');
        setSuccess(true);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          isOptional: true,
          deadline: null,
          courseImage: null
        });
        setPreview('');
        setSections([]);
        
        // Close the dialog if provided
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          // Navigate to courses page after short delay if not in dialog
          setTimeout(() => {
            navigate('/courses');
          }, 2000);
        }
      } else {
        handleError(response.message || 'Error creating course. Please try again.');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      handleError(err.response?.data?.message || 'Error creating course. Please try again.');
      setError(err.response?.data?.message || 'Error creating course. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };
  
  // Navigation between steps
  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) {
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          backgroundColor: '#FAF9F6', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={onClose ? onClose : () => navigate('/courses')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              fontFamily: 'Nortica-SemiBold, sans-serif',
              color: '#2c3e50'
            }}
          >
            Create New Course
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              '& .MuiAlert-icon': { 
                color: '#4CAF50' 
              }
            }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            Course created successfully! Redirecting to courses page...
          </Alert>
        )}
        
        <Box sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            {['Course Details', 'Add Sections', 'Add Modules & Content'].map((label, index) => (
              <Box 
                key={label} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  width: '30%' 
                }}
              >
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    backgroundColor: activeStep >= index ? '#FDC886' : '#e0e0e0',
                    color: activeStep >= index ? '#37474F' : '#9e9e9e',
                    mb: 1,
                    fontWeight: 600
                  }}
                >
                  {index + 1}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: activeStep >= index ? '#37474F' : '#9e9e9e',
                    textAlign: 'center'
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ position: 'relative', mb: 3, mt: 1 }}>
            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', zIndex: 0 }}>
              <Box sx={{ height: 4, backgroundColor: '#e0e0e0', width: '100%' }} />
            </Box>
            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', zIndex: 1 }}>
              <Box 
                sx={{ 
                  height: 4, 
                  backgroundColor: '#FDC886', 
                  width: `${Math.min(100, (activeStep / 2) * 100)}%`,
                  transition: 'width 0.3s ease-in-out'
                }} 
              />
            </Box>
          </Box>
        </Box>
        
        <form onSubmit={handleSubmit}>
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ 
                    fontFamily: 'Nortica-SemiBold, sans-serif',
                    color: '#2c3e50'
                  }}
                >
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography 
                  sx={{ 
                    mb: 1,
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Course Title
                </Typography>
                <TextField
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography 
                  sx={{ 
                    mb: 1,
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Description
                </Typography>
                <TextField
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors.description}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isOptional}
                      onChange={handleSwitchChange}
                      name="isOptional"
                    />
                  }
                  label="Optional Course"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Deadline (optional)"
                    value={formData.deadline}
                    onChange={handleDateChange}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                          }
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Typography 
                  sx={{ 
                    mb: 1,
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Course Image
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px dashed #ccc', 
                    borderRadius: '8px', 
                    p: 2, 
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f8f8f8'
                    }
                  }}
                  onClick={() => document.getElementById('courseImage').click()}
                >
                  {preview ? (
                    <img 
                      src={preview} 
                      alt="Course Preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} 
                    />
                  ) : (
                    <Box sx={{ color: 'text.secondary' }}>
                      <AddPhotoAlternateIcon sx={{ fontSize: 40 }} />
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Click to upload course image
                      </Typography>
                      <Typography variant="caption">
                        JPG, JPEG or PNG (max 5MB)
                      </Typography>
                    </Box>
                  )}
                  <input
                    type="file"
                    id="courseImage"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </Box>
                {errors.courseImage && (
                  <FormHelperText error>{errors.courseImage}</FormHelperText>
                )}
              </Grid>
            </Grid>
          )}
          
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography 
                    variant="h5"
                    sx={{ 
                      fontFamily: 'Nortica-SemiBold, sans-serif',
                      color: '#2c3e50'
                    }}
                  >
                    Course Sections
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleOpenSectionDialog()}
                    sx={{
                      backgroundColor: '#FDC886',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      textTransform: 'none',
                      fontSize: '16px',
                      boxShadow: 'none',
                      color: '#37474F',
                      '&:hover': {
                        backgroundColor: '#efb56c',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Add Section
                  </Button>
                </Box>
                
                {sections.length === 0 ? (
                  <Alert severity="info" sx={{ my: 2 }}>
                    No sections added yet. Add sections to organize your course content.
                  </Alert>
                ) : (
                  sections.map((section, index) => (
                    <Accordion 
                      key={section.id} 
                      defaultExpanded={index === 0}
                      sx={{
                        mb: 2,
                        borderRadius: '8px',
                        '&:before': {
                          display: 'none',
                        },
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px 8px 0 0',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <Typography 
                            variant="h6"
                            sx={{ fontFamily: 'Nortica-Medium, sans-serif' }}
                          >
                            Section {index + 1}: {section.title}
                          </Typography>
                          <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex' }}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSectionDialog(index);
                              }}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(index);
                              }}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {section.description}
                        </Typography>
                        
                        {section.deadline && (
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Section Deadline: {new Date(section.deadline).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Grid>
            </Grid>
          )}
          
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ 
                    fontFamily: 'Nortica-SemiBold, sans-serif',
                    color: '#2c3e50'
                  }}
                >
                  Modules & Content
                </Typography>
                
                {sections.length === 0 ? (
                  <Alert severity="warning" sx={{ my: 2 }}>
                    Please add sections first before adding modules.
                  </Alert>
                ) : (
                  sections.map((section, index) => (
                    <Accordion 
                      key={section.id} 
                      defaultExpanded={index === 0}
                      sx={{
                        mb: 2,
                        borderRadius: '8px',
                        '&:before': {
                          display: 'none',
                        },
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px 8px 0 0',
                        }}
                      >
                        <Typography 
                          variant="h6"
                          sx={{ fontFamily: 'Nortica-Medium, sans-serif' }}
                        >
                          Section {index + 1}: {section.title}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                          Modules
                        </Typography>
                        
                        {(!section.modules || section.modules.length === 0) ? (
                          <Alert severity="info" sx={{ my: 2 }}>
                            No modules found in this section. Add modules to provide content.
                          </Alert>
                        ) : (
                          <List>
                            {section.modules.map((module, mIndex) => (
                              <ListItem 
                                key={module.id} 
                                sx={{ 
                                  bgcolor: '#f5f5f5', 
                                  mb: 1, 
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}
                                secondaryAction={
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete" 
                                    onClick={() => handleDeleteModule(section.id, mIndex)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                }
                              >
                                <ListItemIcon>
                                  <ModuleTypeIcon type={module.contentType} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={`${mIndex + 1}. ${module.title}`} 
                                  secondary={module.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                        
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenModuleDialog(section.id)}
                          sx={{ 
                            mt: 2,
                            borderColor: '#FDC886',
                            color: '#37474F',
                            '&:hover': {
                              borderColor: '#efb56c',
                              backgroundColor: 'rgba(253, 200, 134, 0.1)'
                            }
                          }}
                        >
                          Add Module
                        </Button>
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Grid>
            </Grid>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ 
                textTransform: 'none',
                fontFamily: 'Nortica-Medium, sans-serif',
                color: '#37474F'
              }}
            >
              Back
            </Button>
            <Box>
              {activeStep === 2 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || isSubmitting}
                  sx={{
                    backgroundColor: '#FDC886',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    textTransform: 'none',
                    fontSize: '16px',
                    boxShadow: 'none',
                    color: '#37474F',
                    fontFamily: 'Nortica-Medium, sans-serif',
                    '&:hover': {
                      backgroundColor: '#efb56c',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Course'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  sx={{
                    backgroundColor: '#FDC886',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    textTransform: 'none',
                    fontSize: '16px',
                    boxShadow: 'none',
                    color: '#37474F',
                    fontFamily: 'Nortica-Medium, sans-serif',
                    '&:hover': {
                      backgroundColor: '#efb56c',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Continue
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
      
      {/* Section Dialog */}
      <Dialog 
        open={openSectionDialog} 
        onClose={handleCloseSectionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentSectionIndex !== null ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
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
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={sectionData.description}
            onChange={handleSectionChange}
            fullWidth
            multiline
            rows={4}
            error={!!sectionErrors.description}
            helperText={sectionErrors.description}
            sx={{ mb: 2 }}
          />
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
          >
            {currentSectionIndex !== null ? 'Update Section' : 'Add Section'}
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
          <TextField
            margin="dense"
            label="Description"
            name="description"
            value={moduleData.description}
            onChange={handleModuleChange}
            fullWidth
            multiline
            rows={2}
            error={!!moduleErrors.description}
            helperText={moduleErrors.description}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
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
          
          {renderContentForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModuleDialog}>Cancel</Button>
          <Button 
            onClick={handleAddModule} 
            variant="contained" 
            color="primary"
          >
            Add Module
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddCourse; 