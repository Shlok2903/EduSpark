/**
 * Standard success response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success flag
 * @param {string} message - Success message
 * @param {Object|Array} data - Response data
 * @returns {Object} Response object
 */
const handleResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} Response object
 */
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  handleResponse,
  handleError
}; 