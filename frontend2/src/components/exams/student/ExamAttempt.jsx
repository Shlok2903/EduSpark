import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton
} from '@mui/material';
import {
  Timer as TimerIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Check as SubmitIcon,
  Warning as WarningIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import './ExamAttempt.css';

const ExamAttempt = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [fileUploads, setFileUploads] = useState({});
  
  // Format time for display (mm:ss)
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle file upload
  const handleFileUpload = (questionId, file) => {
    if (!file) {
      toast.error('No file selected');
      return;
    }
    
    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }
    
    // Get file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt', 'zip', 'rar'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.warning(`File type .${fileExtension} may not be supported. Allowed types: ${allowedExtensions.join(', ')}`);
    }
    
    console.log(`Uploading file for question ${questionId}:`, {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + 'KB',
      type: file.type
    });
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        file: file,
        fileName: file.name,
        fileSize: file.size,
        type: 'fileUpload'
      }
    }));
    
    toast.success(`File "${file.name}" selected for upload. Don't forget to submit your exam when finished.`);
  };
  
  const removeUploadedFile = (questionId) => {
    setAnswers(prev => {
      const updated = { ...prev };
      if (updated[questionId]) {
        delete updated[questionId].file;
        delete updated[questionId].fileName;
        delete updated[questionId].fileSize;
      }
      return updated;
    });
  };
  
  // Submit answers function
  const submitExam = useCallback(async (isAutoSubmit = false) => {
    try {
      if (isAutoSubmit) {
        setAutoSubmitting(true);
      } else {
        setSubmitting(true);
      }
      
      // Check if any answers have file uploads
      const hasFileUploads = Object.values(answers).some(answer => answer.file);
      
      if (hasFileUploads) {
        console.log("Submitting exam with file uploads");
        const formData = new FormData();
        formData.append('examId', examId);
        
        // Add each answer to the formData
        Object.entries(answers).forEach(([questionId, answer]) => {
          formData.append(`answers[${questionId}][questionId]`, questionId);
          formData.append(`answers[${questionId}][answer]`, answer.answer || '');
          formData.append(`answers[${questionId}][type]`, answer.type || 'text');
          
          // Add file if it exists
          if (answer.file) {
            console.log(`Adding file for question ${questionId}:`, answer.file.name);
            formData.append(`files[${questionId}]`, answer.file);
          }
        });
        
        try {
          const response = await examService.submitExamAttemptWithFiles(formData);
          
          if (response.success) {
            toast.success('Exam submitted successfully');
            if (response.data && response.data.attemptId) {
              navigate(`/exams/result/${response.data.attemptId}`);
            } else {
              navigate('/exams');
            }
          } else {
            toast.error(response.message || 'Failed to submit exam');
            setError(response.message || 'Failed to submit exam');
            setSubmitting(false);
            setAutoSubmitting(false);
          }
        } catch (err) {
          console.error("Error in file upload submission:", err);
          toast.error('Failed to upload files. Please try again.');
          setSubmitting(false);
          setAutoSubmitting(false);
        }
      } else {
        // No files, use regular submit
      const payload = {
        examId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer: answer.answer,
          type: answer.type
        }))
      };
      
      const response = await examService.submitExamAttempt(payload);
      
      if (response.success) {
        toast.success('Exam submitted successfully');
        if (response.data && response.data.attemptId) {
          navigate(`/exams/result/${response.data.attemptId}`);
        } else {
          navigate('/exams');
        }
      } else {
        toast.error(response.message || 'Failed to submit exam');
        setError(response.message || 'Failed to submit exam');
        setSubmitting(false);
          setAutoSubmitting(false);
        }
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
      toast.error('Failed to submit exam. Please try again.');
      setError('Failed to submit exam. Please try again.');
      setSubmitting(false);
      setAutoSubmitting(false);
    }
  }, [examId, answers, navigate]);
  
  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !autoSubmitting) {
      toast.warning('Time expired! Submitting your exam...');
      submitExam(true);
    }
  }, [timeLeft, submitExam, autoSubmitting]);
  
  // Initialize exam attempt and fetch questions
  useEffect(() => {
    const initExamAttempt = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Start exam attempt
        const attemptResponse = await examService.startExamAttempt(examId);
        
        if (!attemptResponse.success) {
          setError(attemptResponse.message || 'Failed to start exam attempt');
          return;
        }
        
        const attemptData = attemptResponse.data;
        setExam(attemptData.exam);
        
        // Make sure questions are properly formatted
        let processedQuestions = attemptData.questions || [];
        
        // Log questions for debugging
        console.log("Questions from API:", processedQuestions);
        
        // Process questions if needed
        processedQuestions = processedQuestions.map(q => {
          // Ensure question has text property (might be under question property)
          const questionText = q.text || q.question || "Question text not available";
          
          // Make sure MCQ options are correctly formatted
          let processedOptions = [];
          if (q.type === 'mcq' && q.options) {
            // Options could be an array of objects with text property or just strings
            processedOptions = q.options.map(opt => {
              if (typeof opt === 'string') return { text: opt };
              return opt; // Assume it's already an object with text property
            });
          }
          
          return {
            ...q,
            text: questionText,
            question: questionText,
            options: processedOptions
          };
        });
        
        setQuestions(processedQuestions);
        setStartTime(new Date(attemptData.startTime));
        
        // Initialize answers object
        const initialAnswers = {};
        processedQuestions.forEach(question => {
          initialAnswers[question._id] = { 
            answer: '',
            type: question.type
          };
        });
        setAnswers(initialAnswers);
        
        // Calculate time left based on start time and duration
        const now = new Date();
        const examStartTime = new Date(attemptData.startTime);
        const durationInSeconds = attemptData.exam.duration * 60;
        const elapsedSeconds = Math.floor((now - examStartTime) / 1000);
        const remainingSeconds = Math.max(0, durationInSeconds - elapsedSeconds);
        
        setTimeLeft(remainingSeconds);
      } catch (err) {
        console.error('Error initializing exam attempt:', err);
        setError('Failed to start exam. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initExamAttempt();
  }, [examId]);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || autoSubmitting || submitting) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, autoSubmitting, submitting]);
  
  // Handle answer change
  const handleAnswerChange = (questionId, value, type = 'text') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { 
        ...prev[questionId],
        answer: value, 
        type 
      }
    }));
  };
  
  // Navigate to next/previous question
  const navigateQuestions = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Save progress periodically
  useEffect(() => {
    if (!exam || Object.keys(answers).length === 0) return;
    
    const saveProgress = async () => {
      try {
        const payload = {
          examId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer: answer.answer,
            type: answer.type
          }))
        };
        
        await examService.saveExamProgress(payload);
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    };
    
    const saveInterval = setInterval(saveProgress, 30000); // Save every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [examId, answers, exam]);
  
  // Render current question
  const renderQuestion = () => {
    if (!questions.length) return null;
    
    const question = questions[currentQuestionIndex];
    if (!question) return null;
    
    return (
      <Card className="question-card" elevation={3}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            {question.text || question.question}
          </Typography>
          
          {question.type === 'mcq' && (
            <FormControl component="fieldset" className="question-options">
              <RadioGroup
                value={answers[question._id]?.answer || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value, 'mcq')}
              >
                {Array.isArray(question.options) && question.options.map((option, idx) => (
                  <FormControlLabel
                    key={idx}
                    value={option.text || option}
                    control={<Radio />}
                    label={option.text || option}
                    className="question-option"
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          
          {question.type === 'subjective' && (
            <TextField
              fullWidth
              label="Your Answer"
              variant="outlined"
              multiline
              rows={4}
              value={answers[question._id]?.answer || ''}
              onChange={(e) => handleAnswerChange(question._id, e.target.value, 'subjective')}
              className="subjective-answer-field"
            />
          )}
          
          {question.type === 'fileUpload' && (
            <Box className="file-upload-container">
              <Typography variant="body1" fontWeight="500" gutterBottom>
                File Upload Question
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload your file below. Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT, ZIP, RAR (max 10MB).
              </Typography>
              
              <Box sx={{ mt: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  className="upload-button"
                >
                  {answers[question._id]?.fileName ? 'Change File' : 'Upload File'}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => handleFileUpload(question._id, e.target.files[0])}
                  />
                </Button>
                
                {answers[question._id]?.fileName && (
                  <Box className="file-info" sx={{ mt: 2 }}>
                    <InsertDriveFileIcon />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="500">
                        {answers[question._id].fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Size: {(answers[question._id].fileSize / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => removeUploadedFile(question._id)}
                      sx={{ ml: 1 }}
                      color="error"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              
            <TextField
              fullWidth
                label="Notes (optional)"
              variant="outlined"
              multiline
                rows={3}
              value={answers[question._id]?.answer || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value, 'fileUpload')}
                placeholder="You can add any notes here to explain your submission"
            />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render question navigation buttons
  const renderQuestionNav = () => (
    <Box className="question-navigation">
      <Button
        variant="outlined"
        startIcon={<BackIcon />}
        onClick={() => navigateQuestions('prev')}
        disabled={currentQuestionIndex === 0}
      >
        Previous
      </Button>
      
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigateQuestions('next')}
        disabled={currentQuestionIndex === questions.length - 1}
      >
        Next
      </Button>
    </Box>
  );
  
  // Render question list sidebar
  const renderQuestionList = () => (
    <Paper className="question-list" elevation={2}>
      <Typography variant="h6" gutterBottom>
        Questions
      </Typography>
      <Divider />
      
      <Box className="question-list-items">
        {questions.map((q, idx) => (
          <Button
            key={idx}
            variant={currentQuestionIndex === idx ? "contained" : "outlined"}
            color={answers[q._id]?.answer ? "success" : "primary"}
            className="question-list-item"
            onClick={() => setCurrentQuestionIndex(idx)}
          >
            {idx + 1}
          </Button>
        ))}
      </Box>
    </Paper>
  );
  
  if (loading) {
    return (
      <Box className="exam-loading-container">
        <CircularProgress size={60} />
        <Typography variant="h6" mt={2}>
          Loading Exam...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box className="exam-error-container">
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Return to Exams
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="exam-attempt-container">
      {/* Header with timer */}
      <Paper className="exam-header" elevation={3}>
        <Typography variant="h5" className="exam-title">
          {exam?.title || 'Exam in Progress'}
        </Typography>
        
        <Box className="exam-timer">
          <TimerIcon color={timeLeft < 300 ? "error" : "inherit"} />
          <Typography 
            variant="h6" 
            color={timeLeft < 300 ? "error" : "inherit"}
            fontWeight={timeLeft < 300 ? "bold" : "normal"}
          >
            {formatTime(timeLeft)}
          </Typography>
        </Box>
      </Paper>
      
      {/* Main content - Questions */}
      <Box className="exam-content">
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            {renderQuestionList()}
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Box className="exam-questions-container">
              {renderQuestion()}
              {renderQuestionNav()}
              
              <Box className="exam-actions">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SubmitIcon />}
                  onClick={() => setConfirmSubmit(true)}
                  disabled={submitting || autoSubmitting}
                  className="submit-button"
                >
                  {submitting || autoSubmitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Confirm submit dialog */}
      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Confirm Submission
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your exam? You won't be able to modify your answers afterward.
          </DialogContentText>
          <Box mt={2}>
            <Typography variant="subtitle2">
              Answered: {Object.values(answers).filter(a => a.answer && a.answer.trim() !== '').length} of {questions.length} questions
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setConfirmSubmit(false);
              submitExam();
            }} 
            color="primary" 
            variant="contained"
            disabled={submitting}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamAttempt; 