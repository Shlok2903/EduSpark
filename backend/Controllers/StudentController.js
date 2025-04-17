const UserModel = require('../Models/User');
const bcrypt = require('bcrypt');
const { sendStudentRegistrationEmail, sendParentNotificationEmail } = require('../services/emailService');

/**
 * Generate a random password of specified length
 * @param {number} length - Password length
 * @returns {string} - Generated password
 */
const generateRandomPassword = (length = 10) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

/**
 * Add a new student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const addStudent = async (req, res) => {
  try {
    const { name, email, semester, degree, parentName, parentEmail } = req.body;

    // Check if student already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Generate random password
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = new UserModel({
      name,
      email,
      password: hashedPassword,
      isStudent: true,
      semester,
      degree,
      parentName,
      parentEmail
    });

    await student.save();

    // Send emails
    try {
      await sendStudentRegistrationEmail(email, name, password);
      await sendParentNotificationEmail(parentEmail, parentName, name, email);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Continue with the response even if emails fail
    }

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      studentId: student._id
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all students with optional filters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudents = async (req, res) => {
  try {
    const { semester, degree } = req.query;
    const filter = { isStudent: true };

    // Add filters if provided
    if (semester) filter.semester = semester;
    if (degree) filter.degree = degree;

    // Get students without returning password
    const students = await UserModel.find(filter).select('-password');

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get unique semesters and degrees for filtering
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStudentFilters = async (req, res) => {
  try {
    // Get distinct semesters and degrees
    const semesters = await UserModel.distinct('semester', { isStudent: true });
    const degrees = await UserModel.distinct('degree', { isStudent: true });

    res.status(200).json({
      success: true,
      filters: {
        semesters,
        degrees
      }
    });
  } catch (error) {
    console.error('Error fetching student filters:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  addStudent,
  getStudents,
  getStudentFilters
}; 