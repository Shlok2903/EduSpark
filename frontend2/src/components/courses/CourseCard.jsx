import React from 'react';
import { 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Box, 
  LinearProgress,
  ButtonGroup
} from '@mui/material';
import { AccessTime, Person, Edit, Visibility } from '@mui/icons-material';
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
  const defaultImage = 'https://via.placeholder.com/300x200?text=Course+Image';
  const navigate = useNavigate();
  const isTutor = localStorage.getItem('isTutor') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

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
    navigate(`/dashboard/courses/${course.id}`);
  };

  const handleViewCourse = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <Card className="course-card">
      <CardMedia
        component="img"
        height="200"
        image={course.imageUrl || defaultImage}
        alt={course.title}
        className="course-card-media"
      />
      
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
          {course.title}
        </Typography>
        
        <Typography variant="body2" className="course-card-description">
          {course.description}
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
        
        <Box className="course-card-actions">
          {userRole === 'student' ? (
            isEnrolled ? (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={handleCourseAction}
              >
                Continue Learning
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={handleCourseAction}
              >
                Enroll Now
              </Button>
            )
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
                >
                  Manage Course
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