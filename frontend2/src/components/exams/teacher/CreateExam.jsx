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
  const [courseInfo, setCourseInfo] = useState(null);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    instructions: '',
    duration: 60,
    totalMarks: 0,
    passingMarks: 0,
    negativeMarking: false,
    status: 'draft',
    isPublished: true,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to a week from now
    sections: [
      {
        title: 'Section 1',
        description: 'Default section',
        questions: []
      }
    ],
    courseId: courseId || '' // Initialize with courseId from URL if available
  });
  const [errors, setErrors] = useState({});

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

  const handleNext = () => {
    // Validate required fields at step 0 (Basic Information)
    if (activeStep === 0) {
      const basicInfoErrors = {};
      
      if (!examData.duration || examData.duration <= 0) {
        basicInfoErrors.duration = 'Duration is required and must be greater than 0';
      }
      
      if (!examData.courseId) {
        basicInfoErrors.courseId = 'Course selection is required';
      }
      
      if (!examData.title || examData.title.trim() === '') {
        basicInfoErrors.title = 'Exam title is required';
      }
      
      if (!examData.startTime) {
        basicInfoErrors.startTime = 'Start time is required';
      }
      
      if (!examData.endTime) {
        basicInfoErrors.endTime = 'End time is required';
      } else if (examData.startTime && new Date(examData.endTime) <= new Date(examData.startTime)) {
        basicInfoErrors.endTime = 'End time must be after start time';
      }
      
      // Check if there are any errors
      if (Object.keys(basicInfoErrors).length > 0) {
        setErrors(basicInfoErrors);
        toast.error('Please fill in all required fields correctly');
        return;
      }
    }
    
    // Proceed to next step if validation passes
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
        total += Number(question.marks || 0);
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
      setLoading(true);
      
      // Validate passing marks
      if (examData.passingMarks > examData.totalMarks) {
        toast.error('Passing marks cannot be greater than total marks');
        setLoading(false);
        return;
      }
      
      // Create a copy of exam data for submission
      const finalExamData = { ...examData };
      
      const response = await examService.createExam(finalExamData);
      
      toast.success('Exam created successfully!');
      navigate('/exams/manage');
    } catch (error) {
      console.error('Failed to create exam:', error);
      toast.error('Could not create exam. Please try again.');
    } finally {
      setLoading(false);
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
            totalMarks={examData.totalMarks}
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
        <Typography>Loading...</Typography>
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
        >
          Back
        </Button>
        <Box className="right-buttons">
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateExam}
              disabled={loading}
              className="finish-button"
            >
              {loading ? <CircularProgress size={24} /> : 'Create Exam'}
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