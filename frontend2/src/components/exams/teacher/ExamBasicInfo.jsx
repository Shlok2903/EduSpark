import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  InputAdornment
} from '@mui/material';

const ExamBasicInfo = ({ examData, onExamDataChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onExamDataChange(name, value);
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    onExamDataChange(name, checked);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    onExamDataChange(name, new Date(value));
  };

  return (
    <Box className="exam-basic-info">
      <Typography variant="h6" gutterBottom>
        Exam Details
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Enter the basic information for your exam
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            name="title"
            label="Exam Title"
            value={examData.title}
            onChange={handleInputChange}
            fullWidth
            required
            placeholder="e.g. Midterm Exam"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="description"
            label="Exam Description"
            value={examData.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Provide a brief description about this exam"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="instructions"
            label="Exam Instructions"
            value={examData.instructions}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={4}
            placeholder="Enter instructions for students taking this exam"
            helperText="These instructions will be displayed to students before they start the exam"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            name="duration"
            label="Duration (minutes)"
            type="number"
            value={examData.duration}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: <InputAdornment position="end">min</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            name="passingMarks"
            label="Passing Marks"
            type="number"
            value={examData.passingMarks}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0 }
            }}
            helperText="Leave 0 for no passing threshold"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControlLabel
            control={
              <Switch
                name="negativeMarking"
                checked={examData.negativeMarking}
                onChange={handleSwitchChange}
                color="primary"
              />
            }
            label="Enable Negative Marking"
          />
          <Typography variant="caption" color="textSecondary" display="block">
            If enabled, incorrect answers will deduct marks
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            name="startTime"
            label="Exam Start Date & Time"
            type="datetime-local"
            value={examData.startTime ? new Date(examData.startTime).toISOString().slice(0, 16) : ''}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            helperText="When will the exam become available to students"
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="endTime"
            label="Exam End Date & Time"
            type="datetime-local"
            value={examData.endTime ? new Date(examData.endTime).toISOString().slice(0, 16) : ''}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            helperText="When will the exam close for submissions"
            required
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExamBasicInfo; 