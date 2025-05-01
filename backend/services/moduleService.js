const Module = require('../Models/Module');
const Course = require('../Models/Course');
const Section = require('../Models/Section');
const mongoose = require('mongoose');
const { sanitizeHtml } = require('../utils/sanitizer');

/**
 * Get all modules for a section
 * @param {string} sectionId - The section ID
 * @returns {Promise<Array>} All modules for the section
 */
const getModulesBySectionId = async (sectionId) => {
  try {
    return await Module.find({ sectionId })
      .sort({ order: 1, createdAt: 1 });
  } catch (error) {
    throw new Error(`Error fetching modules: ${error.message}`);
  }
};

/**
 * Get a module by ID
 * @param {string} moduleId - The module ID
 * @returns {Promise<Object>} Module details
 */
const getModuleById = async (moduleId) => {
  try {
    const module = await Module.findById(moduleId);
    
    if (!module) {
      throw new Error('Module not found');
    }
    
    return module;
  } catch (error) {
    throw new Error(`Error fetching module: ${error.message}`);
  }
};

/**
 * Create a new module
 * @param {string} courseId - The course ID
 * @param {string} sectionId - The section ID
 * @param {Object} moduleData - Module data
 * @returns {Promise<Object>} Created module
 */
const createModule = async (courseId, sectionId, moduleData) => {
  try {
    const { title, description, contentType } = moduleData;
    
    // Get max order for this section
    const maxOrderModule = await Module.findOne({ sectionId })
      .sort({ order: -1 })
      .limit(1);
    
    const order = maxOrderModule ? maxOrderModule.order + 1 : 0;
    
    // Sanitize description
    const sanitizedDescription = sanitizeHtml(description);
    
    // Create module with the appropriate content based on type
    const moduleObj = {
      title,
      description: sanitizedDescription,
      courseId,
      sectionId,
      contentType,
      order
    };
    
    // Add content based on type and sanitize where appropriate
    switch (contentType) {
      case 'video':
        moduleObj.videoContent = {
          videoUrl: moduleData.videoContent?.videoUrl || moduleData.videoUrl
        };
        break;
      
      case 'text':
        console.log('Creating text module with content:', moduleData.textContent);
        if (!moduleData.textContent || !moduleData.textContent.content) {
          throw new Error('Text content is required for text type modules');
        }
        moduleObj.textContent = {
          content: sanitizeHtml(moduleData.textContent.content)
        };
        console.log('Created text content:', moduleObj.textContent);
        break;
      
      case 'quiz':
      case 'quizz':
        console.log('Received quiz module data:', moduleData);
        
        if (!moduleData.quizContent || !moduleData.quizContent.questions) {
          console.error('Missing quiz content or questions:', moduleData);
          throw new Error('Quiz questions are required for quiz type modules');
        }

        const questions = moduleData.quizContent.questions;
        
        // Validate questions array
        if (!Array.isArray(questions) || questions.length === 0) {
          console.error('Invalid questions array:', questions);
          throw new Error('At least one quiz question is required');
        }

        moduleObj.quizContent = {
          questions: questions.map(q => {
            if (!q.question || !q.options || !Array.isArray(q.options)) {
              console.error('Invalid question format:', q);
              throw new Error('Invalid question format');
            }

            return {
              question: sanitizeHtml(q.question),
              options: q.options.map(opt => {
                if (!opt || typeof opt !== 'object') {
                  console.error('Invalid option format:', opt);
                  throw new Error('Invalid option format');
                }

                return {
                  text: sanitizeHtml(opt.text || ''),
                  isCorrect: Boolean(opt.isCorrect)
                };
              }),
              marks: q.marks || 1
            };
          }),
          passingScore: moduleData.quizContent.passingScore || 70,
          timer: moduleData.quizContent.timer || 0,
          maxAttempts: moduleData.quizContent.maxAttempts || 0,
          deadline: moduleData.quizContent.deadline || null
        };

        console.log('Processed quiz content:', moduleObj.quizContent);
        break;
      
      default:
        throw new Error('Invalid content type');
    }
    
    const module = new Module(moduleObj);
    await module.save();
    
    return module;
  } catch (error) {
    throw new Error(`Error creating module: ${error.message}`);
  }
};

/**
 * Create multiple modules in batch
 * @param {Array} modulesData - Array of module data objects
 * @param {string} courseId - Course ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<Array>} Array of created modules
 */
const createModulesBatch = async (modulesData, courseId, sectionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get the current max order for this section
    const maxOrderModule = await Module.findOne({ sectionId })
      .sort({ order: -1 })
      .limit(1);
    
    let nextOrder = maxOrderModule ? maxOrderModule.order + 1 : 0;
    
    const createdModules = [];
    
    // Create each module with correct order
    for (const moduleData of modulesData) {
      const { title, description, type, content } = moduleData;
      
      // Create module with the appropriate content based on type
      const moduleObj = {
        title,
        description: sanitizeHtml(description || ''),
        courseId,
        sectionId,
        contentType: type,
        order: nextOrder++
      };
      
      // Add content based on type and sanitize where appropriate
      switch (type) {
        case 'video':
          moduleObj.videoContent = {
            videoUrl: content?.url || ''
          };
          break;
        
        case 'text':
          moduleObj.textContent = {
            content: sanitizeHtml(content?.text || '')
          };
          break;
        
        case 'quiz':
          moduleObj.contentType = 'quizz'; // Adjust type to match backend enum
          moduleObj.quizContent = {
            questions: content?.questions.map(q => ({
              question: sanitizeHtml(q.question),
              options: q.options.map((optionText, index) => ({
                text: sanitizeHtml(optionText),
                isCorrect: index === parseInt(q.correctOption)
              })),
              marks: q.marks || 1
            })) || [],
            passingScore: content?.passingScore || 70,
            timer: content?.timer || 0,
            maxAttempts: content?.maxAttempts || 0,
            deadline: content?.deadline || null
          };
          break;
        
        default:
          throw new Error(`Invalid content type: ${type}`);
      }
      
      const module = new Module(moduleObj);
      await module.save({ session });
      createdModules.push(module);
    }
    
    await session.commitTransaction();
    return createdModules;
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Error creating modules in batch: ${error.message}`);
  } finally {
    session.endSession();
  }
};

/**
 * Check if a user has access to create/modify modules for a course section
 * @param {string} courseId - Course ID
 * @param {string} sectionId - Section ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether the user has access
 */
const checkAccess = async (courseId, sectionId, userId) => {
  try {
    // Check if section exists and belongs to the course
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }
    
    if (section.courseId.toString() !== courseId) {
      throw new Error('Section does not belong to the specified course');
    }
    
    // Check if the user is the creator of the course
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const isCreator = course.createdBy.toString() === userId.toString();
    
    // In a real application, you might also check if the user is an admin
    // const user = await User.findById(userId);
    // const isAdmin = user.isAdmin;
    
    return isCreator; // || isAdmin
  } catch (error) {
    throw new Error(`Error checking access: ${error.message}`);
  }
};

/**
 * Update a module
 * @param {string} moduleId - Module ID
 * @param {Object} moduleData - Updated module data
 * @returns {Promise<Object>} Updated module
 */
const updateModule = async (moduleId, moduleData) => {
  try {
    const module = await Module.findById(moduleId);
    
    if (!module) {
      throw new Error('Module not found');
    }
    
    // Update basic fields with sanitization
    if (moduleData.title) module.title = moduleData.title;
    if (moduleData.description) module.description = sanitizeHtml(moduleData.description);
    
    // Update content based on type with sanitization
    if (module.contentType === 'video' && moduleData.videoContent?.videoUrl) {
      module.videoContent = {
        videoUrl: moduleData.videoContent.videoUrl
      };
    } else if (module.contentType === 'text' && moduleData.textContent) {
      console.log('Updating text content:', moduleData.textContent);
      module.textContent = {
        content: sanitizeHtml(moduleData.textContent.content || '')
      };
      console.log('Updated module text content:', module.textContent);
    } else if (module.contentType === 'quizz' && moduleData.quizContent?.questions) {
      module.quizContent = {
        questions: moduleData.quizContent.questions.map(q => ({
          question: sanitizeHtml(q.question),
          options: q.options.map(opt => ({
            text: sanitizeHtml(opt.text),
            isCorrect: opt.isCorrect
          }))
        })),
        passingScore: moduleData.quizContent?.passingScore || module.quizContent?.passingScore || 70
      };
    }
    
    await module.save();
    return module;
  } catch (error) {
    throw new Error(`Error updating module: ${error.message}`);
  }
};

/**
 * Delete a module
 * @param {string} moduleId - Module ID
 * @returns {Promise<boolean>} Success flag
 */
const deleteModule = async (moduleId) => {
  try {
    const deleteResult = await Module.findByIdAndDelete(moduleId);
    
    if (!deleteResult) {
      throw new Error('Module not found');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Error deleting module: ${error.message}`);
  }
};

/**
 * Update modules order
 * @param {Array} modulesOrder - Array of module IDs in order
 * @returns {Promise<boolean>} Success flag
 */
const updateModulesOrder = async (modulesOrder) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const updatePromises = modulesOrder.map((moduleId, index) => 
      Module.findByIdAndUpdate(moduleId, { order: index }).session(session)
    );
    
    await Promise.all(updatePromises);
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Error updating modules order: ${error.message}`);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getModulesBySectionId,
  getModuleById,
  createModule,
  createModulesBatch,
  checkAccess,
  updateModule,
  deleteModule,
  updateModulesOrder
}; 