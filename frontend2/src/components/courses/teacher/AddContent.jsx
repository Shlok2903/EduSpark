import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import { Add, Delete, Edit, ArrowBack, VideoLibrary, TextFields, Quiz as QuizIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService, sectionService, moduleService } from '../../../services/api';
import './AddContent.css';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Content types matching backend enum
const CONTENT_TYPES = {
  VIDEO: 'video',
  TEXT: 'text',
  QUIZ: 'quiz'  // We'll keep this as 'quiz' in the UI but transform to 'quizz' in the service
};

function AddContent() {
  const { courseId, sectionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [contentType, setContentType] = useState(CONTENT_TYPES.VIDEO);
  const [modules, setModules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [course, setCourse] = useState(null);
  const [section, setSection] = useState(null);
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    url: '',
    content: '',
    questions: []
  });
  const [quizQuestions, setQuizQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctOption: 0 }
  ]);
  const [quizSettings, setQuizSettings] = useState({
    timer: 0,
    passingScore: 70,
    maxAttempts: 0,
    deadline: null
  });

  // Fetch course and section data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get course data
        const courseResponse = await courseService.getCourseById(courseId);
        if (courseResponse.success) {
          setCourse(courseResponse.data);
        } else {
          toast.error('Failed to load course data');
        }
        
        // Get section data with its modules
        const sectionResponse = await sectionService.getSectionById(sectionId);
        if (sectionResponse.success) {
          setSection(sectionResponse.data);
          
          // Get modules for this section if any
          if (sectionResponse.data.modules) {
            setModules(sectionResponse.data.modules);
          }
        } else {
          toast.error('Failed to load section data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.formattedMessage || 'Failed to load course and section data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, sectionId]);

  const handleAddDialog = () => {
    setContentData({
      title: '',
      description: '',
      url: '',
      content: '',
      questions: []
    });
    setQuizQuestions([
      { question: '', options: ['', '', '', ''], correctOption: 0 }
    ]);
    setEditIndex(-1);
    setOpenDialog(true);
  };

  const handleEditDialog = (index) => {
    const module = modules[index];
    setContentData({
      title: module.title,
      description: module.description || '',
      url: module.content?.url || module.videoUrl || '',
      content: module.content?.text || module.textContent || '',
      questions: module.content?.questions || module.quizQuestions || []
    });
    
    if (module.type === CONTENT_TYPES.QUIZ) {
      setContentType(CONTENT_TYPES.QUIZ);
      setQuizQuestions(module.content?.questions || module.quizQuestions || [
        { question: '', options: ['', '', '', ''], correctOption: 0 }
      ]);
    } else if (module.type === CONTENT_TYPES.TEXT) {
      setContentType(CONTENT_TYPES.TEXT);
    } else {
      setContentType(CONTENT_TYPES.VIDEO);
    }
    
    setEditIndex(index);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleContentTypeChange = (event) => {
    setContentType(event.target.value);
  };

  const handleChange = (e) => {
    setContentData({
      ...contentData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quizQuestions];
    
    if (field === 'question') {
      newQuestions[index].question = value;
    } else if (field === 'correctOption') {
      newQuestions[index].correctOption = parseInt(value);
    } else if (field.startsWith('option-')) {
      const optionIndex = parseInt(field.split('-')[1]);
      newQuestions[index].options[optionIndex] = value;
    } else if (field === 'marks') {
      // Ensure marks is a positive number
      const numValue = parseInt(value) || 1;
      newQuestions[index][field] = Math.max(1, numValue);
    }
    
    setQuizQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      { question: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }
    ]);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...quizQuestions];
    newQuestions.splice(index, 1);
    setQuizQuestions(newQuestions);
  };

  const handleQuizOptionChange = (index, optionIndex, value) => {
    const newQuestions = [...quizQuestions];
    newQuestions[index].options[optionIndex] = value;
    setQuizQuestions(newQuestions);
  };

  const handleQuizSettingChange = (setting, value) => {
    setQuizSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveModule = () => {
    // Validate module data
    if (!contentData.title) {
      toast.error('Module title is required');
      return;
    }

    if (!contentData.description) {
      toast.error('Module description is required');
      return;
    }

    // Validate content based on type
    if (contentType === CONTENT_TYPES.VIDEO && !contentData.url) {
      toast.error('Video URL is required');
      return;
    }

    if (contentType === CONTENT_TYPES.TEXT && !contentData.content) {
      toast.error('Text content is required');
      return;
    }

    if (contentType === CONTENT_TYPES.QUIZ) {
      // Check if all questions are filled
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        if (!q.question) {
          toast.error(`Question ${i+1} text is required`);
          return;
        }

        // Check if options are filled
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j]) {
            toast.error(`Option ${j+1} for Question ${i+1} is required`);
            return;
          }
        }
      }
    }

    // Create a new module object
    const newModule = {
      title: contentData.title,
      description: contentData.description,
      type: contentType
    };

    // Add content based on type
    if (contentType === CONTENT_TYPES.VIDEO) {
      newModule.content = { url: contentData.url };
    } else if (contentType === CONTENT_TYPES.TEXT) {
      newModule.content = { text: contentData.content };
    } else if (contentType === CONTENT_TYPES.QUIZ) {
      newModule.content = { questions: quizQuestions };
    }

    // Update module list
    if (editIndex >= 0) {
      const updatedModules = [...modules];
      updatedModules[editIndex] = newModule;
      setModules(updatedModules);
    } else {
      setModules([...modules, newModule]);
    }

    handleCloseDialog();
  };

  const handleDeleteModule = (index) => {
    const updatedModules = [...modules];
    updatedModules.splice(index, 1);
    setModules(updatedModules);
  };

  const handleSubmit = async () => {
    if (modules.length === 0) {
      toast.error('Please add at least one module');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare modules data
      const modulesToCreate = modules.map(module => {
        const baseModule = {
        title: module.title,
          description: module.description || '',
          type: module.type
        };
        
        // Add type-specific content fields
        if (module.type === CONTENT_TYPES.VIDEO) {
          return {
            ...baseModule,
            videoUrl: module.content?.url || module.videoUrl || ''
          };
        } else if (module.type === CONTENT_TYPES.TEXT) {
          return {
            ...baseModule,
            textContent: module.content?.text || module.textContent || ''
          };
        } else if (module.type === CONTENT_TYPES.QUIZ) {
          return {
            ...baseModule,
            quizQuestions: module.content?.questions || module.quizQuestions || []
          };
        }
        
        return baseModule;
      });

      // Log the data being sent to help with debugging
      console.log('Submitting modules:', modulesToCreate);

      // Use the moduleService for batch creation
      const response = await moduleService.createModulesBatch(courseId, sectionId, modulesToCreate);
      
      if (response && (response.success || response.status === 200 || response.status === 201)) {
        toast.success('Content added successfully');
        navigate(`/dashboard/courses/${courseId}`);
      } else {
        console.error('Failed response:', response);
        toast.error(response?.message || 'Failed to create content');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      
      // Provide more specific error messages based on the error
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message || 'Unknown error';
        toast.error(`Error: ${errorMessage}`);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred creating content');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/add-course/sections/${courseId}`);
  };

  const getModuleTypeIcon = (type) => {
    switch (type) {
      case CONTENT_TYPES.VIDEO:
        return <VideoLibrary fontSize="small" />;
      case CONTENT_TYPES.TEXT:
        return <TextFields fontSize="small" />;
      case CONTENT_TYPES.QUIZ:
        return <QuizIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getModuleTypeLabel = (type) => {
    switch (type) {
      case CONTENT_TYPES.VIDEO:
        return 'Video';
      case CONTENT_TYPES.TEXT:
        return 'Text';
      case CONTENT_TYPES.QUIZ:
        return 'Quiz';
      default:
        return 'Module';
    }
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="add-content-container">
      <Box className="header-actions">
        <Button 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          className="back-button"
        >
          Back to Sections
        </Button>
      </Box>
      
      <Typography variant="h4" className="page-title">
        Add Content to Section
      </Typography>

      <Stepper activeStep={2} className="course-creation-stepper">
        <Step>
          <StepLabel>Basic Information</StepLabel>
        </Step>
        <Step>
          <StepLabel>Add Sections</StepLabel>
        </Step>
        <Step>
          <StepLabel>Add Content</StepLabel>
        </Step>
      </Stepper>

      <Card className="section-info-card">
        <CardContent>
          <Typography variant="h5" className="course-title">
            {course ? course.title : 'Course'}
          </Typography>
          <Typography variant="h6" className="section-title">
            Section: {section ? section.title : ''}
          </Typography>
          {section && section.description && (
            <Typography variant="body2" className="section-description">
              {section.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card className="add-content-card">
        <CardContent>
          <Box className="header-container">
            <Typography variant="h6" className="content-title">
              Section Content
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddDialog}
              className="add-button"
            >
              Add Content
            </Button>
          </Box>

          {modules.length === 0 ? (
            <Box className="empty-state">
              <Typography variant="body1" align="center">
                This section doesn't have any content yet. Add videos, text, or quizzes to your section.
              </Typography>
            </Box>
          ) : (
            <List className="modules-list">
              {modules.map((module, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem className="module-item">
                    <Box className="module-type-icon">
                      {getModuleTypeIcon(module.type)}
                    </Box>
                    <ListItemText
                      primary={module.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textSecondary">
                            {getModuleTypeLabel(module.type)}
                          </Typography>
                          {module.description && (
                            <>
                              {' - '}
                              {module.description}
                            </>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditDialog(index)}
                        aria-label="edit"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteModule(index)}
                        aria-label="delete"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}

          <Box className="actions-container">
            <Button
              variant="contained"
              color="primary"
              disabled={submitting || modules.length === 0}
              onClick={handleSubmit}
              fullWidth
            >
              {submitting ? 'Saving Content...' : 'Save Content & Finish'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Content Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editIndex >= 0 ? 'Edit Content' : 'Add New Content'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Content Title"
              fullWidth
              value={contentData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Introduction to React, Quiz on JavaScript Basics"
            />
            <TextField
              margin="dense"
              name="description"
              label="Content Description"
              fullWidth
              multiline
              rows={3}
              value={contentData.description}
              onChange={handleChange}
              required
              placeholder="Describe what this module covers"
              helperText="A detailed description helps students understand this content's purpose"
            />
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>Content Type</InputLabel>
            <Select
              value={contentType}
              onChange={handleContentTypeChange}
              label="Content Type"
            >
              <MenuItem value={CONTENT_TYPES.VIDEO}>Video</MenuItem>
              <MenuItem value={CONTENT_TYPES.TEXT}>Text</MenuItem>
              <MenuItem value={CONTENT_TYPES.QUIZ}>Quiz</MenuItem>
            </Select>
          </FormControl>

          {contentType === CONTENT_TYPES.VIDEO && (
            <TextField
              margin="normal"
              name="url"
              label="Video URL"
              fullWidth
              value={contentData.url}
              onChange={handleChange}
              required
              placeholder="https://www.youtube.com/watch?v=..."
              helperText="Enter YouTube, Vimeo, or other video platform URL"
            />
          )}

          {contentType === CONTENT_TYPES.TEXT && (
            <TextField
              margin="normal"
              name="content"
              label="Text Content"
              fullWidth
              multiline
              rows={8}
              value={contentData.content}
              onChange={handleChange}
              required
              placeholder="Enter your content here..."
            />
          )}

          {contentType === CONTENT_TYPES.QUIZ && (
            <Box className="quiz-builder">
              <Typography variant="subtitle1" gutterBottom>
                Quiz Settings
              </Typography>
              
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Time Limit (minutes)"
                    type="number"
                    value={quizSettings.timer}
                    onChange={(e) => handleQuizSettingChange('timer', parseInt(e.target.value) || 0)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText="0 means no time limit"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Passing Score (%)"
                    type="number"
                    value={quizSettings.passingScore}
                    onChange={(e) => handleQuizSettingChange('passingScore', parseInt(e.target.value) || 0)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Max Attempts"
                    type="number"
                    value={quizSettings.maxAttempts}
                    onChange={(e) => handleQuizSettingChange('maxAttempts', parseInt(e.target.value) || 0)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText="0 means unlimited attempts"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Deadline"
                    type="datetime-local"
                    value={quizSettings.deadline || ''}
                    onChange={(e) => handleQuizSettingChange('deadline', e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom>
                Quiz Questions
              </Typography>
              
              {quizQuestions.map((question, qIndex) => (
                <Card key={qIndex} className="question-card">
                  <CardContent>
                    <Box className="question-header">
                      <Typography variant="subtitle2">
                        Question {qIndex + 1}
                      </Typography>
                      {qIndex > 0 && (
                        <IconButton
                          size="small"
                          onClick={() => removeQuestion(qIndex)}
                          aria-label="delete question"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={9}>
                        <TextField
                          margin="dense"
                          label="Question"
                          fullWidth
                          value={question.question}
                          onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                          required
                          placeholder="Enter your question"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          margin="dense"
                          label="Marks"
                          type="number"
                          fullWidth
                          value={question.marks || 1}
                          onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)}
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                      </Grid>
                    </Grid>
                    
                    {question.options.map((option, oIndex) => (
                      <Box key={oIndex} className="option-row">
                        <TextField
                          margin="dense"
                          label={`Option ${oIndex + 1}`}
                          fullWidth
                          value={option}
                          onChange={(e) => handleQuestionChange(qIndex, `option-${oIndex}`, e.target.value)}
                          required
                          placeholder={`Enter option ${oIndex + 1}`}
                        />
                      </Box>
                    ))}
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Correct Answer</InputLabel>
                      <Select
                        value={question.correctOption}
                        onChange={(e) => handleQuestionChange(qIndex, 'correctOption', e.target.value)}
                        label="Correct Answer"
                      >
                        {question.options.map((_, oIndex) => (
                          <MenuItem key={oIndex} value={oIndex}>
                            Option {oIndex + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                startIcon={<Add />}
                onClick={addQuestion}
                className="add-question-button"
              >
                Add Question
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveModule} color="primary" variant="contained">
            {editIndex >= 0 ? 'Update' : 'Add'} Content
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AddContent; 