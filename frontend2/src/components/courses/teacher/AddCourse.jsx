import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Switch
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import courseService from '../../../services/courseService';
import './AddCourse.css';

function AddCourse() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState(null);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    isOptional: false,
    deadline: '',
    courseImage: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourseData(prev => ({
        ...prev,
        courseImage: file
      }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate required fields
    if (!courseData.title) {
      toast.error('Please fill in the course title');
      setLoading(false);
      return;
    }

    if (!courseData.description) {
      toast.error('Please add a description for your course');
      setLoading(false);
      return;
    }

    if (!courseData.courseImage) {
      toast.error('Please upload a thumbnail image for your course');
      setLoading(false);
      return;
    }

    // Validate that deadline is set if course is not optional
    if (!courseData.isOptional && !courseData.deadline) {
      toast.error('Please set a deadline for required courses');
      setLoading(false);
      return;
    }
    
    try {
      const response = await courseService.createCourse(courseData);
      console.log('Create course response:', response);
      
      // The response is already the data because of the axios interceptor
      if (response.success) {
        toast.success('Course created successfully!');
        // Get the course ID - check multiple possible locations
        const courseId = response.data?._id || response.data?.id;
        console.log('Extracted course ID:', courseId);
        
        if (courseId) {
          setCourseId(courseId);
          setActiveStep(1); // Move to next step
        } else {
          console.error('Course ID not found in response', response);
          toast.warning('Course created but ID not found. Please check the courses list.');
          // Navigate back to courses page after a delay
          setTimeout(() => {
            navigate('/dashboard/courses');
          }, 3000);
        }
      } else {
        toast.error(response.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      // Access the formatted message from the API interceptor
      toast.error(error.formattedMessage || 'Error creating course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSections = () => {
    // Make sure we have a course ID before navigating
    if (!courseId) {
      console.error('No course ID available');
      toast.error('Course ID not found. Please try again.');
      return;
    }
    
    console.log('Navigating to add sections with course ID:', courseId);
    // Navigate to add sections page with the course ID
    navigate(`/add-course/sections/${courseId}`);
  };

  return (
    <Box className="add-course-container">
      <Typography variant="h4" className="page-title">
        Create New Course
      </Typography>
      
      <Stepper activeStep={activeStep} className="course-creation-stepper">
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
      
      <Card className="add-course-card">
        <CardContent>
          {activeStep === 0 ? (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" className="section-title">
                    Course Details
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Title"
                    name="title"
                    value={courseData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter an engaging title for your course"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={courseData.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    required
                    placeholder="Describe what students will learn in this course"
                    helperText="A clear description helps students understand what they'll learn"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={courseData.isOptional}
                        onChange={handleChange}
                        name="isOptional"
                        color="primary"
                      />
                    }
                    label="Optional Course"
                  />

                  {!courseData.isOptional && (
                    <TextField
                      fullWidth
                      label="Deadline"
                      name="deadline"
                      type="date"
                      value={courseData.deadline}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0]
                      }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Course Thumbnail Image
                  </Typography>
                  <Box className="image-upload-container">
                    {imagePreview ? (
                      <Box className="image-preview-container">
                        <img 
                          src={imagePreview} 
                          alt="Course preview" 
                          className="image-preview" 
                        />
                        <Button 
                          variant="contained" 
                          onClick={() => {
                            setImagePreview(null);
                            setCourseData(prev => ({ ...prev, courseImage: null }));
                          }}
                          className="change-image-btn"
                        >
                          Change Image
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<PhotoCamera />}
                        className="upload-button"
                      >
                        Upload Thumbnail
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} className="actions-container">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit"
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Creating Course...' : 'Create Course & Continue'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          ) : (
            <Box className="next-steps-container">
              <Typography variant="h6" gutterBottom>
                Course Created Successfully!
              </Typography>
              <Typography variant="body1" paragraph>
                Your course has been created. Now let's add some sections and content to your course.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddSections}
                className="next-button"
              >
                Continue to Add Sections
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AddCourse; 