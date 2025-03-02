import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Input,
  InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';
import { handleError, handleSuccess } from '../../utils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function TutorDashboard() {
  const [courses, setCourses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_optional: false,
    deadline: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) {
      handleError('Error fetching courses');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenDialog = (course = null) => {
    if (course) {
      setSelectedCourse(course);
      setFormData({
        name: course.name,
        description: course.description,
        is_optional: course.is_optional,
        deadline: new Date(course.deadline).toISOString().split('T')[0]
      });
      setPreviewUrl(course.thumbnail_url);
    } else {
      setSelectedCourse(null);
      setFormData({
        name: '',
        description: '',
        is_optional: false,
        deadline: ''
      });
      setPreviewUrl('');
    }
    setThumbnailFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCourse(null);
    setThumbnailFile(null);
    setPreviewUrl('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = selectedCourse
        ? `http://localhost:8080/api/courses/${selectedCourse._id}`
        : 'http://localhost:8080/api/courses';

      // Create FormData object
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('description', formData.description);
      submitFormData.append('is_optional', formData.is_optional.toString());
      submitFormData.append('deadline', formData.deadline);
      
      if (thumbnailFile) {
        submitFormData.append('thumbnail', thumbnailFile);
      }
      
      const response = await fetch(url, {
        method: selectedCourse ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Remove Content-Type header to let the browser set it with the boundary
        },
        body: submitFormData
      });

      const data = await response.json();
      if (data.success) {
        handleSuccess(data.message);
        handleCloseDialog();
        fetchCourses();
      } else {
        handleError(data.message || 'Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      handleError('Error saving course');
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        if (data.success) {
          handleSuccess(data.message);
          fetchCourses();
        } else {
          handleError(data.message);
        }
      } catch (error) {
        handleError('Error deleting course');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Courses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Course
        </Button>
      </Box>

      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={course.thumbnail_url}
                alt={course.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {course.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Deadline: {new Date(course.deadline).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Optional: {course.is_optional ? 'Yes' : 'No'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(course)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(course._id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Course Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <InputLabel htmlFor="thumbnail-upload">Course Thumbnail</InputLabel>
              <Input
                id="thumbnail-upload"
                type="file"
                onChange={handleFileChange}
                sx={{ display: 'none' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor="thumbnail-upload"
                  startIcon={<ImageIcon />}
                >
                  {thumbnailFile ? 'Change Image' : 'Upload Image'}
                </Button>
                {previewUrl && (
                  <Box sx={{ ml: 2 }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ maxWidth: '100px', maxHeight: '100px' }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_optional}
                  onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                />
              }
              label="Optional Course"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!thumbnailFile && !selectedCourse}
          >
            {selectedCourse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <ToastContainer />
    </Container>
  );
}

export default TutorDashboard; 