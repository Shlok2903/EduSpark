import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel, Card, CardContent, Grid, Chip, CircularProgress, Divider, Slider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../common/sidebar/Sidebar';
import './Practice.css';

function PracticePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [practices, setPractices] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  
  // Fetch user's practice history and enrolled courses
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('jwtToken');
        
        // Fetch enrolled courses
        const coursesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/enrollments/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Enrolled courses response:', coursesResponse.data);
        
        // Make sure we have valid data for the dropdown
        if (Array.isArray(coursesResponse.data)) {
          setEnrolledCourses(coursesResponse.data);
        } else {
          console.error('Enrolled courses data is not an array:', coursesResponse.data);
          setEnrolledCourses([]);
        }
        
        // Fetch practice history
        const practicesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/practice`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPractices(practicesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };
  
  const handleDifficultyChange = (event) => {
    setDifficulty(event.target.value);
  };
  
  const handleNumberOfQuestionsChange = (event, newValue) => {
    setNumberOfQuestions(newValue);
  };
  
  const generatePractice = async () => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }
    
    setGenerating(true);
    try {
      const token = localStorage.getItem('jwtToken');
      // Get the selected course from the enrolledCourses array
      const selectedCourseObj = enrolledCourses.find(course => 
        (course.courseId?._id || course.courseId) === selectedCourse
      );
      
      console.log('Selected course for practice:', selectedCourseObj);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/practice/generate`,
        {
          courseId: selectedCourse,
          difficulty,
          numberOfQuestions
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Navigate to the practice session
      navigate(`/practice/${response.data._id}`);
    } catch (error) {
      console.error('Error generating practice:', error);
      alert('Failed to generate practice questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'hard':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };
  
  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="main-content">
        <div className="header">
          <Typography variant="h4" className="page-title">
            Practice Zone
          </Typography>
        </div>
        <Box className="content-divider" />
        
        <Box className="practice-container">
          <Grid container spacing={4}>
            {/* Left side - Create new practice */}
            <Grid item xs={12} md={5}>
              <Card className="practice-card">
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#37474F' }}>
                    Create New Practice
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Select Course</InputLabel>
                    <Select
                      value={selectedCourse}
                      onChange={handleCourseChange}
                      label="Select Course"
                    >
                      {enrolledCourses.length > 0 ? (
                        enrolledCourses.map((course) => {
                          console.log('Course item:', course);
                          // Handle different ways courseId might be structured
                          let courseId = null;
                          let courseTitle = 'Unknown Course';
                          
                          if (course.courseId) {
                            // Handle if courseId is an object with _id
                            if (typeof course.courseId === 'object' && course.courseId._id) {
                              courseId = course.courseId._id;
                              courseTitle = course.courseId.title || 'Untitled Course';
                            }
                            // Handle if courseId is a string ID
                            else if (typeof course.courseId === 'string') {
                              courseId = course.courseId;
                              courseTitle = course.title || 'Untitled Course';
                            } 
                          } else if (course._id) {
                            // Handle if the course object itself is what we need
                            courseId = course._id;
                            courseTitle = course.title || 'Untitled Course';
                          }
                          
                          console.log('Processed course:', { courseId, courseTitle });
                          
                          if (!courseId) return null;
                          
                          return (
                            <MenuItem key={courseId} value={courseId}>
                              {courseTitle}
                            </MenuItem>
                          );
                        }).filter(Boolean)
                      ) : (
                        <MenuItem disabled>No enrolled courses found</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={difficulty}
                      onChange={handleDifficultyChange}
                      label="Difficulty"
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>Number of Questions: {numberOfQuestions}</Typography>
                    <Slider
                      value={numberOfQuestions}
                      onChange={handleNumberOfQuestionsChange}
                      min={5}
                      max={50}
                      step={5}
                      marks={[
                        { value: 5, label: '5' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' }
                      ]}
                    />
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={generatePractice}
                    disabled={generating || !selectedCourse}
                    sx={{ 
                      backgroundColor: '#F3B98D', 
                      color: '#37474F',
                      '&:hover': { backgroundColor: '#f0aa75' },
                      height: '48px',
                      borderRadius: '8px'
                    }}
                  >
                    {generating ? (
                      <CircularProgress size={24} sx={{ color: '#37474F' }} />
                    ) : (
                      'Generate Practice Questions'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Right side - Practice history */}
            <Grid item xs={12} md={7}>
              <Card className="practice-card">
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#37474F' }}>
                    Practice History
                  </Typography>
                  
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : practices.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', p: 4, color: '#888' }}>
                      No practice sessions found. Create your first one!
                    </Typography>
                  ) : (
                    <Box className="practice-list">
                      {practices.map((practice) => (
                        <Card 
                          key={practice._id}
                          className="practice-item"
                          onClick={() => navigate(`/practice/${practice._id}`)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {practice.title}
                              </Typography>
                              <Chip 
                                label={practice.difficulty}
                                sx={{ 
                                  backgroundColor: getDifficultyColor(practice.difficulty),
                                  color: 'white',
                                  fontWeight: 500
                                }}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                              {practice.courseId?.title || 'Unknown Course'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#888' }}>
                                Created: {formatDate(practice.createdAt)}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {practice.isCompleted ? (
                                  <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                                    Score: {practice.correctAnswers}/{practice.numberOfQuestions}
                                  </Typography>
                                ) : (
                                  <Chip label="Not Completed" size="small" />
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
}

export default PracticePage; 