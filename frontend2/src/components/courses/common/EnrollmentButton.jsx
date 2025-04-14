import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import enrollmentService from '../../../services/enrollmentService';
import { useNavigate } from 'react-router-dom';
import './EnrollmentButton.css';

const EnrollmentButton = ({ 
  courseId, 
  isEnrolled,
  onEnrollmentChange,
  variant = 'contained',
  fullWidth = true,
  showProgress = false,
  size = 'medium'
}) => {
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [checkedStatus, setCheckedStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Update local enrolled state when prop changes
    setEnrolled(isEnrolled);
  }, [isEnrolled]);

  // Check enrollment status directly from API only once
  useEffect(() => {
    // Only check if not already known to be enrolled and if we haven't checked yet
    if (!enrolled && !checkedStatus && courseId) {
      const checkEnrollmentStatus = async () => {
        try {
          setCheckedStatus(true); // Mark as checked to avoid repeated calls
          const response = await enrollmentService.getEnrollmentStatus(courseId);
          if (response && response.isEnrolled) {
            setEnrolled(true);
            if (onEnrollmentChange) {
              onEnrollmentChange(true);
            }
          }
        } catch (error) {
          console.error('Error checking enrollment status:', error);
        }
      };
      
      checkEnrollmentStatus();
    }
  }, [courseId, enrolled, onEnrollmentChange, checkedStatus]);

  const handleEnroll = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (enrolled) {
      // If already enrolled, navigate to course detail
      navigate(`/courses/${courseId}`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Call API to enroll in course
      const response = await enrollmentService.enrollCourse(courseId);
      
      if (response && response.success === false) {
        // If there's an error message from the server, alert the user
        alert(response.message || 'Error enrolling in course');
        return;
      }
      
      // Update local state
      setEnrolled(true);
      
      // Notify parent component
      if (onEnrollmentChange) {
        onEnrollmentChange(true);
      }
      
      // Navigate to course after short delay
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 500);
    } catch (error) {
      console.error('Enrollment failed:', error);
      alert(error.formattedMessage || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      onClick={handleEnroll}
      disabled={loading}
      fullWidth={fullWidth}
      size={size}
      startIcon={enrolled && !loading ? <PlayArrowIcon /> : null}
      className={`enrollment-button ${enrolled ? 'enrolled' : ''}`}
    >
      {loading ? (
        <CircularProgress size={24} color="inherit" />
      ) : enrolled ? (
        'Continue Learning'
      ) : (
        'Enroll Now'
      )}
    </Button>
  );
};

export default EnrollmentButton; 