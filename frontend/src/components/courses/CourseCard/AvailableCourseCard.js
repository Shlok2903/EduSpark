import React, { useState, useEffect } from 'react';
import { Typography, Button, CircularProgress, Box, Chip, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../../../utils';
import { courseService, enrollmentService } from '../../../services/api';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './CourseCard.css';

function AvailableCourseCard({ id, title, tutor, optional, image, isAdmin, isTutor, isCreator }) {
    const [enrollmentState, setEnrollmentState] = useState({
        loading: true,
        enrolling: false,
        isEnrolled: false,
        progress: 0
    });
    const navigate = useNavigate();
    
    // Check if user can edit this course (admin, tutor who created the course)
    const canEdit = isAdmin || (isTutor && isCreator);
    
    // Check enrollment status on component mount
    useEffect(() => {
        const checkEnrollmentStatus = async () => {
            if (!id) return;
            
            // If user is a creator or admin, we don't need to check enrollment
            if (canEdit) {
                setEnrollmentState({
                    loading: false,
                    enrolling: false,
                    isEnrolled: true, // Treat as enrolled so they can access without enrolling
                    progress: 100
                });
                return;
            }
            
            try {
                const response = await enrollmentService.getEnrollmentStatus(id);
                setEnrollmentState({
                    loading: false,
                    enrolling: false,
                    isEnrolled: response.isEnrolled || false,
                    progress: response.progress || 0
                });
            } catch (error) {
                console.error('Error checking enrollment status:', error);
                setEnrollmentState({
                    loading: false,
                    enrolling: false,
                    isEnrolled: false,
                    progress: 0
                });
            }
        };
        
        checkEnrollmentStatus();
    }, [id, canEdit]);
    
    const handleEnroll = async (e) => {
        e.stopPropagation(); // Prevent card click from navigating
        
        if (!id) {
            handleError('Course ID not available. Cannot enroll.');
            return;
        }
        
        setEnrollmentState(prev => ({ ...prev, enrolling: true }));
        
        try {
            await enrollmentService.enrollCourse(id);
            
            handleSuccess('Successfully enrolled in the course');
            
            setEnrollmentState({
                loading: false,
                enrolling: false,
                isEnrolled: true,
                progress: 0
            });
            
            // Navigate to course details page after short delay
            setTimeout(() => {
                navigate(`/courses/${id}`);
            }, 1000);
        } catch (error) {
            console.error('Enrollment error:', error);
            handleError(error.formattedMessage || 'Failed to enroll in the course. Please try again.');
            setEnrollmentState(prev => ({ ...prev, enrolling: false }));
        }
    };
    
    const handleCardClick = (e) => {
        // If already enrolled or is creator, navigate to course details
        if (enrollmentState.isEnrolled || canEdit) {
            navigate(`/courses/${id}`);
        } 
        // Otherwise, enroll in the course
        else {
            handleEnroll(e);
        }
    };
    
    const handleManageCourse = (e) => {
        e.stopPropagation(); // Prevent card click from navigating
        navigate(`/courses/${id}`);
    };
    
    const renderButtons = () => {
        // If user is a creator or admin, show manage course button
        if (canEdit) {
            return (
                <Button 
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleManageCourse}
                    fullWidth
                    sx={{ 
                        backgroundColor: '#FDC886',
                        color: '#37474F', 
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontFamily: 'Nortica-Medium, sans-serif',
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: '#efb56c',
                            boxShadow: 'none'
                        }
                    }}
                >
                    Manage Course
                </Button>
            );
        }
        
        // If user is enrolled, show progress and continue learning button
        if (enrollmentState.isEnrolled) {
            return (
                <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                            Progress: {enrollmentState.progress}%
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={enrollmentState.progress} 
                        sx={{ mb: 1, height: 6, borderRadius: 3 }}
                    />
                    <Button 
                        variant="contained" 
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            // Navigate directly without making any API calls beforehand
                            navigate(`/courses/${id}`);
                        }}
                        fullWidth
                        sx={{ 
                            backgroundColor: '#37474F', 
                            color: 'white', 
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontFamily: 'Nortica-Medium, sans-serif',
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: '#263238',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        Continue Learning
                    </Button>
                </Box>
            );
        }
        
        // For non-enrolled users, show only the Enroll button
        return (
            <Button 
                variant="contained" 
                disabled={enrollmentState.enrolling}
                onClick={handleEnroll}
                fullWidth
                sx={{ 
                    backgroundColor: '#37474F', 
                    color: 'white', 
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontFamily: 'Nortica-Medium, sans-serif',
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: '#263238',
                        boxShadow: 'none'
                    }
                }}
            >
                {enrollmentState.enrolling ? <CircularProgress size={24} color="inherit" /> : 'Enroll'}
            </Button>
        );
    };
    
    return (
        <div className="course-card" onClick={handleCardClick}>
            <div className="course-image">
                <img src={image} alt={title} />
                {optional ? (
                    <Chip 
                        label="Optional" 
                        size="small"
                        sx={{ 
                            position: 'absolute', 
                            top: 10, 
                            right: 10, 
                            backgroundColor: '#FDC886',
                            color: '#37474F',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                        }}
                    />
                ) : (
                    <Chip 
                        label="Mandatory" 
                        size="small"
                        sx={{ 
                            position: 'absolute', 
                            top: 10, 
                            right: 10, 
                            backgroundColor: '#FFB74D',
                            color: '#37474F',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                        }}
                    />
                )}
                
                {enrollmentState.isEnrolled && !canEdit && (
                    <Chip 
                        label="Enrolled" 
                        size="small"
                        sx={{ 
                            position: 'absolute', 
                            top: 10, 
                            left: 10, 
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                        }}
                    />
                )}
                
                {canEdit && (
                    <Chip 
                        label="Your Course" 
                        size="small"
                        sx={{ 
                            position: 'absolute', 
                            top: 10, 
                            left: 10, 
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                        }}
                    />
                )}
            </div>
            <div className="course-details">
                <Typography variant="h6" className="course-title">{title}</Typography>
                <Typography variant="body2" className="course-tutor">Tutor: {tutor}</Typography>
                
                <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    {enrollmentState.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        renderButtons()
                    )}
                </Box>
            </div>
        </div>
    );
}

export default AvailableCourseCard; 