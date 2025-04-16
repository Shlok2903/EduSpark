import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Add, Delete, Edit, KeyboardArrowRight } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService, sectionService } from '../../../services/api';
import './AddSections.css';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function AddSections() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sections, setSections] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [course, setCourse] = useState(null);
  const [sectionData, setSectionData] = useState({
    title: '',
    description: ''
  });

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseService.getCourseById(courseId);
        setCourse(response.data);
        
        // If course has sections, populate them
        if (response.data.sections && response.data.sections.length > 0) {
          setSections(response.data.sections);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error(error.formattedMessage || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleChange = (e) => {
    setSectionData({
      ...sectionData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddDialog = () => {
    setSectionData({ title: '', description: '' });
    setEditIndex(-1);
    setOpenDialog(true);
  };

  const handleEditDialog = (index) => {
    setSectionData({
      title: sections[index].title,
      description: sections[index].description
    });
    setEditIndex(index);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveSection = () => {
    // Validate
    if (!sectionData.title) {
      toast.error('Section title is required');
      return;
    }

    if (!sectionData.description) {
      toast.error('Section description is required');
      return;
    }

    // Update or add section
    if (editIndex >= 0) {
      const updatedSections = [...sections];
      updatedSections[editIndex] = {
        ...updatedSections[editIndex],
        title: sectionData.title,
        description: sectionData.description
      };
      setSections(updatedSections);
    } else {
      setSections([
        ...sections,
        {
          title: sectionData.title,
          description: sectionData.description,
          modules: []
        }
      ]);
    }

    handleCloseDialog();
  };

  const handleDeleteSection = (index) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    setSections(updatedSections);
  };

  const handleSubmit = async () => {
    if (sections.length === 0) {
      toast.error('Please add at least one section');
      return;
    }

    setSubmitting(true);

    try {
      const sectionsToCreate = sections.map(section => ({
        title: section.title,
        description: section.description
      }));

      // Create sections using the sectionService
      const response = await sectionService.createSections(courseId, sectionsToCreate);
      
      if (response.success) {
        toast.success('Sections created successfully');
        const createdSections = response.data;
        
        // If there are sections, navigate to add content for the first section
        if (createdSections && createdSections.length > 0) {
          navigate(`/add-course/content/${courseId}/${createdSections[0]._id}`);
        } else {
          navigate(`/dashboard/courses/${courseId}`);
        }
      } else {
        toast.error('Failed to create sections');
      }
    } catch (error) {
      console.error('Error creating sections:', error);
      toast.error(error.formattedMessage || 'Error creating sections');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContent = (sectionId) => {
    navigate(`/add-course/content/${courseId}/${sectionId}`);
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="add-sections-container">
      <Typography variant="h4" className="page-title">
        Add Sections to Your Course
      </Typography>

      <Stepper activeStep={1} className="course-creation-stepper">
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

      <Card className="course-info-card">
        <CardContent>
          <Typography variant="h5" className="course-title">
            {course ? course.title : 'Course'}
          </Typography>
          {course && course.description && (
            <Typography variant="body2" className="course-description">
              {course.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card className="add-sections-card">
        <CardContent>
          <Box className="header-container">
            <Typography variant="h6" className="section-title">
              Course Sections
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddDialog}
              className="add-button"
            >
              Add Section
            </Button>
          </Box>

          {sections.length === 0 ? (
            <Box className="empty-state">
              <Typography variant="body1" align="center">
                Your course doesn't have any sections yet. Add a section to organize your course content.
              </Typography>
            </Box>
          ) : (
            <List className="sections-list">
              {sections.map((section, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem className="section-item">
                    <ListItemText
                      primary={section.title}
                      secondary={section.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditDialog(index)}
                        aria-label="edit"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteSection(index)}
                        aria-label="delete"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}

          <Box className="actions-container">
            <Button
              variant="contained"
              color="primary"
              disabled={submitting || sections.length === 0}
              onClick={handleSubmit}
              fullWidth
            >
              {submitting ? 'Saving...' : 'Save Sections & Continue'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Section Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editIndex >= 0 ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Section Title"
            fullWidth
            value={sectionData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Introduction, Basic Concepts, Advanced Techniques"
          />
          <TextField
            margin="dense"
            name="description"
            label="Section Description"
            fullWidth
            multiline
            rows={3}
            value={sectionData.description}
            onChange={handleChange}
            required
            placeholder="Briefly describe what this section covers"
            helperText="A clear description helps students understand the section's content"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveSection} color="primary" variant="contained">
            {editIndex >= 0 ? 'Update' : 'Add'} Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AddSections; 