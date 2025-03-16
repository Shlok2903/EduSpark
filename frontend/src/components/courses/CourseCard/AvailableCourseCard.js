import React, { useState } from 'react';
import { Typography, Button, CircularProgress, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { handleError, handleSuccess } from '../../../utils';
import { courseService } from '../../../services/api';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import './CourseCard.css';

function AvailableCourseCard({ id, title, tutor, optional, image, isAdmin, isTutor, isCreator }) {
    const [enrolling, setEnrolling] = useState(false);
    const navigate = useNavigate();
    
    // Check if user can edit this course (admin, tutor who created the course)
    const canEdit = isAdmin || (isTutor && isCreator);
    
    const handleEnroll = async () => {
        if (!id) {
            handleError('Course ID not available. Cannot enroll.');
            return;
        }
        
        setEnrolling(true);
        
        try {
            // In a real implementation, you would implement an actual enrollment API
            const response = await courseService.enrollInCourse(id);
            
            if (response.success) {
                handleSuccess('Successfully enrolled in the course');
                
                // In a real application, this might refresh the enrolled courses
                // or navigate to the course details page
                setTimeout(() => {
                    navigate(`/courses/${id}`);
                }, 1500);
            } else {
                handleError(response.message || 'Failed to enroll in the course');
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            handleError(error.formattedMessage || 'Failed to enroll in the course. Please try again.');
        } finally {
            setEnrolling(false);
        }
    };
    
    const handleViewCourse = () => {
        navigate(`/courses/${id}`);
    };
    
    const handleEditCourse = (e) => {
        e.stopPropagation();
        navigate(`/courses/${id}`);
    };
    
    return (
        <div className="course-card" onClick={handleViewCourse}>
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
            </div>
            <div className="course-details">
                <Typography variant="h6" className="course-title">{title}</Typography>
                <Typography variant="body2" className="course-tutor">Tutor: {tutor}</Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {canEdit ? (
                        // Admin/creator buttons
                        <Button 
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleEditCourse}
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
                    ) : (
                        // Regular user buttons
                        <>
                            <Button 
                                variant="outlined" 
                                startIcon={<PlayArrowIcon />}
                                onClick={handleViewCourse}
                                sx={{ 
                                    flex: 1,
                                    borderColor: '#37474F', 
                                    color: '#37474F', 
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontFamily: 'Nortica-Medium, sans-serif',
                                    '&:hover': {
                                        backgroundColor: 'rgba(55, 71, 79, 0.04)',
                                        borderColor: '#263238'
                                    }
                                }}
                            >
                                View
                            </Button>
                            <Button 
                                variant="contained" 
                                disabled={enrolling}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnroll();
                                }}
                                sx={{ 
                                    flex: 1,
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
                                {enrolling ? <CircularProgress size={24} color="inherit" /> : 'Enroll'}
                            </Button>
                        </>
                    )}
                </Box>
            </div>
        </div>
    );
}

export default AvailableCourseCard; 