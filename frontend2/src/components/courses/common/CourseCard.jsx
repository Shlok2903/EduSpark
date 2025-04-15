import React from 'react';
import { 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Chip, 
  Box, 
  LinearProgress
} from '@mui/material';
import { Person, School } from '@mui/icons-material';
import './CourseCard.css';

const CourseCard = ({ 
  course = {},
  isEnrolled = false, 
  progress = 0, 
  userRole = 'student',
  action = null
}) => {
  // Use a fallback div with icon instead of remote placeholder
  const renderDefaultImage = () => (
    <Box 
      sx={{ 
        height: 180, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        color: '#757575'
      }}
    >
      <School sx={{ fontSize: 60 }} />
    </Box>
  );

  if (!course) {
    return null;
  }

  return (
    <Card className="course-card">
      {course.imageUrl ? (
        <CardMedia
          component="img"
          height="180"
          image={course.imageUrl}
          alt={(course.title) || 'Course'}
          className="course-card-media"
        />
      ) : renderDefaultImage()}
      
      <CardContent className="course-card-content">
        <Box className="course-card-tags">
          {course.category && (
            <Chip 
              label={course.category} 
              size="small" 
              className="category-tag"
            />
          )}
          {course.level && (
            <Chip 
              label={course.level} 
              size="small" 
              className="level-tag"
            />
          )}
        </Box>
        
        <Typography variant="h6" className="course-card-title">
          {course.title || 'Untitled Course'}
        </Typography>
        
        <Typography variant="body2" className="course-card-description">
          {course.description || 'No description available'}
        </Typography>
        
        {course.instructor && (
          <Typography variant="body2" className="course-card-instructor">
            <Person fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {course.instructor}
          </Typography>
        )}
        
        {userRole === 'student' && isEnrolled && (
          <Box className="course-progress">
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">Progress</Typography>
              <Typography variant="caption">{progress}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              className="progress-bar"
            />
          </Box>
        )}
        
        {action && (
          <Box className="course-card-action">
            {action}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard; 