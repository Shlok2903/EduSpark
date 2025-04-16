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

const ExamReview = ({ examData, courseInfo, totalMarks, onExamDataChange }) => {
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
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FormControlLabel
          control={
            <Switch 
              checked={examData.isPublished} 
              onChange={handlePublishChange}
              color="primary"
              disabled={issues.length > 0}
            />
          }
          label={examData.isPublished ? "Exam will be published" : "Exam will be saved as draft"}
        />
        {!examData.isPublished && (
          <Typography variant="caption" color="warning.main">
            Note: Students won't see the exam until you publish it
          </Typography>
        )}
      </Box>
      
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Typography variant="subtitle1" gutterBottom>
              {examData.title || 'Untitled Exam'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {examData.description || 'No description provided'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Course
                </Typography>
                <Typography variant="body2">
                  {courseInfo?.title || 'Unknown Course'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Duration
                </Typography>
                <Typography variant="body2">
                  {examData.duration} minutes
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Total Marks
                </Typography>
                <Typography variant="body2">
                  {totalMarks}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Passing Marks
                </Typography>
                <Typography variant="body2">
                  {examData.passingMarks > 0 ? examData.passingMarks : 'None'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Negative Marking
                </Typography>
                <Typography variant="body2">
                  {examData.negativeMarking ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
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