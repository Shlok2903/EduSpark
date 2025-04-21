const express = require('express');
const router = express.Router();
const examController = require('../Controllers/ExamController');
const { verifyToken } = require('../Middlewares/AuthMiddleware');
const multer = require('multer');

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/exams');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`);
  }
});

// Allow any field name with 'files' prefix for dynamic file uploads
const fileFilter = (req, file, cb) => {
  // Accept files with fieldname starting with 'files'
  if (file.fieldname.startsWith('files[')) {
    cb(null, true);
  } else {
    cb(new Error('Unexpected field name'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Static routes need to be defined before dynamic routes
// Get all my attempts (student view)
router.get('/my/attempts', verifyToken, examController.getMyAttempts);

// Get all exams for the user (from enrolled courses if student, all if admin/teacher)
router.get('/user/exams', verifyToken, examController.getUserExams);

// Create a new exam
router.post('/create', verifyToken, examController.createExam);

// New exam attempt endpoints
router.post('/:examId/attempt/start', verifyToken, examController.startExamAttempt);
router.get('/:examId/attempt/status', verifyToken, examController.getExamAttemptStatus);
router.post('/attempt/submit', verifyToken, examController.submitExamAttempt);
router.post('/attempt/submit-with-files', verifyToken, upload.any(), examController.submitExamAttemptWithFiles);
router.post('/attempt/progress', verifyToken, examController.saveExamProgress);

// Existing endpoints
router.get('/course/:courseId', verifyToken, examController.getCourseExams);
router.get('/:examId', verifyToken, examController.getExamById);
router.get('/:examId/attempts', verifyToken, examController.getExamAttempts);
router.get('/attempt/:attemptId', verifyToken, examController.getAttemptById);
router.patch('/:examId/publish', verifyToken, examController.updatePublishStatus);

// Existing routes for legacy compatibility
router.post('/:examId/start', verifyToken, examController.startExam);
router.post('/attempt/:attemptId/submit', verifyToken, examController.submitExam);
router.post('/attempt/:attemptId/save', verifyToken, examController.saveExamProgress);
router.post('/attempt/:attemptId/grade', verifyToken, examController.gradeAttempt);

// Upload file for a file question
router.post('/attempt/:attemptId/section/:sectionId/question/:questionId/upload', 
  verifyToken, 
  upload.single('file'), 
  examController.uploadFile
);

module.exports = router; 