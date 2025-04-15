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
  if (!course) {
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
            {course.instructor || 'Unknown Instructor'}
          </Typography>
        </div>
        
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