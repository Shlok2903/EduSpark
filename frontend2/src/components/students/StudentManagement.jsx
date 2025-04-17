import React, { useState } from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import StudentList from './StudentList';
import AddStudentForm from './AddStudentForm';

const StudentManagement = () => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Open add student dialog
  const handleAddStudentClick = () => {
    setIsAddFormOpen(true);
  };

  // Close add student dialog
  const handleCloseAddForm = () => {
    setIsAddFormOpen(false);
  };

  // Handle successful student addition
  const handleStudentAdded = () => {
    setIsAddFormOpen(false);
    // Trigger a refresh of the student list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'transparent' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Student Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Add, view, and filter students by semester or degree.
          </Typography>
        </Paper>

        {/* Student list with filters */}
        <StudentList 
          onAddStudentClick={handleAddStudentClick} 
          refreshTrigger={refreshTrigger}
        />

        {/* Add student dialog */}
        <AddStudentForm 
          open={isAddFormOpen} 
          onClose={handleCloseAddForm} 
          onSuccess={handleStudentAdded}
        />
      </Box>
    </Container>
  );
};

export default StudentManagement; 