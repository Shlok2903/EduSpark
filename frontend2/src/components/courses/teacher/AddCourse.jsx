import React, { useState, useEffect } from 'react';
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
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import courseService from '../../../services/courseService';
import branchService from '../../../services/branchService';
import semesterService from '../../../services/semesterService';
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
    branch: '',
    semester: '',
    deadline: '',
    courseImage: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch semesters when branch changes
  useEffect(() => {
    if (courseData.branch) {
      fetchSemesters(courseData.branch);
    } else {
      setSemesters([]);
    }
  }, [courseData.branch]);

  // Fetch all branches
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await branchService.getAllBranches();
      if (response.success) {
        setBranches(response.data);
      } else {
        toast.error('Failed to load branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Error loading branches');
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
        toast.error('Failed to load semesters');
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Error loading semesters');
    } finally {
      setLoadingSemesters(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If visibility type changes, reset branch and semester if it's public
    if (name === 'visibilityType' && value === 'public') {
      setCourseData(prev => ({
        ...prev,
        branch: '',
        semester: '',
        [name]: value
      }));
    }
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
    
    // Validate branch and semester are set for non-public courses
    if ((courseData.visibilityType === 'mandatory' || courseData.visibilityType === 'optional') && 
        (!courseData.branch || !courseData.semester)) {
      toast.error('Please select a branch and semester for non-public courses');
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

  // Determine if branch/semester fields should be displayed
  const showBranchSemester = courseData.visibilityType === 'mandatory' || courseData.visibilityType === 'optional';

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
                
                {/* Branch dropdown - only show for non-public courses */}
                {showBranchSemester && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required disabled={loadingBranches}>
                      <InputLabel id="branch-label">Branch</InputLabel>
                      <Select
                        labelId="branch-label"
                        id="branch"
                        name="branch"
                        value={courseData.branch}
                        onChange={handleChange}
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
                  </Grid>
                )}
                
                {/* Semester dropdown - only show for non-public courses and when branch is selected */}
                {showBranchSemester && (
                  <Grid item xs={12} md={6}>
                    <FormControl 
                      fullWidth 
                      required 
                      disabled={loadingSemesters || !courseData.branch}
                    >
                      <InputLabel id="semester-label">Semester</InputLabel>
                      <Select
                        labelId="semester-label"
                        id="semester"
                        name="semester"
                        value={courseData.semester}
                        onChange={handleChange}
                        label="Semester"
                      >
                        {loadingSemesters ? (
                          <MenuItem value="">
                            <CircularProgress size={20} /> Loading...
                          </MenuItem>
                        ) : !courseData.branch ? (
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
                        {!courseData.branch 
                          ? 'Select a branch first' 
                          : 'Select the semester for this course'}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                )}
                
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