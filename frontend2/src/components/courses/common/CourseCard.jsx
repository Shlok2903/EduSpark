import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia,
  Typography, 
  Box, 
  LinearProgress,
  Avatar
} from '@mui/material';
import { School } from '@mui/icons-material';
import './CourseCard.css';

const CourseCard = ({ 
  course = {},
  isEnrolled = false, 
  progress = 0, 
  userRole = 'student',
  action = null
}) => {
  // Add debug logging
  console.log('CourseCard received:', { course, userRole });
  
  if (!course) {
    console.warn('CourseCard received null course');
    return null;
  }

  // Render the top part of the card based on whether there's an image
  const renderCardTop = () => {
    if (course.imageUrl) {
      return (
        <CardMedia
          component="img"
          height="120"
          image={course.imageUrl}
          alt={course.title || 'Course'}
          className="course-card-media"
        />
      );
    } else {
      return (
        <div className="course-card-top">
          <Avatar className="course-icon">
            <School />
          </Avatar>
        </div>
      );
    }
  };

  // Get instructor name from various possible formats
  const getInstructorName = () => {
    if (course.instructor) return course.instructor;
    if (course.createdBy?.name) return course.createdBy.name;
    
    // Handle different property names that might contain instructor info
    const possibleProps = ['teacher', 'tutor', 'author', 'createdBy'];
    for (const prop of possibleProps) {
      if (course[prop]?.name) return course[prop].name;
      if (typeof course[prop] === 'string') return course[prop];
    }
    
    return 'Unknown Instructor';
  };

  return (
    <Card className="course-card">
      {renderCardTop()}
      
      <CardContent className="course-card-content">
        <div className="course-card-info">
          <Typography variant="h6" className="course-card-title">
            {course.title || 'Untitled Course'}
          </Typography>
          
          <Typography variant="body2" className="course-card-description">
            {course.description || 'No description available'}
          </Typography>
          
          <Typography variant="body2" className="course-card-instructor">
            {getInstructorName()}
          </Typography>
        </div>
        
        {userRole === 'student' && (
          <Box className="course-progress">
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">Progress</Typography>
              <Typography variant="caption">{isEnrolled ? progress : 0}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={isEnrolled ? progress : 0} 
              className="progress-bar"
            />
          </Box>
        )}
        
        {action && (
          <Box className="course-card-actions">
            {action}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard; 