const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import routes
const authRouter = require('./Routes/AuthRouter');
const courseRouter = require('./Routes/CourseRouter');
const sectionRouter = require('./Routes/sectionRoutes');
const moduleRouter = require('./Routes/moduleRoutes');
const enrollmentRouter = require('./Routes/EnrollmentRouter');
const practiceRouter = require('./Routes/practiceRoutes');
const examRouter = require('./Routes/ExamRouter');
const quizRoutes = require('./Routes/quizRoutes');
const studentRouter = require('./Routes/StudentRouter');
const branchRouter = require('./Routes/BranchRouter');
const semesterRouter = require('./Routes/SemesterRouter');
const gradeRouter = require('./Routes/gradeRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_CONN)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// Check if upload directories exist, create them if not
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/exams'),
  path.join(__dirname, 'uploads/profiles'),
  path.join(__dirname, 'uploads/courses')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating upload directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Use routes
app.use('/auth', authRouter);
app.use('/courses', courseRouter);
app.use('/sections', sectionRouter);
app.use('/modules', moduleRouter);
app.use('/enrollments', enrollmentRouter);
app.use('/practice', practiceRouter);
app.use('/exams', examRouter);
app.use('/api/quizzes', quizRoutes);
app.use('/students', studentRouter);
app.use('/branches', branchRouter);
app.use('/semesters', semesterRouter);
app.use('/grades', gradeRouter);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});