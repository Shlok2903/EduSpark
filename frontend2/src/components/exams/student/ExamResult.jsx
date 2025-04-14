import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import './ExamResult.css';

const ExamResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      setLoading(true);
      const response = await examService.getAttemptById(attemptId);
      
      if (response.attempt && response.exam) {
        setAttempt(response.attempt);
        setExam(response.exam);
      } else {
        toast.error('Could not load exam attempt');
      }
    } catch (error) {
      console.error('Error fetching attempt:', error);
      toast.error('Failed to load attempt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAnswerStatus = (section, answer) => {
    const question = exam.sections
      .find(s => s._id === section.sectionId)
      ?.questions
      .find(q => q._id === answer.questionId);
    
    if (!question) return null;
    
    // For MCQ questions
    if (question.type === 'mcq' && answer.selectedOption !== null) {
      const selectedOption = question.options[answer.selectedOption];
      const isCorrect = selectedOption?.isCorrect || false;
      
      return (
        <Box className={`answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <CheckIcon color="success" />
          ) : (
            <CloseIcon color="error" />
          )}
          <Typography variant="body2">
            {isCorrect ? 
              `Correct (${answer.marksAwarded}/${question.marks} marks)` : 
              `Incorrect (0/${question.marks} marks)`
            }
          </Typography>
        </Box>
      );
    }
    
    // For subjective questions
    return (
      <Box className="answer-status">
        <Typography variant="body2">
          {answer.isGraded ? 
            `Marks: ${answer.marksAwarded}/${question.marks}` : 
            'Not graded yet'
          }
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
        <Typography>Loading exam result...</Typography>
      </Box>
    );
  }

  if (!attempt || !exam) {
    return (
      <Box className="error-container">
        <Alert severity="error">
          Could not load exam result. Please try again.
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Back to Exams
        </Button>
      </Box>
    );
  }

  const isPassed = attempt.totalMarksAwarded >= exam.passingMarks;
  const totalMarks = exam.totalMarks || 0;
  const percentage = totalMarks > 0 ? Math.round((attempt.totalMarksAwarded / totalMarks) * 100) : 0;

  return (
    <Box className="exam-result-container">
      <Button 
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/exams')}
        sx={{ mb: 2 }}
      >
        Back to Exams
      </Button>
      
      <Paper className="result-header">
        <Box>
          <Typography variant="h5" className="exam-title">
            {exam.title}
          </Typography>
          <Typography variant="body1" color="textSecondary" className="course-name">
            {exam.courseId?.title || 'Unknown Course'}
          </Typography>
        </Box>
        
        <Box className="result-score">
          <Chip 
            label={isPassed ? 'Passed' : 'Failed'}
            color={isPassed ? 'success' : 'error'}
            className="result-chip"
          />
          
          <Typography variant="h5" className="score-text">
            {attempt.totalMarksAwarded}/{totalMarks} ({percentage}%)
          </Typography>
        </Box>
      </Paper>
      
      <Grid container spacing={3} className="result-content">
        <Grid item xs={12} md={4}>
          <Paper className="summary-panel">
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box className="summary-items">
              <Box className="summary-item">
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {attempt.status}
                </Typography>
              </Box>
              
              <Box className="summary-item">
                <Typography variant="body2" color="textSecondary">
                  Total Score
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {attempt.totalMarksAwarded}/{totalMarks}
                </Typography>
              </Box>
              
              <Box className="summary-item">
                <Typography variant="body2" color="textSecondary">
                  Percentage
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {percentage}%
                </Typography>
              </Box>
              
              <Box className="summary-item">
                <Typography variant="body2" color="textSecondary">
                  Passing Marks
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {exam.passingMarks}/{totalMarks}
                </Typography>
              </Box>
              
              <Box className="summary-item">
                <Typography variant="body2" color="textSecondary">
                  Submitted On
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {new Date(attempt.submittedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper className="answers-panel">
            <Typography variant="h6" gutterBottom>
              Your Answers
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {attempt.sections.map((section, sectionIndex) => {
              const examSection = exam.sections.find(s => s._id === section.sectionId);
              if (!examSection) return null;
              
              return (
                <Accordion key={sectionIndex} defaultExpanded={sectionIndex === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">
                      {examSection.title}
                    </Typography>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    {section.answers.map((answer, answerIndex) => {
                      const question = examSection.questions.find(q => q._id === answer.questionId);
                      if (!question) return null;
                      
                      return (
                        <Paper key={answerIndex} className="answer-item">
                          <Box className="question-box">
                            <Typography variant="subtitle2" className="question-number">
                              Question {answerIndex + 1}:
                            </Typography>
                            <Typography variant="body1" className="question-text">
                              {question.question}
                            </Typography>
                          </Box>
                          
                          <Box className="answer-box">
                            <Typography variant="subtitle2">
                              Your Answer:
                            </Typography>
                            
                            {question.type === 'mcq' && answer.selectedOption !== null ? (
                              <Typography variant="body1" className="answer-text">
                                {question.options[answer.selectedOption]?.text || 'No answer selected'}
                              </Typography>
                            ) : (
                              <Typography variant="body1" className="answer-text">
                                {answer.answer || 'No answer provided'}
                              </Typography>
                            )}
                          </Box>
                          
                          {renderAnswerStatus(section, answer)}
                          
                          {answer.feedback && (
                            <Box className="feedback-box">
                              <Typography variant="subtitle2">
                                Feedback:
                              </Typography>
                              <Typography variant="body2" className="feedback-text">
                                {answer.feedback}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExamResult; 