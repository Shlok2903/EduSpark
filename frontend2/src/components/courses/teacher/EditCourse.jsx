import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper, 
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Breadcrumbs,
  Link,
  Alert,
  IconButton
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { courseService } from '../../../services/api';
import './EditCourse.css';

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Course state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch course data on component mount
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        console.log('Fetching course data for ID:', courseId);
        const response = await courseService.getCourseById(courseId);
        console.log('Course data response:', response);
        
        if (response.success && response.data) {
          const course = response.data;
          setTitle(course.title || '');
          setDescription(course.description || '');
          setIsOptional(course.isOptional || false);
          setDeadline(course.deadline ? new Date(course.deadline) : null);
          setImagePreview(course.imageUrl || '');
        } else {
          setError(response.message || 'Failed to load course data');
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to fetch course details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);
  
  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // Create form data for submission
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('isOptional', isOptional);
      
      if (deadline) {
        formData.append('deadline', deadline.toISOString());
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Update course
      const response = await courseService.updateCourse(courseId, formData);
      
      if (response.success) {
        setSuccess('Course updated successfully');
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/dashboard/courses/${courseId}`);
        }, 1500);
      } else {
        setError(response.message || 'Failed to update course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" className="edit-course-container">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" className="breadcrumbs">
        <Link component={RouterLink} to="/dashboard/manage-courses" color="inherit">
          Manage Courses
        </Link>
        <Link 
          component={RouterLink} 
          to={`/dashboard/courses/${courseId}`} 
          color="inherit"
        >
          {title}
        </Link>
        <Typography color="textPrimary">Edit</Typography>
      </Breadcrumbs>
      
      <Box className="header">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/dashboard/courses/${courseId}`)}
          className="back-button"
        >
          Back to Course
        </Button>
        <Typography variant="h4" component="h1" className="title">
          Edit Course
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" className="alert">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" className="alert">
          {success}
        </Alert>
      )}
      
      <Paper elevation={3} className="form-paper">
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4} className="image-section">
              <Box className="image-container">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Course preview" 
                    className="image-preview" 
                  />
                ) : (
                  <Box className="no-image">
                    <CameraIcon fontSize="large" />
                    <Typography>No image</Typography>
                  </Box>
                )}
                
                <input
                  accept="image/*"
                  className="image-input"
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CameraIcon />}
                    fullWidth
                    className="upload-button"
                  >
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </Button>
                </label>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                label="Course Title"
                variant="outlined"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                margin="normal"
                className="text-field"
              />
              
              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                multiline
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                margin="normal"
                className="text-field"
              />
              
              <TextField
                label="Deadline (Optional)"
                type="date"
                value={deadline ? deadline.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setDeadline(date);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
                margin="normal"
                className="date-picker"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isOptional}
                    onChange={(e) => setIsOptional(e.target.checked)}
                    color="primary"
                  />
                }
                label="This course is optional"
                className="switch"
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} className="actions">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate(`/dashboard/courses/${courseId}`)}
                disabled={submitting}
                className="cancel-button"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                className="submit-button"
              >
                {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditCourse; 