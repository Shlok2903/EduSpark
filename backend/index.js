const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

// Import routes
const authRouter = require('./Routes/AuthRouter');
const courseRouter = require('./Routes/CourseRouter');
const sectionRoutes = require('./Routes/sectionRoutes');
const moduleRoutes = require('./Routes/moduleRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_CONN)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
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

// Use routes
app.use('/auth', authRouter);
app.use('/courses', courseRouter);
app.use('/', sectionRoutes);
app.use('/', moduleRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});