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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { courseService } from '../../../services/api';
import branchService from '../../../services/branchService';
import semesterService from '../../../services/semesterService';
import './EditCourse.css';

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Course state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibilityType, setVisibilityType] = useState('public');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);
  
  // Fetch semesters when branch changes
  useEffect(() => {
    if (branch) {
      fetchSemesters(branch);
    } else {
      setSemesters([]);
    }
  }, [branch]);
  
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
          setVisibilityType(course.visibilityType || 'public');
          if (course.branch) setBranch(course.branch._id || course.branch);
          if (course.semester) setSemester(course.semester._id || course.semester);
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
  
  // Fetch all branches
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await branchService.getAllBranches();
      if (response.success) {
        setBranches(response.data);
      } else {
        setError('Failed to load branches');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Error loading branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  // Fetch semesters for selected branch
  const fetchSemesters = async (branchId) => {
    try {
      setLoadingSemesters(true);
      const response = await semesterService.getSemestersByBranch(branchId);
      if (response.success) {
        setSemesters(response.data);
      } else {
        setError('Failed to load semesters');
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setError('Error loading semesters');
    } finally {
      setLoadingSemesters(false);
    }
  };
  
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
      
      // Validate required fields for non-public courses
      if ((visibilityType === 'mandatory' || visibilityType === 'optional') && 
          (!branch || !semester)) {
        setError('Please select a branch and semester for non-public courses');
        setSubmitting(false);
        return;
      }
      
      // Validate that deadline is set if course is mandatory
      if (visibilityType === 'mandatory' && !deadline) {
        setError('Please set a deadline for mandatory courses');
        setSubmitting(false);
        return;
      }
      
      // Create form data for submission
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('visibilityType', visibilityType);
      
      // Add branch and semester for non-public courses
      if (visibilityType === 'mandatory' || visibilityType === 'optional') {
        formData.append('branch', branch);
        formData.append('semester', semester);
      }
      
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
  
  // Determine if branch/semester fields should be displayed
  const showBranchSemester = visibilityType === 'mandatory' || visibilityType === 'optional';
  
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
              
              <FormControl fullWidth margin="normal" className="text-field">
                <InputLabel id="visibility-type-label">Course Visibility</InputLabel>
                <Select
                  labelId="visibility-type-label"
                  id="visibilityType"
                  value={visibilityType}
                  onChange={(e) => {
                    setVisibilityType(e.target.value);
                    // If visibility type changes to public, reset branch and semester
                    if (e.target.value === 'public') {
                      setBranch('');
                      setSemester('');
                    }
                  }}
                  label="Course Visibility"
                >
                  <MenuItem value="public">Public (Anyone can enroll and view)</MenuItem>
                  <MenuItem value="mandatory">Mandatory (Auto-enrolled for assigned students)</MenuItem>
                  <MenuItem value="optional">Optional (Assigned students can choose to enroll)</MenuItem>
                </Select>
                <FormHelperText>
                  {visibilityType === 'public' 
                    ? 'Anyone can see and enroll in this course' 
                    : visibilityType === 'mandatory'
                    ? 'Assigned students will be auto-enrolled and must complete this course'
                    : 'Only assigned students can see this course, but enrollment is optional'}
                </FormHelperText>
              </FormControl>
              
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
                required={visibilityType === 'mandatory'}
                helperText={visibilityType === 'mandatory' ? 'Required for mandatory courses' : 'Optional'}
              />
              
              {/* Branch dropdown - only show for non-public courses */}
              {showBranchSemester && (
                <FormControl fullWidth margin="normal" required disabled={loadingBranches}>
                  <InputLabel id="branch-label">Branch</InputLabel>
                  <Select
                    labelId="branch-label"
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    label="Branch"
                  >
                    {loadingBranches ? (
                      <MenuItem value="">
                        <CircularProgress size={20} /> Loading...
                      </MenuItem>
                    ) : (
                      branches.map(branch => (
                        <MenuItem key={branch._id} value={branch._id}>
                          {branch.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>Select the branch for this course</FormHelperText>
                </FormControl>
              )}
              
              {/* Semester dropdown - only show for non-public courses and when branch is selected */}
              {showBranchSemester && (
                <FormControl 
                  fullWidth 
                  margin="normal"
                  required 
                  disabled={loadingSemesters || !branch}
                >
                  <InputLabel id="semester-label">Semester</InputLabel>
                  <Select
                    labelId="semester-label"
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    label="Semester"
                  >
                    {loadingSemesters ? (
                      <MenuItem value="">
                        <CircularProgress size={20} /> Loading...
                      </MenuItem>
                    ) : !branch ? (
                      <MenuItem value="">
                        First select a branch
                      </MenuItem>
                    ) : (
                      semesters.map(semester => (
                        <MenuItem key={semester._id} value={semester._id}>
                          {semester.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>
                    {!branch 
                      ? 'Select a branch first' 
                      : 'Select the semester for this course'}
                  </FormHelperText>
                </FormControl>
              )}
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