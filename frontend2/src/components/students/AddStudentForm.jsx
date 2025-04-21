import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { studentService } from '../../services/api';
import axios from 'axios';

const AddStudentForm = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    semester: '',
    branch: '',
    parentName: '',
    parentEmail: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Fetch branches and semesters on component mount
  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  // Fetch semesters when branch selection changes
  useEffect(() => {
    if (formData.branch && open) {
      fetchSemestersByBranch(formData.branch);
    }
  }, [formData.branch, open]);

  // Fetch branches from API
  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Fetch branches
      const branchesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/branches`, { headers });
      if (branchesResponse.data.success) {
        console.log('Branches loaded:', branchesResponse.data.data);
        setBranches(branchesResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch semesters for a specific branch
  const fetchSemestersByBranch = async (branchId) => {
    if (!branchId) return;
    
    setLoadingSemesters(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Fetch semesters for selected branch
      const semestersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/semesters/by-branch/${branchId}`, { headers });
      if (semestersResponse.data.success) {
        console.log('Semesters loaded for branch:', branchId, semestersResponse.data.data);
        setSemesters(semestersResponse.data.data);
        
        // If current selected semester is not in this branch, reset it
        const validSemesterIds = semestersResponse.data.data.map(sem => sem._id);
        if (formData.semester && !validSemesterIds.includes(formData.semester)) {
          setFormData({
            ...formData,
            semester: ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    } finally {
      setLoadingSemesters(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field error on change
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.semester) newErrors.semester = 'Semester is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
    
    if (!formData.parentEmail.trim()) newErrors.parentEmail = 'Parent email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.parentEmail)) newErrors.parentEmail = 'Parent email is invalid';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Get the selected branch and semester objects for logging
      const selectedBranch = branches.find(b => b._id === formData.branch);
      const selectedSemester = semesters.find(s => s._id === formData.semester);
      
      console.log('Selected branch:', selectedBranch);
      console.log('Selected semester:', selectedSemester);
      
      // Prepare data to send to the API
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        branch: formData.branch,        // Send branch ID
        semester: formData.semester,    // Send semester ID
        parentName: formData.parentName,
        parentEmail: formData.parentEmail
      };
      
      console.log('Sending student data:', dataToSend);
      
      // Use direct axios call
      try {
        const token = localStorage.getItem('jwtToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        // API call
        const directResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/students`, 
          dataToSend,
          { headers }
        );
        
        console.log('API response:', directResponse);
        
        if (directResponse.data.success) {
          setSubmitSuccess(true);
          // Reset form after success
          setFormData({
            name: '',
            email: '',
            semester: '',
            branch: '',
            parentName: '',
            parentEmail: ''
          });
          
          // Notify parent component of success
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 1500);
          }
        }
      } catch (directError) {
        console.error('API error:', directError);
        console.error('Error response:', directError.response?.data);
        setSubmitError(directError.response?.data?.message || 'Failed to add student. Please try again.');
      }
    } catch (error) {
      console.error('Error in form submit:', error);
      setSubmitError(error.formattedMessage || 'Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Add New Student
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Student added successfully! An email has been sent with login details.
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                disabled={isSubmitting}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isSubmitting}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.branch} disabled={isSubmitting || isLoading} required>
                <InputLabel id="branch-label">Branch</InputLabel>
                <Select
                  labelId="branch-label"
                  id="branch"
                  name="branch"
                  value={formData.branch}
                onChange={handleChange}
                  label="Branch"
                >
                  {isLoading ? (
                    <MenuItem value="" disabled>
                      Loading...
                    </MenuItem>
                  ) : (
                    branches.map((branch) => (
                      <MenuItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.branch && <FormHelperText>{errors.branch}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.semester} disabled={isSubmitting || isLoading || loadingSemesters || !formData.branch} required>
                <InputLabel id="semester-label">Semester</InputLabel>
                <Select
                  labelId="semester-label"
                  id="semester"
                  name="semester"
                  value={formData.semester}
                onChange={handleChange}
                  label="Semester"
                >
                  {isLoading || loadingSemesters ? (
                    <MenuItem value="" disabled>
                      Loading...
                    </MenuItem>
                  ) : !formData.branch ? (
                    <MenuItem value="" disabled>
                      First select a branch
                    </MenuItem>
                  ) : semesters.length === 0 ? (
                    <MenuItem value="" disabled>
                      No semesters for this branch
                    </MenuItem>
                  ) : (
                    semesters.map((semester) => (
                      <MenuItem key={semester._id} value={semester._id}>
                        {semester.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.semester && <FormHelperText>{errors.semester}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Name"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                error={!!errors.parentName}
                helperText={errors.parentName}
                disabled={isSubmitting}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Email"
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
                error={!!errors.parentEmail}
                helperText={errors.parentEmail}
                disabled={isSubmitting}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleClose} 
            disabled={isSubmitting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddStudentForm; 