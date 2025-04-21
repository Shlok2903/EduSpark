import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import examService from '../../../services/examService';
import courseService from '../../../services/courseService';
import ExamBasicInfo from './ExamBasicInfo';
import QuestionsEditor from './QuestionsEditor';
import ExamReview from './ExamReview';
import './CreateExam.css';

const steps = ['Basic Information', 'Create Questions', 'Review & Publish'];

const CreateExam = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    instructions: '',
    duration: 60,
    totalMarks: 0,
    passingMarks: 0,
    negativeMarking: false,
    isPublished: false,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default to tomorrow
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default to a week from now
    sections: [
      {
        name: 'Section 1',
        description: 'Default section',
        questions: []
      }
    ],
    courseId: courseId || '' // Initialize with courseId from URL if available
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (courseId) {
      setExamData(prev => ({
        ...prev,
        courseId
      }));
    }
  }, [courseId]);

  useEffect(() => {
    if (examData.courseId) {
      fetchCourseInfo(examData.courseId);
    }
  }, [examData.courseId]);

  const fetchCourseInfo = async (id) => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(id);
      if (response.data) {
        setCourseInfo(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch course info:', error);
      toast.error('Could not load course information');
    } finally {
      setLoading(false);
    }
  };

  const validateBasicInfo = () => {
    const basicInfoErrors = {};
    
    if (!examData.title || examData.title.trim() === '') {
      basicInfoErrors.title = 'Exam title is required';
    }
    
    if (!examData.courseId) {
      basicInfoErrors.courseId = 'Course selection is required';
    }
    
    if (!examData.duration || examData.duration <= 0) {
      basicInfoErrors.duration = 'Duration must be greater than 0';
    }
    
    if (!examData.startTime) {
      basicInfoErrors.startTime = 'Start time is required';
    }
    
    if (!examData.endTime) {
      basicInfoErrors.endTime = 'End time is required';
    } else if (examData.startTime && new Date(examData.endTime) <= new Date(examData.startTime)) {
      basicInfoErrors.endTime = 'End time must be after start time';
    }
    
    if (Object.keys(basicInfoErrors).length > 0) {
      setErrors(basicInfoErrors);
      return false;
    }
    
    return true;
  };

  const validateQuestions = () => {
    // Check if each section has at least one question
    const emptySections = examData.sections.filter(section => !section.questions || section.questions.length === 0);
    
    if (emptySections.length > 0) {
      toast.error(`Please add at least one question to each section. ${emptySections.length} section(s) are empty.`);
      return false;
    }
    
    // Check if all MCQ questions have a correct option selected and all options have text
    let isValid = true;
    let invalidQuestionCount = 0;
    
    examData.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.type === 'mcq') {
          // Check if options exist and at least one is marked as correct
          if (!question.options || question.options.length < 2) {
            isValid = false;
            invalidQuestionCount++;
          } else {
            // Check if there's a correct option
            const hasCorrectOption = question.options.some(option => 
              option.isCorrect || (question.correct_option !== undefined && 
              question.correct_option >= 0 && 
              question.correct_option < question.options.length));
              
            // Check if all options have text
            const hasEmptyOptions = question.options.some(option => !option.text || option.text.trim() === '');
            
            if (!hasCorrectOption || hasEmptyOptions) {
              isValid = false;
              invalidQuestionCount++;
            }
          }
        }
      });
    });
    
    if (!isValid) {
      toast.error(`${invalidQuestionCount} question(s) need correction. Please ensure all MCQ questions have at least 2 options with 1 correct answer and no empty options.`);
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    // Validate based on current step
    if (activeStep === 0) {
      if (!validateBasicInfo()) {
        toast.error('Please fill in all required fields correctly');
        return;
      }
    } else if (activeStep === 1) {
      if (!validateQuestions()) {
        return;
      }
    }
    
    // Proceed to next step
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleExamDataChange = (name, value) => {
    setExamData({
      ...examData,
      [name]: value
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSectionUpdate = (sections) => {
    setExamData({
      ...examData,
      sections
    });
  };

  const calculateTotalMarks = () => {
    let total = 0;
    examData.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.type === 'mcq') {
          total += Number(question.positiveMarks || question.marks || 0);
        } else {
          total += Number(question.marks || 0);
        }
      });
    });
    
    return total;
  };

  // Update total marks when sections change
  useEffect(() => {
    const total = calculateTotalMarks();
    setExamData(prevData => ({
      ...prevData,
      totalMarks: total
    }));
  }, [examData.sections]);

  const handleCreateExam = async () => {
    try {
      setSubmitting(true);
      
      // Final validation
      if (examData.passingMarks > examData.totalMarks) {
        toast.error('Passing marks cannot be greater than total marks');
        setSubmitting(false);
        return;
      }
      
      // Prepare final data for submission
      const finalExamData = {
        ...examData,
        // Ensure timestamps are in ISO format
        startTime: new Date(examData.startTime).toISOString(),
        endTime: new Date(examData.endTime).toISOString()
      };
      
      // Process MCQ questions to add correct_option field based on isCorrect flag
      finalExamData.sections = finalExamData.sections.map(section => {
        const updatedQuestions = section.questions.map(question => {
          if (question.type === 'mcq') {
            // Find the index of the correct option
            const correctOptionIndex = question.options.findIndex(option => option.isCorrect);
            
            // Make sure positiveMarks exists with marks as fallback
            const positiveMarks = Number(question.positiveMarks || question.marks || 0);
            
            return {
              ...question,
              correct_option: correctOptionIndex >= 0 ? correctOptionIndex : 0,
              positiveMarks: positiveMarks > 0 ? positiveMarks : 1 // Ensure positive marks is at least 1
            };
          }
          return question;
        });
        
        return {
          ...section,
          questions: updatedQuestions
        };
      });
      
      // Submit to API
      const response = await examService.createExam(finalExamData);
      
      toast.success('Exam created successfully!');
      navigate('/exams/manage');
    } catch (error) {
      console.error('Failed to create exam:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error('Could not create exam. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <ExamBasicInfo 
            examData={examData} 
            onExamDataChange={handleExamDataChange}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case 1:
        return (
          <QuestionsEditor 
            sections={examData.sections}
            onSectionsChange={handleSectionUpdate}
            negativeMarking={examData.negativeMarking}
          />
        );
      case 2:
        return (
          <ExamReview 
            examData={examData}
            courseInfo={courseInfo}
            onExamDataChange={handleExamDataChange}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  if (loading && !courseInfo && activeStep === 0) {
    return (
      <Box className="loading-container">
        <CircularProgress />
        <Typography>Loading course information...</Typography>
      </Box>
    );
  }

  return (
    <Box className="create-exam-container">
      <Typography variant="h4" className="page-title">
        Create New Exam {courseInfo && `for ${courseInfo.title}`}
      </Typography>
      
      <Paper className="stepper-container">
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      <Paper className="step-content">
        {getStepContent(activeStep)}
      </Paper>
      
      <Box className="step-actions">
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          className="back-button"
          variant="outlined"
        >
          Back
        </Button>
        <Box className="right-buttons">
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateExam}
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Creating Exam...' : 'Create Exam'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              className="next-button"
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CreateExam; 