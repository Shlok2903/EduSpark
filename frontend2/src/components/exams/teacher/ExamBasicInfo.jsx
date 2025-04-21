import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import courseService from '../../../services/courseService';

const ExamBasicInfo = (props) => {
  const {
    examData,
    onExamDataChange,
    errors = {},
    setErrors = () => {}
  } = props;

  // If there are already local errors, no need to redefine them
  const [localErrors, setLocalErrors] = useState({});
  const displayErrors = Object.keys(errors).length > 0 ? errors : localErrors;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses for exam dropdown...');
      const response = await courseService.getTeacherCourses();
      console.log('Teacher courses response:', response);
      
      if (response.success && response.data) {
        console.log('Setting courses:', response.data);
        setCourses(response.data);
      } else {
        console.error('Failed to fetch courses: No data in response', response);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onExamDataChange(name, value);
    
    // Clear error for this field
    if (displayErrors[name]) {
      if (Object.keys(errors).length > 0) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      } else {
        setLocalErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    onExamDataChange(name, checked);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    onExamDataChange(name, value);
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
            error={!!displayErrors.title}
            helperText={displayErrors.title}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!displayErrors.courseId}>
            <InputLabel id="course-select-label">Course</InputLabel>
            <Select
              labelId="course-select-label"
              id="course-select"
              name="courseId"
              value={examData.courseId || ''}
              onChange={handleInputChange}
              label="Course"
              required
              disabled={loading}
            >
              {courses && courses.length > 0 ? (
                courses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.title}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  {loading ? 'Loading courses...' : 'No courses available'}
                </MenuItem>
              )}
            </Select>
            {displayErrors.courseId && <FormHelperText>{displayErrors.courseId}</FormHelperText>}
            {!loading && (!courses || courses.length === 0) && (
              <FormHelperText>
                No courses found. Please create a course first before creating an exam.
              </FormHelperText>
            )}
          </FormControl>
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
        
        <Grid item xs={12} md={6}>
          <TextField
            name="duration"
            label="Duration (minutes)"
            type="number"
            value={examData.duration}
            onChange={handleInputChange}
            fullWidth
            required
            error={!!displayErrors.duration}
            helperText={displayErrors.duration}
            InputProps={{
              inputProps: { min: 1 }
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="passingMarks"
            label="Passing Marks"
            type="number"
            value={examData.passingMarks || 0}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0 }
            }}
            helperText="Leave 0 if there's no passing criteria"
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
            value={examData.startTime instanceof Date ? examData.startTime.toISOString().slice(0, 16) : typeof examData.startTime === 'string' ? examData.startTime.slice(0, 16) : ''}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            required
            error={!!displayErrors.startTime}
            helperText={displayErrors.startTime || "When the exam will become available to students"}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="endTime"
            label="Exam End Date & Time"
            type="datetime-local"
            value={examData.endTime instanceof Date ? examData.endTime.toISOString().slice(0, 16) : typeof examData.endTime === 'string' ? examData.endTime.slice(0, 16) : ''}
            onChange={handleDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            required
            error={!!displayErrors.endTime}
            helperText={displayErrors.endTime || "When the exam will close for submissions"}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExamBasicInfo; 