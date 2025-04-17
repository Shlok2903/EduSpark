const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send student registration email with password
 * @param {string} email - Student email
 * @param {string} name - Student name
 * @param {string} password - Generated password
 * @returns {Promise} - Nodemailer send result
 */
const sendStudentRegistrationEmail = async (email, name, password) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to EduSpark - Your Account has been created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #4a86e8;">Welcome to EduSpark!</h1>
          <p>Hello ${name},</p>
          <p>Your teacher has created an account for you on the EduSpark platform. You can now access all course materials and participate in learning activities.</p>
          <p><strong>Your login credentials:</strong></p>
          <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please login and change your password immediately for security reasons.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
          <p>If you have any questions, please contact your teacher or administrator.</p>
          <p>Thank you,<br>EduSpark Team</p>
        </div>
      `
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send parent notification email
 * @param {string} parentEmail - Parent's email
 * @param {string} parentName - Parent's name
 * @param {string} studentName - Student's name
 * @param {string} studentEmail - Student's email
 * @returns {Promise} - Nodemailer send result
 */
const sendParentNotificationEmail = async (parentEmail, parentName, studentName, studentEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: parentEmail,
      subject: `${studentName}'s Account Created on EduSpark`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #4a86e8;">EduSpark Student Account Created</h1>
          <p>Hello ${parentName},</p>
          <p>We're writing to inform you that an account has been created for ${studentName} on the EduSpark learning platform.</p>
          <p>Your child can now access course materials and participate in learning activities using the email address: <strong>${studentEmail}</strong></p>
          <p>If you have any questions or concerns, please contact your child's teacher or school administrator.</p>
          <p>Thank you,<br>EduSpark Team</p>
        </div>
      `
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Parent email sending error:', error);
    throw error;
  }
};

module.exports = {
  sendStudentRegistrationEmail,
  sendParentNotificationEmail
}; 