import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  CircularProgress
} from '@mui/material';
import { studentService } from '../../services/api';

const StudentList = ({ onAddStudentClick, refreshTrigger }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    semester: '',
    branch: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    branches: []
  });

  // Fetch students and filter options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch filter options
        const filterResponse = await studentService.getFilterOptions();
        if (filterResponse.success) {
          console.log('Filter options received:', filterResponse.filters);
          setFilterOptions(filterResponse.filters);
        }

        // Fetch students with applied filters
        const params = {};
        if (filter.semester) params.semester = filter.semester;
        if (filter.branch) params.branch = filter.branch;
        
        const response = await studentService.getStudents(params);
        if (response.success) {
          console.log('Students data received:', response.students.slice(0, 2));
          setStudents(response.students);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, refreshTrigger]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prevFilter => ({
      ...prevFilter,
      [name]: value
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilter({
      semester: '',
      branch: ''
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={3}>Students</Typography>
      
      {/* Filters */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Semester"
              name="semester"
              value={filter.semester}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {filterOptions.semesters.map((semester) => (
                <MenuItem key={semester._id} value={semester._id}>
                  {semester.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Branch"
              name="branch"
              value={filter.branch}
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Branches</MenuItem>
              {filterOptions.branches.map((branch) => (
                <MenuItem key={branch._id} value={branch._id}>
                  {branch.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button 
              variant="contained" 
              onClick={onAddStudentClick}
              fullWidth
              color="primary"
            >
              Add New Student
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Student Table */}
      <Paper elevation={3}>
        <TableContainer component={Paper}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography variant="body1">No students found</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><Typography fontWeight="bold">Name</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Email</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Semester</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Branch</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Parent Name</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Parent Email</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  // Extract branch and semester names safely
                  const branchName = student.branch && typeof student.branch === 'object' 
                    ? student.branch.name 
                    : (typeof student.branch === 'string' ? student.branch : 'N/A');
                    
                  const semesterName = student.semester && typeof student.semester === 'object'
                    ? student.semester.name
                    : (typeof student.semester === 'string' ? student.semester : 'N/A');
                    
                  return (
                    <TableRow key={student._id} hover>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{semesterName}</TableCell>
                      <TableCell>{branchName}</TableCell>
                      <TableCell>{student.parentName}</TableCell>
                      <TableCell>{student.parentEmail}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StudentList; 