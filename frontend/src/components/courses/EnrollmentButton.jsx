import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Typography, Box, LinearProgress } from '@mui/material';
import { enrollmentService } from '../../services/api';
import { handleError, handleSuccess } from '../../utils';

const EnrollmentButton = ({ courseId, onEnrollmentChange }) => {
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    isEnrolled: false,
    progress: 0,
    loading: true,
    error: null
  });

  // Fetch enrollment status on component mount
  useEffect(() => {
    const fetchEnrollmentStatus = async () => {
      try {
        setEnrollmentStatus(prev => ({ ...prev, loading: true, error: null }));
        const response = await enrollmentService.getEnrollmentStatus(courseId);
        
        setEnrollmentStatus({
          isEnrolled: response.isEnrolled || false,
          progress: response.progress || 0,
          enrollmentDate: response.enrollmentDate,
          loading: false,
          error: null
        });

        // Call the parent callback if it exists
        if (onEnrollmentChange && response.isEnrolled !== enrollmentStatus.isEnrolled) {
          onEnrollmentChange(response.isEnrolled || false);
        }
      } catch (error) {
        console.error('Error fetching enrollment status:', error);
        setEnrollmentStatus({
          isEnrolled: false,
          progress: 0,
          loading: false,
          error: 'Failed to load enrollment status'
        });
      }
    };

    if (courseId) {
      fetchEnrollmentStatus();
    }
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      setEnrollmentStatus(prev => ({ ...prev, loading: true, error: null }));
      
      await enrollmentService.enrollCourse(courseId);
      
      setEnrollmentStatus({
        isEnrolled: true,
        progress: 0,
        enrollmentDate: new Date(),
        loading: false,
        error: null
      });
      
      handleSuccess('Successfully enrolled in the course');
      
      // Call the parent callback if it exists
      if (onEnrollmentChange) {
        onEnrollmentChange(true);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setEnrollmentStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to enroll in the course' 
      }));
      handleError(error.formattedMessage || 'Failed to enroll in the course');
    }
  };

  if (enrollmentStatus.loading) {
    return (
      <Button variant="contained" disabled>
        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
        Loading...
      </Button>
    );
  }

  if (enrollmentStatus.isEnrolled) {
    return (
      <Box>
        <Typography variant="body2" color="textSecondary">
          Enrolled on: {new Date(enrollmentStatus.enrollmentDate).toLocaleDateString('en-GB')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Progress: {enrollmentStatus.progress}%
          </Typography>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={enrollmentStatus.progress} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Button 
      variant="contained" 
      color="primary"
      onClick={handleEnroll}
    >
      Enroll Now
    </Button>
  );
};

export default EnrollmentButton; 