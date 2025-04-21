import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  AddCircleOutline as AddOptionIcon,
  RemoveCircleOutline as RemoveOptionIcon
} from '@mui/icons-material';

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice Question' },
  { value: 'subjective', label: 'Subjective Question' },
  { value: 'fileUpload', label: 'File Upload Question' }
];

const QuestionsEditor = ({ sections, onSectionsChange, negativeMarking }) => {
  const [expandedSection, setExpandedSection] = useState(0);
  const [expandedQuestion, setExpandedQuestion] = useState({});

  const handleSectionTitleChange = (index, value) => {
    const updatedSections = [...sections];
    updatedSections[index].name = value;
    onSectionsChange(updatedSections);
  };

  const handleSectionDescriptionChange = (index, value) => {
    const updatedSections = [...sections];
    updatedSections[index].description = value;
    onSectionsChange(updatedSections);
  };

  const addSection = () => {
    const newSections = [...sections];
    newSections.push({
      name: `Section ${sections.length + 1}`,
      description: '',
      questions: []
    });
    onSectionsChange(newSections);
    setExpandedSection(newSections.length - 1);
  };

  const removeSection = (index) => {
    if (sections.length === 1) {
      return; // Don't remove the last section
    }
    
    const newSections = [...sections];
    newSections.splice(index, 1);
    onSectionsChange(newSections);
    
    if (expandedSection >= index && expandedSection > 0) {
      setExpandedSection(expandedSection - 1);
    }
  };

  const addQuestion = (sectionIndex) => {
    const updatedSections = [...sections];
    const defaultText = `Question ${updatedSections[sectionIndex].questions.length + 1}`;
    
    updatedSections[sectionIndex].questions.push({
      type: 'mcq',
      text: defaultText,
      question: defaultText,
      marks: 1,
      negativeMarks: negativeMarking ? 0.25 : 0,
      options: [
        { text: 'Option 1', isCorrect: true },
        { text: 'Option 2', isCorrect: false }
      ]
    });
    
    onSectionsChange(updatedSections);
    
    setExpandedQuestion({
      ...expandedQuestion,
      [sectionIndex]: updatedSections[sectionIndex].questions.length - 1
    });
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions.splice(questionIndex, 1);
    onSectionsChange(updatedSections);
  };

  const handleQuestionTypeChange = (sectionIndex, questionIndex, value) => {
    const updatedSections = [...sections];
    const question = updatedSections[sectionIndex].questions[questionIndex];
    
    // Reset certain fields based on the question type
    if (value === 'mcq') {
      question.options = question.options || [
        { text: 'Option 1', isCorrect: true },
        { text: 'Option 2', isCorrect: false }
      ];
    } else if (value === 'subjective' || value === 'fileUpload') {
      question.answer = '';
      // Keep options for reference but they won't be used
    }
    
    question.type = value;
    onSectionsChange(updatedSections);
  };

  const handleQuestionTextChange = (sectionIndex, questionIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex].text = value;
    updatedSections[sectionIndex].questions[questionIndex].question = value;
    onSectionsChange(updatedSections);
  };

  const handleOptionTextChange = (sectionIndex, questionIndex, optionIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex].options[optionIndex].text = value;
    onSectionsChange(updatedSections);
  };

  const handleCorrectOptionChange = (sectionIndex, questionIndex, optionIndex) => {
    const updatedSections = [...sections];
    const options = updatedSections[sectionIndex].questions[questionIndex].options;
    
    // Set all options to not correct
    options.forEach(option => option.isCorrect = false);
    
    // Set the selected option as correct
    options[optionIndex].isCorrect = true;
    
    onSectionsChange(updatedSections);
  };

  const addOption = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    const options = updatedSections[sectionIndex].questions[questionIndex].options;
    updatedSections[sectionIndex].questions[questionIndex].options.push({
      text: `Option ${options.length + 1}`,
      isCorrect: false
    });
    onSectionsChange(updatedSections);
  };

  const removeOption = (sectionIndex, questionIndex, optionIndex) => {
    const updatedSections = [...sections];
    const options = updatedSections[sectionIndex].questions[questionIndex].options;
    
    if (options.length <= 2) {
      return; // Don't remove if only 2 options left
    }
    
    // If removing the correct option, make the first option correct
    if (options[optionIndex].isCorrect) {
      options[0].isCorrect = true;
    }
    
    options.splice(optionIndex, 1);
    onSectionsChange(updatedSections);
  };

  const handleMarksChange = (sectionIndex, questionIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex].marks = value;
    onSectionsChange(updatedSections);
  };

  const handleNegativeMarksChange = (sectionIndex, questionIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex].negativeMarks = value;
    onSectionsChange(updatedSections);
  };

  const handleSectionToggle = (index) => {
    setExpandedSection(expandedSection === index ? -1 : index);
  };

  const handleQuestionToggle = (sectionIndex, questionIndex) => {
    setExpandedQuestion({
      ...expandedQuestion,
      [sectionIndex]: expandedQuestion[sectionIndex] === questionIndex ? -1 : questionIndex
    });
  };

  return (
    <Box className="questions-editor">
      <Box className="editor-header">
        <Typography variant="h6">Exam Sections and Questions</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addSection}
        >
          Add Section
        </Button>
      </Box>
      
      {sections.length === 0 ? (
        <Alert severity="info" sx={{ marginTop: 2 }}>
          No sections yet. Add a section to start creating questions.
        </Alert>
      ) : (
        sections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="section-card">
            <CardHeader
              title={
                <TextField
                  value={section.name}
                  onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                  variant="standard"
                  fullWidth
                  placeholder="Section Title"
                />
              }
              action={
                <IconButton 
                  color="error" 
                  onClick={() => removeSection(sectionIndex)}
                  disabled={sections.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              }
              className="section-header"
            />
            <CardContent>
              <TextField
                value={section.description}
                onChange={(e) => handleSectionDescriptionChange(sectionIndex, e.target.value)}
                fullWidth
                multiline
                placeholder="Section Description (optional)"
                margin="normal"
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Box className="questions-container">
                <Box className="questions-header">
                  <Typography variant="subtitle1">
                    Questions ({section.questions.length})
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addQuestion(sectionIndex)}
                    color="primary"
                    size="small"
                  >
                    Add Question
                  </Button>
                </Box>
                
                {section.questions.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No questions in this section. Add your first question!
                  </Alert>
                ) : (
                  section.questions.map((question, questionIndex) => (
                    <Box key={questionIndex} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                        <Typography variant="body1" sx={{ flex: 1 }}>
                          Q{questionIndex + 1}: {question.text ? 
                            (question.text.substring(0, 60) + (question.text.length > 60 ? '...' : '')) : 
                            `Question ${questionIndex + 1}`
                          }
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeQuestion(sectionIndex, questionIndex)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Accordion
                        expanded={expandedQuestion[sectionIndex] === questionIndex}
                        onChange={() => handleQuestionToggle(sectionIndex, questionIndex)}
                        className="question-accordion"
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          className="question-header"
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                              {questionTypes.find(t => t.value === question.type)?.label || 'MCQ'} | {question.marks} marks
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                label="Question Text"
                                value={question.text}
                                onChange={(e) => handleQuestionTextChange(sectionIndex, questionIndex, e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Enter your question here..."
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={4}>
                              <FormControl fullWidth>
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                  value={question.type}
                                  onChange={(e) => handleQuestionTypeChange(sectionIndex, questionIndex, e.target.value)}
                                  label="Question Type"
                                >
                                  {questionTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                      {type.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} sm={6} md={4}>
                              <TextField
                                label="Marks"
                                type="number"
                                value={question.marks}
                                onChange={(e) => handleMarksChange(sectionIndex, questionIndex, Number(e.target.value))}
                                fullWidth
                                InputProps={{
                                  inputProps: { min: 0 }
                                }}
                              />
                            </Grid>
                            
                            {negativeMarking && (
                              <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                  label="Negative Marks"
                                  type="number"
                                  value={question.negativeMarks}
                                  onChange={(e) => handleNegativeMarksChange(sectionIndex, questionIndex, Number(e.target.value))}
                                  fullWidth
                                  InputProps={{
                                    inputProps: { min: 0 }
                                  }}
                                  helperText="Marks deducted for wrong answer"
                                />
                              </Grid>
                            )}
                            
                            {question.type === 'mcq' && (
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Options (select the correct answer)
                                </Typography>
                                
                                <Box className="options-container">
                                  <RadioGroup
                                    value={question.options.findIndex(opt => opt.isCorrect)}
                                    onChange={(e) => handleCorrectOptionChange(sectionIndex, questionIndex, Number(e.target.value))}
                                  >
                                    {question.options.map((option, optionIndex) => (
                                      <Box key={optionIndex} className="option-field">
                                        <Radio
                                          value={optionIndex}
                                          checked={option.isCorrect}
                                          className="option-radio"
                                        />
                                        <TextField
                                          value={option.text}
                                          onChange={(e) => handleOptionTextChange(sectionIndex, questionIndex, optionIndex, e.target.value)}
                                          fullWidth
                                          placeholder={`Option ${optionIndex + 1}`}
                                          className="option-input"
                                        />
                                        <IconButton
                                          color="error"
                                          onClick={() => removeOption(sectionIndex, questionIndex, optionIndex)}
                                          disabled={question.options.length <= 2}
                                        >
                                          <RemoveOptionIcon />
                                        </IconButton>
                                      </Box>
                                    ))}
                                  </RadioGroup>
                                  
                                  <Button
                                    startIcon={<AddOptionIcon />}
                                    onClick={() => addOption(sectionIndex, questionIndex)}
                                    color="primary"
                                    size="small"
                                    sx={{ mt: 1 }}
                                  >
                                    Add Option
                                  </Button>
                                </Box>
                              </Grid>
                            )}
                            
                            {question.type === 'subjective' && (
                              <Grid item xs={12}>
                                <TextField
                                  label="Model Answer (optional)"
                                  multiline
                                  rows={3}
                                  fullWidth
                                  placeholder="Enter a model answer for reference when grading"
                                  value={question.answer || ''}
                                  onChange={(e) => {
                                    const updatedSections = [...sections];
                                    updatedSections[sectionIndex].questions[questionIndex].answer = e.target.value;
                                    onSectionsChange(updatedSections);
                                  }}
                                />
                                <FormHelperText>
                                  This will only be visible to you when grading and won't be shown to students
                                </FormHelperText>
                              </Grid>
                            )}
                            
                            {question.type === 'fileUpload' && (
                              <Grid item xs={12}>
                                <TextField
                                  label="Accepted File Types"
                                  fullWidth
                                  placeholder="e.g. pdf,doc,docx,zip,rar"
                                  value={question.fileTypes || ''}
                                  onChange={(e) => {
                                    const updatedSections = [...sections];
                                    updatedSections[sectionIndex].questions[questionIndex].fileTypes = e.target.value;
                                    onSectionsChange(updatedSections);
                                  }}
                                  helperText="Comma-separated list of allowed file extensions"
                                />
                              </Grid>
                            )}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default QuestionsEditor; 