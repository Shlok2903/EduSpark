import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Radio, RadioGroup,
  FormControlLabel, FormControl, CircularProgress, Divider, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import Sidebar from '../common/sidebar/Sidebar';
import './Practice.css';

function PracticeSession() {
  const { practiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [practice, setPractice] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Fetch practice session data
  useEffect(() => {
    const fetchPractice = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/practice/${practiceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setPractice(response.data);
        
        // Initialize answers if the practice is completed
        if (response.data.isCompleted) {
          const userAnswers = {};
          response.data.questions.forEach((question, index) => {
            if (question.userAnswer) {
              userAnswers[index] = question.userAnswer;
            }
          });
          setAnswers(userAnswers);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error fetching practice:', error);
        alert('Failed to load practice. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPractice();
  }, [practiceId]);
  
  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestion]: event.target.value
    });
  };
  
  const navigateToQuestion = (index) => {
    if (index >= 0 && index < practice.questions.length) {
      setCurrentQuestion(index);
    }
  };
  
  const handlePrevious = () => {
    navigateToQuestion(currentQuestion - 1);
  };
  
  const handleNext = () => {
    navigateToQuestion(currentQuestion + 1);
  };
  
  const openSubmitDialog = () => {
    // Check if all questions are answered
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < practice.questions.length) {
      const unanswered = practice.questions.length - answeredCount;
      if (!window.confirm(`You have ${unanswered} unanswered questions. Do you still want to submit?`)) {
        return;
      }
    }
    
    setOpenDialog(true);
  };
  
  const closeDialog = () => {
    setOpenDialog(false);
  };
  
  const submitAnswers = async () => {
    setOpenDialog(false);
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      const formattedAnswers = Object.keys(answers).map(questionIndex => ({
        questionId: practice.questions[questionIndex]._id,
        answer: answers[questionIndex]
      }));
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/practice/${practiceId}/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPractice(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting answers:', error);
      alert('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const calculateScore = () => {
    if (!practice || !practice.isCompleted) return { correct: 0, total: 0, percentage: 0 };
    
    const correct = practice.correctAnswers;
    const total = practice.numberOfQuestions;
    const percentage = Math.round((correct / total) * 100);
    
    return { correct, total, percentage };
  };
  
  if (loading) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="main-content">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
          </Box>
        </div>
      </div>
    );
  }
  
  if (!practice) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="main-content">
          <Typography variant="h5" sx={{ textAlign: 'center', mt: 4 }}>
            Practice session not found.
          </Typography>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/practice')}
            sx={{ mt: 2, display: 'block', mx: 'auto' }}
          >
            Back to Practice
          </Button>
        </div>
      </div>
    );
  }
  
  const score = calculateScore();
  
  return (
    <div className="home-container">
      <Sidebar />
      <div className="main-content">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/practice')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" className="page-title">
            {practice.title}
          </Typography>
        </Box>
        
        <Box className="content-divider" mb={3} />
        
        {showResults ? (
          // Results view
          <Box className="results-container">
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                Your Results
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  position: 'relative',
                  display: 'inline-flex',
                  width: 120,
                  height: 120,
                  mb: 2
                }}>
                  <CircularProgress
                    variant="determinate"
                    value={score.percentage}
                    size={120}
                    thickness={5}
                    sx={{ 
                      color: score.percentage >= 70 ? '#4caf50' : score.percentage >= 40 ? '#ff9800' : '#f44336',
                    }}
                  />
                  <Box sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {score.percentage}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
                You got {score.correct} out of {score.total} correct
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Button 
                variant="contained"
                onClick={() => setShowResults(false)}
                sx={{ 
                  display: 'block',
                  mx: 'auto',
                  backgroundColor: '#F3B98D', 
                  color: '#37474F',
                  '&:hover': { backgroundColor: '#f0aa75' },
                }}
              >
                Review Answers
              </Button>
            </Paper>
            
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Question Review
            </Typography>
            
            {practice.questions.map((question, index) => (
              <Paper 
                key={question._id} 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  borderLeft: '5px solid',
                  borderColor: question.isCorrect ? '#4caf50' : '#f44336'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    {index + 1}. {question.question}
                  </Typography>
                  {question.isCorrect ? (
                    <CheckCircleIcon sx={{ color: '#4caf50', ml: 1 }} />
                  ) : (
                    <CancelIcon sx={{ color: '#f44336', ml: 1 }} />
                  )}
                </Box>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup>
                    {question.options.map((option, optionIndex) => (
                      <FormControlLabel
                        key={optionIndex}
                        value={option}
                        control={
                          <Radio 
                            checked={question.userAnswer === option}
                            disabled
                            sx={{ 
                              color: 
                                question.correctAnswer === option ? '#4caf50' : 
                                question.userAnswer === option && question.userAnswer !== question.correctAnswer ? '#f44336' : 
                                undefined,
                              '&.Mui-checked': {
                                color: 
                                  question.correctAnswer === option ? '#4caf50' : 
                                  question.userAnswer === option && question.userAnswer !== question.correctAnswer ? '#f44336' : 
                                  undefined
                              }
                            }}
                          />
                        }
                        label={option}
                        sx={{
                          backgroundColor: 
                            question.correctAnswer === option ? 'rgba(76, 175, 80, 0.1)' : 
                            question.userAnswer === option && question.userAnswer !== question.correctAnswer ? 'rgba(244, 67, 54, 0.1)' : 
                            'transparent',
                          padding: 1,
                          borderRadius: 1,
                          width: '100%',
                          margin: '4px 0'
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                
                {question.userAnswer !== question.correctAnswer && (
                  <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      Correct answer: {question.correctAnswer}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
            
            <Button 
              variant="contained"
              fullWidth
              onClick={() => navigate('/practice')}
              sx={{ 
                my: 3,
                backgroundColor: '#F3B98D', 
                color: '#37474F',
                '&:hover': { backgroundColor: '#f0aa75' },
                height: '48px',
                borderRadius: '8px'
              }}
            >
              Back to Practice
            </Button>
          </Box>
        ) : (
          // Question answering view
          <Box className="question-container">
            {/* Progress indicator */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Question {currentQuestion + 1} of {practice.questions.length}
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                {practice.questions.map((_, index) => (
                  <Box 
                    key={index}
                    sx={{
                      width: `calc(100% / ${practice.questions.length})`,
                      height: 8,
                      backgroundColor: index === currentQuestion 
                        ? '#F3B98D' 
                        : answers[index] 
                          ? 'rgba(243, 185, 141, 0.5)'
                          : '#e0e0e0',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => navigateToQuestion(index)}
                  />
                ))}
              </Box>
            </Box>
            
            {/* Current question */}
            <Card className="question-card">
              <CardContent>
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                  {currentQuestion + 1}. {practice.questions[currentQuestion].question}
                </Typography>
                
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup 
                    value={answers[currentQuestion] || ''}
                    onChange={handleAnswerChange}
                  >
                    {practice.questions[currentQuestion].options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{
                          padding: 1.5,
                          borderRadius: 2,
                          border: '1px solid #e0e0e0',
                          mb: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: '#f5f5f5'
                          },
                          ...(answers[currentQuestion] === option ? {
                            backgroundColor: 'rgba(243, 185, 141, 0.2)',
                            borderColor: '#F3B98D'
                          } : {})
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
            
            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button 
                variant="outlined"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                sx={{ 
                  borderColor: '#F3B98D',
                  color: '#37474F',
                  '&:hover': { borderColor: '#f0aa75' },
                  width: '120px'
                }}
              >
                Previous
              </Button>
              
              {currentQuestion < practice.questions.length - 1 ? (
                <Button 
                  variant="contained"
                  onClick={handleNext}
                  sx={{ 
                    backgroundColor: '#F3B98D', 
                    color: '#37474F',
                    '&:hover': { backgroundColor: '#f0aa75' },
                    width: '120px'
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  variant="contained"
                  onClick={openSubmitDialog}
                  disabled={submitting}
                  sx={{ 
                    backgroundColor: '#4caf50', 
                    color: 'white',
                    '&:hover': { backgroundColor: '#3d9040' },
                    width: '120px'
                  }}
                >
                  {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit'}
                </Button>
              )}
            </Box>
            
            {/* Question navigation buttons */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Jump to question:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {practice.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestion ? 'contained' : 'outlined'}
                    onClick={() => navigateToQuestion(index)}
                    sx={{
                      minWidth: '40px',
                      height: '40px',
                      p: 0,
                      borderColor: answers[index] ? '#F3B98D' : '#e0e0e0',
                      color: index === currentQuestion ? 'white' : answers[index] ? '#F3B98D' : '#757575',
                      backgroundColor: index === currentQuestion ? '#F3B98D' : 'transparent',
                      '&:hover': {
                        backgroundColor: index === currentQuestion ? '#f0aa75' : 'rgba(243, 185, 141, 0.1)',
                        borderColor: '#F3B98D'
                      }
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Submit confirmation dialog */}
        <Dialog open={openDialog} onClose={closeDialog}>
          <DialogTitle>Submit Answers</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit your answers? You won't be able to change them after submission.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                You have answered {Object.keys(answers).length} out of {practice.questions.length} questions.
              </Typography>
              {Object.keys(answers).length < practice.questions.length && (
                <Typography variant="body2" sx={{ color: '#f44336' }}>
                  Warning: You have {practice.questions.length - Object.keys(answers).length} unanswered questions.
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={submitAnswers}
              sx={{ color: '#4caf50' }}
              autoFocus
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

export default PracticeSession; 