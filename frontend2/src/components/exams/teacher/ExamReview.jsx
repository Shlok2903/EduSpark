import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';

const ExamReview = ({ examData, courseInfo, onExamDataChange }) => {
  const handleStatusChange = (e) => {
    if (onExamDataChange) {
      onExamDataChange('status', e.target.value);
    }
  };
  
  const handlePublishChange = (e) => {
    if (onExamDataChange) {
      onExamDataChange('isPublished', e.target.checked);
    }
  };

  const getQuestionTypeName = (type) => {
    switch (type) {
      case 'mcq':
        return 'Multiple Choice';
      case 'subjective':
        return 'Subjective';
      case 'fileUpload':
        return 'File Upload';
      default:
        return type;
    }
  };

  const getTotalQuestions = () => {
    let count = 0;
    examData.sections.forEach(section => {
      count += section.questions.length;
    });
    return count;
  };

  const calculateTotalMarks = () => {
    let total = 0;
    examData.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.type === 'mcq') {
          total += Number(question.positiveMarks || question.marks || 0);
        } else {
          total += Number(question.marks || 0);
        }
      });
    });
    return total;
  };

  const totalMarks = calculateTotalMarks();
  
  const getExamSummaryData = () => {
    return [
      { label: 'Title', value: examData.title || 'Untitled Exam' },
      { label: 'Course', value: courseInfo?.title || 'Unknown Course' },
      { label: 'Description', value: examData.description || 'No description provided' },
      { label: 'Duration', value: `${examData.duration} minutes` },
      { label: 'Total Marks', value: totalMarks },
      { label: 'Total Sections', value: examData.sections.length },
      { label: 'Total Questions', value: examData.sections.reduce((sum, section) => sum + section.questions.length, 0) },
      { label: 'Passing Marks', value: examData.passingMarks > 0 ? examData.passingMarks : 'None' },
      { label: 'Starts', value: new Date(examData.startTime).toLocaleString() },
      { label: 'Ends', value: new Date(examData.endTime).toLocaleString() },
      { label: 'Negative Marking', value: examData.negativeMarking ? 'Enabled' : 'Disabled' }
    ];
  };

  const examSummaryData = getExamSummaryData();

  const validateExam = () => {
    const issues = [];
    
    if (!examData.title.trim()) {
      issues.push('Exam title is required');
    }
    
    if (examData.duration <= 0) {
      issues.push('Exam duration must be greater than 0');
    }
    
    if (examData.passingMarks > totalMarks) {
      issues.push('Passing marks cannot be greater than total marks');
    }
    
    // Check if all sections have questions
    const emptySections = examData.sections.filter(section => section.questions.length === 0);
    if (emptySections.length > 0) {
      issues.push(`${emptySections.length} section(s) have no questions`);
    }
    
    // Check for empty questions or options
    examData.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        if (!question.text.trim()) {
          issues.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1} has no text`);
        }
        
        if (question.type === 'mcq') {
          const emptyOptions = question.options.filter(option => !option.text.trim());
          if (emptyOptions.length > 0) {
            issues.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1} has empty options`);
          }
          
          if (!question.options.some(option => option.isCorrect)) {
            issues.push(`Section ${sectionIndex + 1}, Question ${questionIndex + 1} has no correct answer selected`);
          }
        }
      });
    });
    
    return issues;
  };

  const issues = validateExam();

  return (
    <Box className="exam-review">
      <Typography variant="h6" gutterBottom>
        Review Exam Details
      </Typography>
      
      {issues.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following issues before publishing:
          </Typography>
          <List dense disablePadding>
            {issues.map((issue, index) => (
              <ListItem key={index} disablePadding>
                <ListItemText primary={`- ${issue}`} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Exam Summary
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {examSummaryData.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Typography variant="caption" color="textSecondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {item.value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Publishing Options
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={examData.isPublished}
                  onChange={handlePublishChange}
                  color="primary"
                  disabled={issues.length > 0}
                />
              }
              label={examData.isPublished ? "Publish immediately after creation" : "Save as draft (publish later)"}
            />
            {!examData.isPublished && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                Note: Students won't see the exam until you publish it
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Section Details
      </Typography>
      
      {examData.sections.map((section, sIndex) => (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }} key={sIndex}>
          <Typography variant="subtitle1" gutterBottom>
            {section.name || `Section ${sIndex + 1}`}
          </Typography>
          <Typography variant="caption" color="textSecondary" paragraph>
            {section.description || 'No description provided'}
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Typography variant="body2">
                Questions: {section.questions.length}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2">
                MCQs: {section.questions.filter(q => q.type === 'mcq').length}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2">
                Marks: {
                  section.questions.reduce((sum, q) => {
                    return sum + (q.type === 'mcq' ? (q.positiveMarks || q.marks || 0) : (q.marks || 0));
                  }, 0)
                }
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      ))}
      
      <Typography variant="subtitle1" gutterBottom>
        Exam Content
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Total Sections:</strong> {examData.sections.length}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Total Questions:</strong> {getTotalQuestions()}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Question Breakdown:
        </Typography>
        
        <List dense>
          {examData.sections.map((section, sectionIndex) => (
            <React.Fragment key={sectionIndex}>
              <ListItem>
                <ListItemText
                  primary={section.title}
                  secondary={`${section.questions.length} question${section.questions.length !== 1 ? 's' : ''}`}
                />
              </ListItem>
              
              <Box sx={{ pl: 2 }}>
                {section.questions.map((question, questionIndex) => (
                  <ListItem key={questionIndex} sx={{ py: 0.5 }}>
                    <Grid container alignItems="center">
                      <Grid item xs={8}>
                        <Typography variant="body2" noWrap>
                          Q{questionIndex + 1}: {question.text.substring(0, 60)}{question.text.length > 60 ? '...' : ''}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Chip 
                          label={getQuestionTypeName(question.type)} 
                          size="small"
                          color={
                            question.type === 'mcq' ? 'primary' : 
                            question.type === 'subjective' ? 'secondary' : 
                            'default'
                          }
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={2} textAlign="right">
                        <Typography variant="body2">
                          {question.marks} marks
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </Box>
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      <Typography variant="subtitle1" gutterBottom>
        Exam Status
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={examData.status}
          label="Status"
          onChange={handleStatusChange}
        >
          <MenuItem value="draft">Save as Draft</MenuItem>
          <MenuItem value="published" disabled={issues.length > 0}>Publish Immediately</MenuItem>
        </Select>
      </FormControl>
      
      {examData.status === 'draft' && (
        <Alert severity="info">
          This exam will be saved as a draft and won't be visible to students until you publish it.
        </Alert>
      )}
      
      {examData.status === 'published' && (
        <Alert severity="success">
          This exam will be published immediately and will be available to enrolled students.
        </Alert>
      )}
    </Box>
  );
};

export default ExamReview; 