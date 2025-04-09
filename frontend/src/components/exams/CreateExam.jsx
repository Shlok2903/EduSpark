import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  IconButton, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { examService, courseService } from '../../services/api';
import Sidebar from '../common/sidebar/Sidebar';
import { handleError, handleSuccess } from '../../utils';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function CreateExam() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Exam state
  const [exam, setExam] = useState({
    title: '',
    description: '',
    instructions: '',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),   // Default to day after tomorrow
    duration: 60, // minutes
    passingPercentage: 60,
    totalMarks: 0,
    sections: [{
      title: 'Section 1',
      description: '',
      questions: []
    }]
  });

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      try {
        const data = await courseService.getCourseById(courseId);
        if (data) {
          setCourse(data);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        handleError('Failed to load course details');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
  }, [courseId, navigate]);

  // Calculate total marks whenever sections/questions change
  useEffect(() => {
    const calculateTotalMarks = () => {
      let total = 0;
      exam.sections.forEach(section => {
        section.questions.forEach(question => {
          total += Number(question.marks || 0);
        });
      });
      
      setExam(prev => ({
        ...prev,
        totalMarks: total
      }));
    };
    
    calculateTotalMarks();
  }, [exam.sections]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExam(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (name, value) => {
    setExam(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...exam.sections];
    updatedSections[index][field] = value;
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const addSection = () => {
    setExam(prev => ({
      ...prev,
      sections: [
        ...prev.sections, 
        {
          title: `Section ${prev.sections.length + 1}`,
          description: '',
          questions: []
        }
      ]
    }));
  };

  const removeSection = (index) => {
    if (exam.sections.length === 1) {
      handleError('Exam must have at least one section');
      return;
    }
    
    const updatedSections = [...exam.sections];
    updatedSections.splice(index, 1);
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const handleQuestionChange = (sectionIndex, questionIndex, field, value) => {
    const updatedSections = [...exam.sections];
    updatedSections[sectionIndex].questions[questionIndex][field] = value;
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const addQuestion = (sectionIndex, type = 'mcq') => {
    const newQuestion = {
      questionText: '',
      type: type,
      marks: 1,
      options: type === 'mcq' ? [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ] : [],
      answer: type === 'subjective' ? '' : null,
      fileType: type === 'file-upload' ? 'any' : null
    };
    
    const updatedSections = [...exam.sections];
    updatedSections[sectionIndex].questions.push(newQuestion);
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...exam.sections];
    updatedSections[sectionIndex].questions.splice(questionIndex, 1);
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const handleOptionChange = (sectionIndex, questionIndex, optionIndex, field, value) => {
    const updatedSections = [...exam.sections];
    updatedSections[sectionIndex].questions[questionIndex].options[optionIndex][field] = value;
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const addOption = (sectionIndex, questionIndex) => {
    const updatedSections = [...exam.sections];
    updatedSections[sectionIndex].questions[questionIndex].options.push({
      text: '',
      isCorrect: false
    });
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const removeOption = (sectionIndex, questionIndex, optionIndex) => {
    const updatedSections = [...exam.sections];
    const options = updatedSections[sectionIndex].questions[questionIndex].options;
    
    if (options.length <= 2) {
      handleError('A multiple choice question must have at least 2 options');
      return;
    }
    
    options.splice(optionIndex, 1);
    
    // Make sure at least one option is correct
    if (!options.some(o => o.isCorrect)) {
      options[0].isCorrect = true;
    }
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const setCorrectOption = (sectionIndex, questionIndex, optionIndex) => {
    const updatedSections = [...exam.sections];
    const options = updatedSections[sectionIndex].questions[questionIndex].options;
    
    // Reset all options to false
    options.forEach((opt, idx) => {
      opt.isCorrect = idx === optionIndex;
    });
    
    setExam(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const onDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.type === 'sections') {
      const updatedSections = [...exam.sections];
      const [movedSection] = updatedSections.splice(result.source.index, 1);
      updatedSections.splice(result.destination.index, 0, movedSection);
      
      setExam(prev => ({
        ...prev,
        sections: updatedSections
      }));
    } else if (result.type.startsWith('questions-')) {
      const sectionIndex = parseInt(result.type.split('-')[1]);
      const questions = [...exam.sections[sectionIndex].questions];
      const [movedQuestion] = questions.splice(result.source.index, 1);
      questions.splice(result.destination.index, 0, movedQuestion);
      
      const updatedSections = [...exam.sections];
      updatedSections[sectionIndex].questions = questions;
      
      setExam(prev => ({
        ...prev,
        sections: updatedSections
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!exam.title.trim()) errors.title = 'Title is required';
    if (!exam.description.trim()) errors.description = 'Description is required';
    if (!exam.instructions.trim()) errors.instructions = 'Instructions are required';
    if (!exam.startTime) errors.startTime = 'Start time is required';
    if (!exam.endTime) errors.endTime = 'End time is required';
    if (exam.duration <= 0) errors.duration = 'Duration must be greater than 0';
    if (exam.passingPercentage < 0 || exam.passingPercentage > 100) {
      errors.passingPercentage = 'Passing percentage must be between 0 and 100';
    }
    
    // Validate start and end times
    if (exam.startTime && exam.endTime && exam.startTime >= exam.endTime) {
      errors.endTime = 'End time must be after start time';
    }
    
    // Validate all sections have at least one question
    let questionErrors = false;
    exam.sections.forEach((section, sIndex) => {
      if (!section.title.trim()) {
        errors[`section_${sIndex}_title`] = 'Section title is required';
      }
      
      if (section.questions.length === 0) {
        errors[`section_${sIndex}_questions`] = 'Section must have at least one question';
        questionErrors = true;
      }
      
      // Validate all questions
      section.questions.forEach((question, qIndex) => {
        if (!question.questionText.trim()) {
          errors[`question_${sIndex}_${qIndex}_text`] = 'Question text is required';
          questionErrors = true;
        }
        
        if (question.marks <= 0) {
          errors[`question_${sIndex}_${qIndex}_marks`] = 'Marks must be greater than 0';
          questionErrors = true;
        }
        
        if (question.type === 'mcq') {
          // Check if at least one option is selected as correct
          if (!question.options.some(opt => opt.isCorrect)) {
            errors[`question_${sIndex}_${qIndex}_options`] = 'At least one option must be correct';
            questionErrors = true;
          }
          
          // Check if all options have text
          question.options.forEach((opt, oIndex) => {
            if (!opt.text.trim()) {
              errors[`option_${sIndex}_${qIndex}_${oIndex}`] = 'Option text is required';
              questionErrors = true;
            }
          });
        }
      });
    });
    
    setFormErrors(errors);
    
    if (questionErrors) {
      handleError('Please fix all question errors before submitting');
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const examData = {
        ...exam,
        courseId: courseId
      };
      
      const response = await examService.createExam(examData);
      if (response && response._id) {
        handleSuccess('Exam created successfully');
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      handleError('Failed to create exam. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h5">Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
      <Sidebar />
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(`/courses/${courseId}`)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">Create New Exam</Typography>
          </Box>
          
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Create Exam'}
          </Button>
        </Box>
        
        {course && (
          <Typography variant="h6" color="primary" mb={3}>
            Course: {course.title}
          </Typography>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Exam Title"
              name="title"
              value={exam.title}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!formErrors.title}
              helperText={formErrors.title}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={exam.duration}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!formErrors.duration}
              helperText={formErrors.duration}
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={exam.startTime}
                onChange={(newValue) => handleDateChange('startTime', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    required
                    margin="normal"
                    error={!!formErrors.startTime}
                    helperText={formErrors.startTime}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="End Time"
                value={exam.endTime}
                onChange={(newValue) => handleDateChange('endTime', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    required
                    margin="normal"
                    error={!!formErrors.endTime}
                    helperText={formErrors.endTime}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              label="Passing Percentage"
              name="passingPercentage"
              type="number"
              value={exam.passingPercentage}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!formErrors.passingPercentage}
              helperText={formErrors.passingPercentage}
              margin="normal"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={exam.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              required
              error={!!formErrors.description}
              helperText={formErrors.description}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Instructions"
              name="instructions"
              value={exam.instructions}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              required
              error={!!formErrors.instructions}
              helperText={formErrors.instructions}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
              <Typography variant="h5">Sections</Typography>
              <Typography variant="subtitle1">
                Total Marks: {exam.totalMarks}
              </Typography>
            </Box>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="sections">
                {(provided) => (
                  <Box
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {exam.sections.map((section, sectionIndex) => (
                      <Draggable 
                        key={`section-${sectionIndex}`} 
                        draggableId={`section-${sectionIndex}`} 
                        index={sectionIndex}
                      >
                        {(provided) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{ mb: 3, p: 2 }}
                          >
                            <CardContent>
                              <Box display="flex" alignItems="center" mb={2}>
                                <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                                  <DragIndicatorIcon />
                                </Box>
                                <TextField
                                  label="Section Title"
                                  value={section.title}
                                  onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                                  fullWidth
                                  required
                                  error={!!formErrors[`section_${sectionIndex}_title`]}
                                  helperText={formErrors[`section_${sectionIndex}_title`]}
                                  margin="normal"
                                />
                                <IconButton 
                                  color="error" 
                                  onClick={() => removeSection(sectionIndex)}
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                              
                              <TextField
                                label="Section Description"
                                value={section.description}
                                onChange={(e) => handleSectionChange(sectionIndex, 'description', e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                              />
                              
                              <Box sx={{ mt: 3, mb: 2 }}>
                                <Typography variant="h6">Questions</Typography>
                                {formErrors[`section_${sectionIndex}_questions`] && (
                                  <FormHelperText error>
                                    {formErrors[`section_${sectionIndex}_questions`]}
                                  </FormHelperText>
                                )}
                              </Box>
                              
                              <Droppable 
                                droppableId={`questions-${sectionIndex}`} 
                                type={`questions-${sectionIndex}`}
                              >
                                {(provided) => (
                                  <Box
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    sx={{ pl: 2 }}
                                  >
                                    {section.questions.map((question, questionIndex) => (
                                      <Draggable
                                        key={`question-${sectionIndex}-${questionIndex}`}
                                        draggableId={`question-${sectionIndex}-${questionIndex}`}
                                        index={questionIndex}
                                      >
                                        {(provided) => (
                                          <Card 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            variant="outlined" 
                                            sx={{ mb: 2, p: 2 }}
                                          >
                                            <CardContent>
                                              <Box display="flex" alignItems="center" mb={1}>
                                                <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                                                  <DragIndicatorIcon />
                                                </Box>
                                                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                                  Question {questionIndex + 1}
                                                </Typography>
                                                <FormControl sx={{ minWidth: 150, mr: 2 }}>
                                                  <InputLabel>Type</InputLabel>
                                                  <Select
                                                    value={question.type}
                                                    label="Type"
                                                    onChange={(e) => handleQuestionChange(
                                                      sectionIndex, 
                                                      questionIndex, 
                                                      'type', 
                                                      e.target.value
                                                    )}
                                                  >
                                                    <MenuItem value="mcq">Multiple Choice</MenuItem>
                                                    <MenuItem value="subjective">Subjective</MenuItem>
                                                    <MenuItem value="file-upload">File Upload</MenuItem>
                                                  </Select>
                                                </FormControl>
                                                <TextField
                                                  label="Marks"
                                                  type="number"
                                                  value={question.marks}
                                                  onChange={(e) => handleQuestionChange(
                                                    sectionIndex, 
                                                    questionIndex, 
                                                    'marks', 
                                                    e.target.value
                                                  )}
                                                  error={!!formErrors[`question_${sectionIndex}_${questionIndex}_marks`]}
                                                  helperText={formErrors[`question_${sectionIndex}_${questionIndex}_marks`]}
                                                  sx={{ width: 80, mr: 1 }}
                                                  InputProps={{ inputProps: { min: 1 } }}
                                                />
                                                <IconButton 
                                                  color="error" 
                                                  onClick={() => removeQuestion(sectionIndex, questionIndex)}
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Box>
                                              
                                              <TextField
                                                label="Question Text"
                                                value={question.questionText}
                                                onChange={(e) => handleQuestionChange(
                                                  sectionIndex, 
                                                  questionIndex, 
                                                  'questionText', 
                                                  e.target.value
                                                )}
                                                fullWidth
                                                multiline
                                                rows={2}
                                                required
                                                error={!!formErrors[`question_${sectionIndex}_${questionIndex}_text`]}
                                                helperText={formErrors[`question_${sectionIndex}_${questionIndex}_text`]}
                                                margin="normal"
                                              />
                                              
                                              {question.type === 'mcq' && (
                                                <Box sx={{ mt: 2 }}>
                                                  <Typography variant="subtitle2">
                                                    Options
                                                    {formErrors[`question_${sectionIndex}_${questionIndex}_options`] && (
                                                      <FormHelperText error>
                                                        {formErrors[`question_${sectionIndex}_${questionIndex}_options`]}
                                                      </FormHelperText>
                                                    )}
                                                  </Typography>
                                                  
                                                  {question.options.map((option, optionIndex) => (
                                                    <Box 
                                                      key={`option-${sectionIndex}-${questionIndex}-${optionIndex}`}
                                                      display="flex" 
                                                      alignItems="center" 
                                                      mb={1}
                                                    >
                                                      <FormControl sx={{ mr: 2 }}>
                                                        <Select
                                                          value={option.isCorrect ? 'correct' : 'incorrect'}
                                                          onChange={(e) => setCorrectOption(
                                                            sectionIndex, 
                                                            questionIndex, 
                                                            optionIndex
                                                          )}
                                                          size="small"
                                                        >
                                                          <MenuItem value="correct">Correct</MenuItem>
                                                          <MenuItem value="incorrect">Incorrect</MenuItem>
                                                        </Select>
                                                      </FormControl>
                                                      
                                                      <TextField
                                                        label={`Option ${optionIndex + 1}`}
                                                        value={option.text}
                                                        onChange={(e) => handleOptionChange(
                                                          sectionIndex, 
                                                          questionIndex, 
                                                          optionIndex, 
                                                          'text', 
                                                          e.target.value
                                                        )}
                                                        fullWidth
                                                        required
                                                        error={!!formErrors[`option_${sectionIndex}_${questionIndex}_${optionIndex}`]}
                                                        helperText={formErrors[`option_${sectionIndex}_${questionIndex}_${optionIndex}`]}
                                                        margin="dense"
                                                      />
                                                      
                                                      <IconButton 
                                                        color="error" 
                                                        onClick={() => removeOption(
                                                          sectionIndex, 
                                                          questionIndex, 
                                                          optionIndex
                                                        )}
                                                        sx={{ ml: 1 }}
                                                      >
                                                        <DeleteIcon />
                                                      </IconButton>
                                                    </Box>
                                                  ))}
                                                  
                                                  <Button
                                                    startIcon={<AddIcon />}
                                                    onClick={() => addOption(sectionIndex, questionIndex)}
                                                    sx={{ mt: 1 }}
                                                  >
                                                    Add Option
                                                  </Button>
                                                </Box>
                                              )}
                                              
                                              {question.type === 'file-upload' && (
                                                <FormControl fullWidth margin="normal">
                                                  <InputLabel>Allowed File Type</InputLabel>
                                                  <Select
                                                    value={question.fileType || 'any'}
                                                    label="Allowed File Type"
                                                    onChange={(e) => handleQuestionChange(
                                                      sectionIndex, 
                                                      questionIndex, 
                                                      'fileType', 
                                                      e.target.value
                                                    )}
                                                  >
                                                    <MenuItem value="any">Any File</MenuItem>
                                                    <MenuItem value="image">Images Only</MenuItem>
                                                    <MenuItem value="pdf">PDF Only</MenuItem>
                                                    <MenuItem value="code">Code Files</MenuItem>
                                                  </Select>
                                                </FormControl>
                                              )}
                                            </CardContent>
                                          </Card>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </Box>
                                )}
                              </Droppable>
                              
                              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => addQuestion(sectionIndex, 'mcq')}
                                >
                                  Add MCQ
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => addQuestion(sectionIndex, 'subjective')}
                                >
                                  Add Subjective
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() => addQuestion(sectionIndex, 'file-upload')}
                                >
                                  Add File Upload
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addSection}
              sx={{ mt: 2 }}
            >
              Add Section
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default CreateExam; 