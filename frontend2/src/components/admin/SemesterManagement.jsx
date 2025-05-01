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
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './AdminManagement.css';

// Helper to get query parameters from URL
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SemesterManagement = () => {
  const query = useQuery();
  const initialBranchId = query.get('branchId');
  
  const [semesters, setSemesters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || '');
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    branchId: initialBranchId || '',
    description: '',
    isActive: true
  });
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch semesters when branch selection changes
  useEffect(() => {
    if (selectedBranchId) {
      fetchSemestersByBranch(selectedBranchId);
    } else {
      fetchAllSemesters();
    }
  }, [selectedBranchId]);

  // Fetch branches from API
  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/branches`, {
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
      setBranchesLoading(false);
    }
  };

  // Fetch all semesters from API
  const fetchAllSemesters = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/semesters`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setSemesters(response.data.data);
      } else {
        setError('Failed to fetch semesters');
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching semesters');
    } finally {
      setLoading(false);
    }
  };

  // Fetch semesters for a specific branch
  const fetchSemestersByBranch = async (branchId) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/semesters/by-branch/${branchId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setSemesters(response.data.data);
      } else {
        setError('Failed to fetch semesters');
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching semesters');
    } finally {
      setLoading(false);
    }
  };

  // Handle branch filter change
  const handleBranchChange = (e) => {
    setSelectedBranchId(e.target.value);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    let val = name === 'isActive' ? checked : value;
    
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

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Semester name is required';
    }
    
    if (!formData.branchId) {
      errors.branchId = 'Branch is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open dialog to add new semester
  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      branchId: selectedBranchId || '',
      description: '',
      isActive: true
    });
    setFormErrors({});
    setDialogMode('add');
    setOpenDialog(true);
  };

  // Open dialog to edit semester
  const handleOpenEditDialog = (semester) => {
    setFormData({
      name: semester.name,
      branchId: semester.branchId?._id || semester.branchId,
      description: semester.description || '',
      isActive: semester.isActive
    });
    setSelectedSemesterId(semester._id);
    setFormErrors({});
    setDialogMode('edit');
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setOpenDialog(false);
    }
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (semesterId) => {
    setSelectedSemesterId(semesterId);
    setOpenDeleteDialog(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Handle form submission for add/edit
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
        // Add new semester
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/semesters`,
          formData,
          { headers }
        );
      } else {
        // Update existing semester
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/semesters/${selectedSemesterId}`,
          formData,
          { headers }
        );
      }
      
      if (response.data.success) {
        // Refresh semesters list
        if (selectedBranchId) {
          fetchSemestersByBranch(selectedBranchId);
        } else {
          fetchAllSemesters();
        }
        setOpenDialog(false);
      } else {
        setError('Failed to save semester');
      }
    } catch (err) {
      console.error('Error saving semester:', err);
      setError(err.response?.data?.message || 'An error occurred while saving semester');
    } finally {
      setIsSubmitting(false);
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
        // Refresh semesters list
        if (selectedBranchId) {
          fetchSemestersByBranch(selectedBranchId);
        } else {
          fetchAllSemesters();
        }
        setOpenDeleteDialog(false);
      } else {
        setError('Failed to delete semester');
      }
    } catch (err) {
      console.error('Error deleting semester:', err);
      setError(err.response?.data?.message || 'An error occurred while deleting semester');
    }
  };

  // Find branch name by ID
  const getBranchName = (branchId) => {
    if (!branchId) return '—';
    const branch = branches.find(b => b._id === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  return (
    <Container maxWidth="lg" className="admin-management-container">
      <Box className="page-header">
        <Box>
          <Typography variant="h4" component="h1" className="page-title">
            Semester Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage semesters for student enrollment.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Semester
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box className="content-container">
        {/* Branch Filter */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="branch-filter-label">Filter by Branch</InputLabel>
            <Select
              labelId="branch-filter-label"
              id="branch-filter"
              value={selectedBranchId}
              onChange={handleBranchChange}
              label="Filter by Branch"
              disabled={branchesLoading}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch._id} value={branch._id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : semesters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {selectedBranchId 
                      ? `No semesters found for this branch. Please add a semester.` 
                      : `No semesters found. Please add a semester.`}
                  </TableCell>
                </TableRow>
              ) : (
                semesters.map((semester) => (
                  <TableRow key={semester._id}>
                    <TableCell>{semester.name}</TableCell>
                    <TableCell>{semester.branchId?.name || getBranchName(semester.branchId)}</TableCell>
                    <TableCell>{semester.description || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={semester.isActive ? 'Active' : 'Inactive'}
                        color={semester.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(semester)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(semester._id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {dialogMode === 'add' ? 'Add New Semester' : 'Edit Semester'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl 
                fullWidth 
                margin="normal" 
                error={!!formErrors.branchId}
                disabled={isSubmitting || branchesLoading}
                required
              >
                <InputLabel id="branch-label">Branch</InputLabel>
                <Select
                  labelId="branch-label"
                  id="branchId"
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  label="Branch"
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.branchId && <FormHelperText>{formErrors.branchId}</FormHelperText>}
              </FormControl>

              <TextField
                fullWidth
                label="Semester Name"
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
                ? 'Add Semester'
                : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Semester</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this semester? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSemester} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SemesterManagement;