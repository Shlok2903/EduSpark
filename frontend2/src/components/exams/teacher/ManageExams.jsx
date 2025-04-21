import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as GradeIcon,
  RemoveRedEye as ViewIcon,
  Publish as PublishIcon,
  UnpublishedOutlined as UnpublishIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import courseService from '../../../services/courseService';
import './ManageExams.css';

const ManageExams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  
  // Get user role information
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchExams(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let response;
      
      // If admin, get all courses, otherwise get courses user created
      if (isAdmin) {
        response = await courseService.getAllCourses();
      } else {
        const userId = localStorage.getItem('userId');
        response = await courseService.getCoursesByTutor(userId);
      }
      
      if (response.data) {
        setCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0].id || response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Could not load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async (courseId) => {
    try {
      setLoading(true);
      const response = await examService.getExamsByCourse(courseId);
      if (response) {
        // Make sure we're setting an array to the exams state
        // Handle both direct data and response.data formats
        if (response.data) {
          setExams(Array.isArray(response.data) ? response.data : []);
        } else {
          setExams(Array.isArray(response) ? response : []);
        }
      } else {
        // Fallback to empty array if response is falsy
        setExams([]);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      toast.error('Could not load exams for this course.');
      // Always set to empty array on error to avoid map issues
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  const handleCreateExam = () => {
    navigate(`/exams/create/${selectedCourse}`);
  };

  const handleEditExam = (examId) => {
    navigate(`/exams/edit/${examId}`);
  };

  const handleViewExam = (examId) => {
    navigate(`/exams/view/${examId}`);
  };

  const handleViewAttempts = (examId) => {
    navigate(`/exams/${examId}/attempts`);
  };

  const handleDeleteConfirm = (exam) => {
    setExamToDelete(exam);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setExamToDelete(null);
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    
    try {
      await examService.deleteExam(examToDelete._id);
      toast.success('Exam deleted successfully');
      fetchExams(selectedCourse);
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    } catch (error) {
      console.error('Failed to delete exam:', error);
      toast.error('Could not delete exam. Please try again.');
    }
  };

  const handlePublishToggle = async (exam) => {
    try {
      setLoading(true);
      const newStatus = !exam.isPublished;
      await examService.publishExam(exam._id, newStatus);
      toast.success(`Exam ${newStatus ? 'published' : 'unpublished'} successfully`);
      fetchExams(selectedCourse);
    } catch (error) {
      console.error('Failed to update exam publish status:', error);
      toast.error('Could not update exam status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId || c._id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  const renderExamsTable = () => {
    if (exams.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No exams found for this course. Create your first exam!
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} className="exams-table-container">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">Title</TableCell>
              <TableCell width="20%">Duration</TableCell>
              <TableCell width="15%">Total Marks</TableCell>
              <TableCell width="15%">Status</TableCell>
              <TableCell width="20%">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam._id}>
                <TableCell>{exam.title}</TableCell>
                <TableCell>{exam.duration} minutes</TableCell>
                <TableCell>{exam.totalMarks} marks</TableCell>
                <TableCell>
                  <span className={`status-badge ${exam.isPublished ? 'published' : 'draft'}`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell>
                  <Box className="action-buttons">
                    <Tooltip title="View Exam">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewExam(exam._id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Exam">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditExam(exam._id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Attempts">
                      <IconButton
                        color="secondary"
                        onClick={() => handleViewAttempts(exam._id)}
                      >
                        <GradeIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={exam.isPublished ? "Unpublish Exam" : "Publish Exam"}>
                      <IconButton
                        color={exam.isPublished ? "warning" : "success"}
                        onClick={() => handlePublishToggle(exam)}
                      >
                        {exam.isPublished ? <UnpublishIcon /> : <PublishIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Exam">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteConfirm(exam)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box className="manage-exams-container">
      <Box className="page-header">
        <Typography variant="h4" className="page-title">
          Manage Exams
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateExam}
          disabled={!selectedCourse}
        >
          Create New Exam
        </Button>
      </Box>

      <Paper className="course-selection">
        <FormControl fullWidth>
          <InputLabel>Select Course</InputLabel>
          <Select
            value={selectedCourse}
            onChange={handleCourseChange}
            label="Select Course"
          >
            {courses.map((course) => (
              <MenuItem key={course.id || course._id} value={course.id || course._id}>
                {course.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading exams...</Typography>
        </Box>
      ) : (
        <Box className="exams-content">
          <Paper className="tabs-container">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="All Exams" />
              <Tab label="Drafts" />
              <Tab label="Published" />
            </Tabs>
          </Paper>

          {renderExamsTable()}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the exam "{examToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteExam} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageExams; 