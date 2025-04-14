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

const upload = multer({ storage });

// Static routes need to be defined before dynamic routes
// Get all my attempts (student view)
router.get('/my/attempts', verifyToken, examController.getMyAttempts);

// Exam routes (teacher routes)
router.post('/create', verifyToken, examController.createExam);
router.get('/course/:courseId', verifyToken, examController.getCourseExams);

// Exam attempt fixed routes
router.post('/attempt/:attemptId/save', verifyToken, examController.saveExamProgress);
router.post('/attempt/:attemptId/submit', verifyToken, examController.submitExam);
router.put('/attempt/:attemptId/time', verifyToken, examController.updateTimeRemaining);
router.post('/attempt/:attemptId/upload/:sectionId/:questionId', verifyToken, upload.single('file'), examController.uploadFile);
router.get('/attempt/:attemptId', verifyToken, examController.getAttemptById);
router.post('/attempt/:attemptId/grade', verifyToken, examController.gradeAttempt);

// Dynamic path routes
router.get('/:examId', verifyToken, examController.getExamById);
router.put('/:examId', verifyToken, examController.updateExam);
router.put('/:examId/publish', verifyToken, examController.updatePublishStatus);
router.delete('/:examId', verifyToken, examController.deleteExam);
router.get('/:examId/attempts', verifyToken, examController.getExamAttempts);
router.post('/:examId/start', verifyToken, examController.startExam);

module.exports = router; 