import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true
  });
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState({});

  // Semester modal state
  const [openSemesterDialog, setOpenSemesterDialog] = useState(false);
  const [semesterFormData, setSemesterFormData] = useState({
    name: '',
    description: '',
    branchId: '',
    isActive: true
  });
  const [semesterFormErrors, setSemesterFormErrors] = useState({});
  const [isSemesterSubmitting, setIsSemesterSubmitting] = useState(false);
  const [semesterDialogMode, setSemesterDialogMode] = useState('add');
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [openSemesterDeleteDialog, setOpenSemesterDeleteDialog] = useState(false);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch branches from API
  const fetchBranches = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/branches/with-semesters`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setBranches(response.data.data);
      } else {
        setError('Failed to fetch branches');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching branches');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for branch form
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'isActive' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: val
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle input change for semester form
  const handleSemesterChange = (e) => {
    const { name, value, checked } = e.target;
    let val = name === 'isActive' ? checked : value;
    
    // Convert order to number if it's a numeric input
    if (name === 'order' && value !== '') {
      val = parseInt(value, 10);
      if (isNaN(val)) {
        val = '';
      }
    }
    
    setSemesterFormData({
      ...semesterFormData,
      [name]: val
    });
    
    // Clear error for this field
    if (semesterFormErrors[name]) {
      setSemesterFormErrors({
        ...semesterFormErrors,
        [name]: ''
      });
    }
  };

  // Validate branch form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Branch name is required';
    }
    if (!formData.code.trim()) {
      errors.code = 'Branch code is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate semester form
  const validateSemesterForm = () => {
    const errors = {};
    if (!semesterFormData.name.trim()) {
      errors.name = 'Semester name is required';
    }
    
    setSemesterFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Toggle branch expansion
  const toggleBranchExpand = (branchId) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  // Open dialog to add new branch
  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true
    });
    setFormErrors({});
    setDialogMode('add');
    setOpenDialog(true);
  };

  // Open dialog to edit branch
  const handleOpenEditDialog = (branch) => {
    setFormData({
      name: branch.name,
      code: branch.code || '',
      description: branch.description || '',
      isActive: branch.isActive
    });
    setSelectedBranchId(branch._id);
    setFormErrors({});
    setDialogMode('edit');
    setOpenDialog(true);
  };

  // Close branch dialog
  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setOpenDialog(false);
    }
  };

  // Open branch delete confirmation dialog
  const handleOpenDeleteDialog = (branchId) => {
    setSelectedBranchId(branchId);
    setOpenDeleteDialog(true);
  };

  // Close branch delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Open semester dialog to add new semester
  const handleOpenAddSemesterDialog = (branchId) => {
    setSemesterFormData({
      name: '',
      description: '',
      branchId: branchId,
      isActive: true
    });
    setSemesterFormErrors({});
    setSemesterDialogMode('add');
    setOpenSemesterDialog(true);
  };

  // Open dialog to edit semester
  const handleOpenEditSemesterDialog = (semester) => {
    setSemesterFormData({
      name: semester.name,
      branchId: semester.branchId || selectedBranchId,
      description: semester.description || '',
      isActive: semester.isActive
    });
    setSelectedSemesterId(semester._id);
    setSemesterFormErrors({});
    setSemesterDialogMode('edit');
    setOpenSemesterDialog(true);
  };

  // Close semester dialog
  const handleCloseSemesterDialog = () => {
    if (!isSemesterSubmitting) {
      setOpenSemesterDialog(false);
    }
  };

  // Open semester delete confirmation dialog
  const handleOpenSemesterDeleteDialog = (semesterId) => {
    setSelectedSemesterId(semesterId);
    setOpenSemesterDeleteDialog(true);
  };

  // Close semester delete confirmation dialog
  const handleCloseSemesterDeleteDialog = () => {
    setOpenSemesterDeleteDialog(false);
  };

  // Handle form submission for add/edit branch
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      let response;
      if (dialogMode === 'add') {
        // Add new branch
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/branches`,
          formData,
          { headers }
        );
      } else {
        // Update existing branch
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/branches/${selectedBranchId}`,
          formData,
          { headers }
        );
      }
      
      if (response.data.success) {
        fetchBranches();
        setOpenDialog(false);
      } else {
        setError('Failed to save branch');
      }
    } catch (err) {
      console.error('Error saving branch:', err);
      setError(err.response?.data?.message || 'An error occurred while saving branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle branch deletion
  const handleDeleteBranch = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/branches/${selectedBranchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        fetchBranches();
        setOpenDeleteDialog(false);
      } else {
        setError('Failed to delete branch');
      }
    } catch (err) {
      console.error('Error deleting branch:', err);
      setError(err.response?.data?.message || 'An error occurred while deleting branch');
    }
  };

  // Handle form submission for add/edit semester
  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSemesterForm()) return;
    
    setIsSemesterSubmitting(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      let response;
      if (semesterDialogMode === 'add') {
        // Add new semester
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/semesters`,
          semesterFormData,
          { headers }
        );
      } else {
        // Update existing semester
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/semesters/${selectedSemesterId}`,
          semesterFormData,
          { headers }
        );
      }
      
      if (response.data.success) {
        fetchBranches();
        setOpenSemesterDialog(false);
      } else {
        setError('Failed to save semester');
      }
    } catch (err) {
      console.error('Error saving semester:', err);
      setError(err.response?.data?.message || 'An error occurred while saving semester');
    } finally {
      setIsSemesterSubmitting(false);
    }
  };

  // Handle semester deletion
  const handleDeleteSemester = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/semesters/${selectedSemesterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        fetchBranches();
        setOpenSemesterDeleteDialog(false);
      } else {
        setError('Failed to delete semester');
      }
    } catch (err) {
      console.error('Error deleting semester:', err);
      setError(err.response?.data?.message || 'An error occurred while deleting semester');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'transparent' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              Branch Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add Branch
            </Button>
          </Box>
          <Typography variant="body1" color="textSecondary">
            Create and manage branches and their semesters for student enrollment.
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : branches.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No branches found. Please add a branch.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {branches.map((branch) => (
              <Grid item xs={12} md={6} key={branch._id}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader
                    title={branch.name}
                    action={
                      <Box display="flex">
                        <Chip
                          label={branch.isActive ? 'Active' : 'Inactive'}
                          color={branch.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => toggleBranchExpand(branch._id)}
                          aria-expanded={expandedBranches[branch._id]}
                        >
                          {expandedBranches[branch._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    }
                    subheader={
                      <>
                        <Typography variant="body2" component="span" fontWeight="medium">
                          Code: {branch.code || 'N/A'}
                        </Typography>
                        {branch.description && (
                          <>
                            <br />
                            <Typography variant="body2" component="span" color="textSecondary">
                              {branch.description}
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                  <Divider />
                  <Collapse in={expandedBranches[branch._id] || false}>
                    <Box p={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Semesters
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenAddSemesterDialog(branch._id)}
                        >
                          Add Semester
                        </Button>
                      </Box>
                      {branch.semesters && branch.semesters.length > 0 ? (
                        <List dense>
                          {branch.semesters.map((semester) => (
                            <ListItem key={semester._id} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                              <ListItemText
                                primary={semester.name}
                                secondary={semester.description || 'No description'}
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  label={semester.isActive ? 'Active' : 'Inactive'}
                                  color={semester.isActive ? 'success' : 'default'}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => {
                                    setSelectedBranchId(branch._id);
                                    handleOpenEditSemesterDialog(semester);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleOpenSemesterDeleteDialog(semester._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No semesters found for this branch.
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                    <Box>
                      <IconButton color="primary" size="small" onClick={() => handleOpenEditDialog(branch)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" size="small" onClick={() => handleOpenDeleteDialog(branch._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Button 
                      size="small" 
                      onClick={() => toggleBranchExpand(branch._id)}
                    >
                      {expandedBranches[branch._id] ? 'Hide Semesters' : 'Show Semesters'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Add/Edit Branch Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {dialogMode === 'add' ? 'Add New Branch' : 'Edit Branch'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Branch Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={isSubmitting}
                required
              />
              <TextField
                fullWidth
                label="Branch Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.code}
                helperText={formErrors.code}
                disabled={isSubmitting}
                required
              />
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
                disabled={isSubmitting}
              />
              {dialogMode === 'edit' && (
                <Box display="flex" alignItems="center" mt={2}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={formData.isActive ? 'Active' : 'Inactive'}
                    color={formData.isActive ? 'success' : 'default'}
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    icon={formData.isActive ? <CheckIcon /> : <CloseIcon />}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting
                ? 'Saving...'
                : dialogMode === 'add'
                ? 'Add Branch'
                : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Branch</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this branch? This action cannot be undone. 
            All associated semesters must be deleted or reassigned first.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteBranch} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Semester Dialog */}
      <Dialog open={openSemesterDialog} onClose={handleCloseSemesterDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSemesterSubmit}>
          <DialogTitle>
            {semesterDialogMode === 'add' ? 'Add New Semester' : 'Edit Semester'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Semester Name"
                name="name"
                value={semesterFormData.name}
                onChange={handleSemesterChange}
                margin="normal"
                error={!!semesterFormErrors.name}
                helperText={semesterFormErrors.name}
                disabled={isSemesterSubmitting}
                required
              />
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={semesterFormData.description}
                onChange={handleSemesterChange}
                margin="normal"
                multiline
                rows={3}
                disabled={isSemesterSubmitting}
              />
              {semesterDialogMode === 'edit' && (
                <Box display="flex" alignItems="center" mt={2}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={semesterFormData.isActive ? 'Active' : 'Inactive'}
                    color={semesterFormData.isActive ? 'success' : 'default'}
                    onClick={() => setSemesterFormData({ ...semesterFormData, isActive: !semesterFormData.isActive })}
                    icon={semesterFormData.isActive ? <CheckIcon /> : <CloseIcon />}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseSemesterDialog} disabled={isSemesterSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSemesterSubmitting}
              startIcon={isSemesterSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSemesterSubmitting
                ? 'Saving...'
                : semesterDialogMode === 'add'
                ? 'Add Semester'
                : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Semester Confirmation Dialog */}
      <Dialog open={openSemesterDeleteDialog} onClose={handleCloseSemesterDeleteDialog}>
        <DialogTitle>Delete Semester</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this semester? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSemesterDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSemester} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BranchManagement; 