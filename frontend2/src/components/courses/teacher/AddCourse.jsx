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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
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
    visibilityType: 'public', // Default to public
    deadline: '',
    courseImage: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
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

    // Validate that deadline is set if course is mandatory
    if (courseData.visibilityType === 'mandatory' && !courseData.deadline) {
      toast.error('Please set a deadline for mandatory courses');
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

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="visibility-type-label">Course Visibility</InputLabel>
                    <Select
                      labelId="visibility-type-label"
                      id="visibilityType"
                      name="visibilityType"
                      value={courseData.visibilityType}
                        onChange={handleChange}
                      label="Course Visibility"
                    >
                      <MenuItem value="public">Public (Anyone can enroll and view)</MenuItem>
                      <MenuItem value="mandatory">Mandatory (Auto-enrolled for assigned students)</MenuItem>
                      <MenuItem value="optional">Optional (Assigned students can choose to enroll)</MenuItem>
                    </Select>
                    <FormHelperText>
                      {courseData.visibilityType === 'public' 
                        ? 'Anyone can see and enroll in this course' 
                        : courseData.visibilityType === 'mandatory'
                        ? 'Assigned students will be auto-enrolled and must complete this course'
                        : 'Only assigned students can see this course, but enrollment is optional'}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                    label="Deadline (Optional for mandatory courses)"
                      name="deadline"
                      type="date"
                      value={courseData.deadline}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    helperText={courseData.visibilityType === 'mandatory' ? 'Required for mandatory courses' : 'Optional'}
                    required={courseData.visibilityType === 'mandatory'}
                    />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Course Thumbnail
                  </Typography>
                  <input
                    accept="image/*"
                    id="course-image-upload"
                    type="file"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="course-image-upload">
                      <Button
                        variant="outlined"
                      component="span"
                        startIcon={<PhotoCamera />}
                      >
                      Upload Image
                    </Button>
                  </label>
                  {imagePreview && (
                    <Box mt={2} textAlign="center">
                      <img
                        src={imagePreview}
                        alt="Course thumbnail preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        />
                    </Box>
                    )}
                </Grid>
                
                <Grid item xs={12} textAlign="right">
                  <Button 
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Course & Continue'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" gutterBottom>
                Course created successfully!
              </Typography>
              <Typography variant="body1" paragraph>
                Now you can add sections and modules to your course.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddSections}
              >
                Add Course Sections
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AddCourse; 