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
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to a week from now
    sections: [
      {
        title: 'Section 1',
        description: 'Default section',
        questions: []
      }
    ],
    courseId: courseId
  });

  useEffect(() => {
    fetchCourseInfo();
  }, [courseId]);

  const fetchCourseInfo = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);
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
      
      const finalExamData = {
        ...examData
      };
      
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

  if (loading && !courseInfo) {
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
        Create New Exam for {courseInfo?.title}
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