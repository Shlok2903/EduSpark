import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia,
  Typography, 
  Button,
  Box, 
  LinearProgress,
  ButtonGroup,
  Avatar
} from '@mui/material';
import { School, Edit, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './CourseCard.css';

const CourseCard = ({ 
  course, 
  isEnrolled = false, 
  progress = 0, 
  onEnroll,
  onManage,
  userRole = 'student',
  isCreator = false
}) => {
  const navigate = useNavigate();
  const isTutor = localStorage.getItem('isTutor') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const defaultImage = 'https://via.placeholder.com/300x200?text=Course+Image';

  const handleCourseAction = () => {
    if (userRole === 'teacher') {
      if (onManage) {
        onManage(course.id);
      } else {
        navigate(`/dashboard/courses/${course.id}`);
      }
    } else {
      // Student role
      if (isEnrolled) {
        navigate(`/courses/${course.id}`);
      } else if (onEnroll) {
        onEnroll(course.id);
      }
    }
  };

  const handleEditCourse = () => {
    navigate(`/dashboard/courses/${course.id || course._id}`);
  };

  const handleViewCourse = () => {
    navigate(`/courses/${course.id}`);
  };

  // Render the top part of the card based on whether there's an image
  const renderCardTop = () => {
    if (course.imageUrl) {
      return (
        <CardMedia
          component="img"
          height="120"
          image={course.imageUrl}
          alt={course.title}
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
            {course.title}
          </Typography>
          
          <Typography variant="body2" className="course-card-description">
            {course.description}
          </Typography>
          
          <Typography variant="body2" className="course-card-instructor">
            {course.instructor}
          </Typography>
        </div>
        
        <Box className="course-progress">
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption">Progress</Typography>
            <Typography variant="caption">{userRole === 'student' && isEnrolled ? progress : 0}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={userRole === 'student' && isEnrolled ? progress : 0} 
            className="progress-bar"
          />
        </Box>
        
        <Box className="course-card-actions">
          {userRole === 'student' ? (
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={handleCourseAction}
              startIcon={<School fontSize="small" />}
            >
              Continue Learning
            </Button>
          ) : (
            // Teacher/Tutor UI
            <>
              {isCreator || isAdmin ? (
                // Course creator or admin can fully manage the course
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={handleEditCourse}
                  startIcon={<Edit />}
                >
                  Edit Course
                </Button>
              ) : isTutor ? (
                // Tutor who didn't create the course can view and help
                <ButtonGroup variant="contained" color="primary" fullWidth>
                  <Button
                    onClick={handleViewCourse}
                    startIcon={<Visibility />}
                  >
                    View Course
                  </Button>
                  <Button
                    onClick={handleEditCourse}
                    startIcon={<Edit />}
                  >
                    Help Manage
                  </Button>
                </ButtonGroup>
              ) : (
                // Regular teacher role
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={handleCourseAction}
                  startIcon={<School fontSize="small" />}
                >
                  Continue Learning
                </Button>
              )}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CourseCard; 