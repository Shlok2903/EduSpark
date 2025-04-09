import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Chip,
  CircularProgress,
  Container,
  TextField,
  RadioGroup,
  Radio,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Alert,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepButton,
  Tooltip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { examService } from '../../services/api';
import Sidebar from '../common/sidebar/Sidebar';
import { handleError, handleSuccess } from '../../utils';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FlagIcon from '@mui/icons-material/Flag';
import RemoveDoneIcon from '@mui/icons-material/RemoveDone';
import DoneIcon from '@mui/icons-material/Done';
import PanToolIcon from '@mui/icons-material/PanTool';

function ExamSession() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [questionNav, setQuestionNav] = useState({
    sectionIndex: 0,
    questionIndex: 0
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const timerRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const fileInputRef = useRef(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(0);

  // Combine sections/questions into a flat array for navigation
  useEffect(() => {
    if (exam && exam.sections) {
      let flatQuestions = [];
      let questionAnswers = [];
      
      exam.sections.forEach(section => {
        section.questions.forEach(question => {
          flatQuestions.push({
            ...question,
            sectionTitle: section.title
          });
          
          // Find matching answer in attempt
          const answer = attempt?.answers?.find(a => a.questionId === question._id);
          questionAnswers.push(answer || {
            questionId: question._id,
            answerText: '',
            selectedOption: null,
            fileUrl: null,
            status: 'not-answered'
          });
        });
      });
      
      setQuestions(flatQuestions);
      setAnswers(questionAnswers);
      setCurrentQuestion(flatQuestions[activeQuestion]);
      setCurrentAnswer(questionAnswers[activeQuestion]);
    }
  }, [exam, attempt, activeQuestion]);

  // Handle timer
  useEffect(() => {
    const updateTimer = () => {
      if (!attempt || !attempt.endTime) return;
      
      const now = new Date();
      const endTime = new Date(attempt.endTime);
      const diff = endTime - now;
      
      if (diff <= 0) {
        // Time's up - submit the exam
        clearInterval(timerRef.current);
        setTimeLeft(0);
        handleAutoSubmit();
      } else {
        setTimeLeft(diff);
      }
    };
    
    if (attempt) {
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [attempt]);

  useEffect(() => {
    const fetchExamAttempt = async () => {
      setLoading(true);
      try {
        const response = await examService.getExamAttempt(attemptId);
        if (response) {
          setAttempt(response);
          
          // Also fetch the exam details
          if (response.examId) {
            const examData = await examService.getExamById(response.examId);
            setExam(examData);
          }
        }
      } catch (error) {
        console.error('Error fetching exam attempt:', error);
        setError('Failed to load exam. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAttempt();
  }, [attemptId]);

  const handleAutoSubmit = async () => {
    try {
      setSubmitting(true);
      await examService.submitExam(attemptId);
      handleSuccess('Exam submitted due to time expiration.');
      navigate('/exams');
    } catch (error) {
      console.error('Error auto-submitting exam:', error);
      handleError('Failed to submit exam automatically. Please try manual submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAnswer = async (navigate = false) => {
    if (!currentQuestion || savingAnswer) return;
    
    setSavingAnswer(true);
    try {
      let answerData;
      
      if (currentQuestion.type === 'mcq') {
        answerData = {
          questionId: currentQuestion._id,
          selectedOption: currentAnswer?.selectedOption || null,
          status: currentAnswer?.selectedOption ? 'answered' : 'not-answered'
        };
      } else if (currentQuestion.type === 'subjective') {
        answerData = {
          questionId: currentQuestion._id,
          answerText: currentAnswer?.answerText || '',
          status: currentAnswer?.answerText?.trim() ? 'answered' : 'not-answered'
        };
      } else if (currentQuestion.type === 'file-upload') {
        // For file uploads, we need to handle the file separately
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const uploadResponse = await examService.uploadExamFile(attemptId, currentQuestion._id, formData);
          
          answerData = {
            questionId: currentQuestion._id,
            fileUrl: uploadResponse.fileUrl,
            status: 'answered'
          };
          
          setSelectedFile(null);
        } else {
          answerData = {
            questionId: currentQuestion._id,
            status: currentAnswer?.fileUrl ? 'answered' : 'not-answered'
          };
        }
      }
      
      if (answerData) {
        const response = await examService.saveAnswer(attemptId, answerData);
        
        // Update local answers state
        const updatedAnswers = [...answers];
        updatedAnswers[activeQuestion] = {
          ...updatedAnswers[activeQuestion],
          ...answerData
        };
        setAnswers(updatedAnswers);
        
        // Also update attempt with latest data
        if (response && response.answers) {
          setAttempt(prev => ({
            ...prev,
            answers: response.answers
          }));
        }
      }
      
      // If navigate is true, move to next question
      if (navigate && activeQuestion < questions.length - 1) {
        setActiveQuestion(activeQuestion + 1);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      handleError('Failed to save your answer. Please try again.');
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleOptionChange = (optionId) => {
    setCurrentAnswer(prev => ({
      ...prev,
      selectedOption: optionId,
      status: 'answered'
    }));
  };

  const handleTextChange = (e) => {
    setCurrentAnswer(prev => ({
      ...prev,
      answerText: e.target.value,
      status: e.target.value.trim() ? 'answered' : 'not-answered'
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleMarkForReview = () => {
    setCurrentAnswer(prev => ({
      ...prev,
      status: 'marked-for-review'
    }));
    
    // Save the status change
    handleSaveAnswer();
  };

  const handleClearAnswer = () => {
    if (currentQuestion.type === 'mcq') {
      setCurrentAnswer(prev => ({
        ...prev,
        selectedOption: null,
        status: 'not-answered'
      }));
    } else if (currentQuestion.type === 'subjective') {
      setCurrentAnswer(prev => ({
        ...prev,
        answerText: '',
        status: 'not-answered'
      }));
    } else if (currentQuestion.type === 'file-upload') {
      setSelectedFile(null);
      setCurrentAnswer(prev => ({
        ...prev,
        fileUrl: null,
        status: 'not-answered'
      }));
    }
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      await examService.submitExam(attemptId);
      handleSuccess('Exam submitted successfully!');
      navigate('/exams');
    } catch (error) {
      console.error('Error submitting exam:', error);
      handleError('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  };

  const handleNavigation = (index) => {
    // Save current answer before navigating
    handleSaveAnswer();
    setActiveQuestion(index);
  };

  const formatTime = (ms) => {
    if (ms === null) return '--:--:--';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAnswerStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return '#4CAF50'; // green
      case 'marked-for-review':
        return '#FFC107'; // amber
      case 'not-answered':
      default:
        return '#F44336'; // red
    }
  };

  const getAnswerStatusText = (status) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'marked-for-review':
        return 'Marked for Review';
      case 'not-answered':
      default:
        return 'Not Answered';
    }
  };

  const getAnswerStatusIcon = (status) => {
    switch (status) {
      case 'answered':
        return <DoneIcon />;
      case 'marked-for-review':
        return <FlagIcon />;
      case 'not-answered':
      default:
        return <RemoveDoneIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Alert severity="error">{error}</Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/exams')}
            sx={{ mt: 2 }}
          >
            Back to Exams
          </Button>
        </Box>
      </Box>
    );
  }

  if (!exam || !attempt) {
    return (
      <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
        <Sidebar />
        <Box sx={{ p: 3, flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Alert severity="error">Exam not found or has already been submitted.</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" sx={{ height: '100vh' }}>
      {/* Exam Header with timer */}
      <Box 
        sx={{ 
          px: 3, 
          py: 1, 
          backgroundColor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6">{exam.title}</Typography>
        
        <Box display="flex" alignItems="center">
          <AccessTimeIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
            {formatTime(timeLeft)}
          </Typography>
        </Box>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Question Navigation Sidebar */}
        <Box 
          sx={{ 
            width: 250, 
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowY: 'auto',
            p: 2
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Question Navigator
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {getAnswerStatusText(currentAnswer?.status || 'not-answered')}
            </Typography>
            <LinearProgress 
              variant="determinate"
              value={(answers.filter(a => a.status === 'answered').length / questions.length) * 100}
              sx={{ mt: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {questions.map((q, index) => (
              <Tooltip 
                title={`${q.sectionTitle} - ${getAnswerStatusText(answers[index]?.status || 'not-answered')}`} 
                key={index}
              >
                <Button
                  variant={activeQuestion === index ? 'contained' : 'outlined'}
                  onClick={() => handleNavigation(index)}
                  sx={{ 
                    minWidth: 0,
                    borderColor: getAnswerStatusColor(answers[index]?.status || 'not-answered'),
                    color: activeQuestion === index ? 'white' : getAnswerStatusColor(answers[index]?.status || 'not-answered'),
                    backgroundColor: activeQuestion === index ? 
                      getAnswerStatusColor(answers[index]?.status || 'not-answered') : 
                      'transparent'
                  }}
                >
                  {index + 1}
                </Button>
              </Tooltip>
            ))}
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              startIcon={<CheckCircleIcon />}
            >
              Submit Exam
            </Button>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>Legend:</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: getAnswerStatusColor('answered'), 
                  borderRadius: '50%', 
                  mr: 1 
                }} />
                <Typography variant="caption">Answered</Typography>
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: getAnswerStatusColor('marked-for-review'), 
                  borderRadius: '50%', 
                  mr: 1 
                }} />
                <Typography variant="caption">Marked for Review</Typography>
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: getAnswerStatusColor('not-answered'), 
                  borderRadius: '50%', 
                  mr: 1 
                }} />
                <Typography variant="caption">Not Answered</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Question and Answer Area */}
        <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
          {currentQuestion && (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div">
                      Question {activeQuestion + 1} of {questions.length}
                    </Typography>
                    <Chip 
                      label={`${currentQuestion.marks} ${currentQuestion.marks === 1 ? 'mark' : 'marks'}`}
                      color="primary"
                    />
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    {currentQuestion.questionText}
                  </Typography>
                  
                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup 
                        value={currentAnswer?.selectedOption || ''}
                        onChange={(e) => handleOptionChange(e.target.value)}
                      >
                        {currentQuestion.options.map((option, index) => (
                          <FormControlLabel
                            key={option._id || index}
                            value={option._id || index.toString()}
                            control={<Radio />}
                            label={option.text}
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                  
                  {currentQuestion.type === 'subjective' && (
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      variant="outlined"
                      placeholder="Type your answer here..."
                      value={currentAnswer?.answerText || ''}
                      onChange={handleTextChange}
                    />
                  )}
                  
                  {currentQuestion.type === 'file-upload' && (
                    <Box>
                      {currentAnswer?.fileUrl ? (
                        <Box>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            File uploaded successfully!
                          </Alert>
                          <Box display="flex" alignItems="center">
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={handleClearAnswer}
                              sx={{ mr: 2 }}
                            >
                              Remove File
                            </Button>
                            <Typography variant="body2">
                              {currentAnswer.fileUrl.split('/').pop()}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <input
                            accept={
                              currentQuestion.fileType === 'image' ? 'image/*' : 
                              currentQuestion.fileType === 'pdf' ? 'application/pdf' : 
                              currentQuestion.fileType === 'code' ? '.js,.py,.java,.cpp,.c,.html,.css,.php' : 
                              '*'
                            }
                            type="file"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-upload"
                            ref={fileInputRef}
                          />
                          <Box display="flex" alignItems="center" flexWrap="wrap">
                            <Button
                              variant="contained"
                              component="label"
                              htmlFor="file-upload"
                              startIcon={<UploadFileIcon />}
                              sx={{ mr: 2, mb: 1 }}
                            >
                              Choose File
                            </Button>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {selectedFile ? selectedFile.name : 'No file selected'}
                            </Typography>
                          </Box>
                          
                          {selectedFile && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleSaveAnswer()}
                              sx={{ mt: 2 }}
                              disabled={savingAnswer}
                            >
                              {savingAnswer ? 'Uploading...' : 'Upload File'}
                            </Button>
                          )}
                          
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Allowed file type: {
                              currentQuestion.fileType === 'image' ? 'Images (JPG, PNG, etc.)' : 
                              currentQuestion.fileType === 'pdf' ? 'PDF documents' : 
                              currentQuestion.fileType === 'code' ? 'Code files (JS, PY, JAVA, etc.)' : 
                              'Any file'
                            }
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBeforeIcon />}
                    onClick={() => handleNavigation(Math.max(0, activeQuestion - 1))}
                    disabled={activeQuestion === 0}
                    sx={{ mr: 2 }}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    variant="outlined"
                    endIcon={<NavigateNextIcon />}
                    onClick={() => {
                      handleSaveAnswer(true);
                    }}
                    disabled={activeQuestion === questions.length - 1}
                  >
                    Next
                  </Button>
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<FlagIcon />}
                    onClick={handleMarkForReview}
                    sx={{ mr: 2 }}
                  >
                    Mark for Review
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSaveAnswer()}
                    disabled={savingAnswer}
                  >
                    {savingAnswer ? 'Saving...' : 'Save Answer'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
      
      {/* Confirmation Dialogs */}
      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
      >
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your exam? This action cannot be undone.
          </DialogContentText>
          {answers.filter(a => a.status !== 'answered').length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have {answers.filter(a => a.status === 'not-answered').length} unanswered questions and {answers.filter(a => a.status === 'marked-for-review').length} questions marked for review.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)} disabled={submitting}>Cancel</Button>
          <Button 
            onClick={handleSubmitExam} 
            color="primary"
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Confirm Submit'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
      >
        <DialogTitle>Leave Exam?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave the exam? Your progress will be saved, but you won't be able to return if the exam time expires.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmExit(false)}>Cancel</Button>
          <Button 
            onClick={() => navigate('/exams')} 
            color="error"
          >
            Leave Exam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExamSession; 