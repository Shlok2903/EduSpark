const Section = require('../Models/Section');
const Module = require('../Models/Module');
const mongoose = require('mongoose');
const { sanitizeHtml } = require('../utils/sanitizer');

/**
 * Get all sections for a course
 * @param {string} courseId - The course ID
 * @returns {Promise<Array>} All sections for the course
 */
const getSectionsByCourseId = async (courseId) => {
  try {
    return await Section.find({ courseId })
      .sort({ order: 1, createdAt: 1 });
  } catch (error) {
    throw new Error(`Error fetching sections: ${error.message}`);
  }
};

/**
 * Get a section by ID with its modules
 * @param {string} sectionId - The section ID
 * @returns {Promise<Object>} Section with modules
 */
const getSectionById = async (sectionId) => {
  try {
    const section = await Section.findById(sectionId);
    
    if (!section) {
      throw new Error('Section not found');
    }
    
    // Get modules for this section
    const modules = await Module.find({ sectionId })
      .sort({ order: 1, createdAt: 1 });
    
    return {
      ...section.toObject(),
      modules
    };
  } catch (error) {
    throw new Error(`Error fetching section: ${error.message}`);
  }
};

/**
 * Create a new section
 * @param {Object} sectionData - Section data
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Created section
 */
const createSection = async (sectionData, courseId) => {
  try {
    const { title, description, deadline } = sectionData;
    
    // Get max order for this course
    const maxOrderSection = await Section.findOne({ courseId })
      .sort({ order: -1 })
      .limit(1);
    
    const order = maxOrderSection ? maxOrderSection.order + 1 : 0;
    
    // Sanitize HTML content
    const sanitizedDescription = sanitizeHtml(description);
    
    const section = new Section({
      title,
      description: sanitizedDescription,
      courseId,
      deadline: deadline ? new Date(deadline) : null,
      order
    });
    
    await section.save();
    return section;
  } catch (error) {
    throw new Error(`Error creating section: ${error.message}`);
  }
};

/**
 * Update a section
 * @param {string} sectionId - Section ID
 * @param {Object} sectionData - Updated section data
 * @returns {Promise<Object>} Updated section
 */
const updateSection = async (sectionId, sectionData) => {
  try {
    // Sanitize HTML content if description is provided
    if (sectionData.description) {
      sectionData.description = sanitizeHtml(sectionData.description);
    }
    
    const section = await Section.findByIdAndUpdate(
      sectionId,
      sectionData,
      { new: true, runValidators: true }
    );
    
    if (!section) {
      throw new Error('Section not found');
    }
    
    return section;
  } catch (error) {
    throw new Error(`Error updating section: ${error.message}`);
  }
};

/**
 * Delete a section and its modules
 * @param {string} sectionId - Section ID
 * @returns {Promise<boolean>} Success flag
 */
const deleteSection = async (sectionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Delete the section
    const deleteResult = await Section.findByIdAndDelete(sectionId).session(session);
    
    if (!deleteResult) {
      throw new Error('Section not found');
    }
    
    // Delete all modules in this section
    await Module.deleteMany({ sectionId }).session(session);
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Error deleting section: ${error.message}`);
  } finally {
    session.endSession();
  }
};

/**
 * Update sections order
 * @param {Array} sectionsOrder - Array of section IDs in order
 * @returns {Promise<boolean>} Success flag
 */
const updateSectionsOrder = async (sectionsOrder) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const updatePromises = sectionsOrder.map((sectionId, index) => 
      Section.findByIdAndUpdate(sectionId, { order: index }).session(session)
    );
    
    await Promise.all(updatePromises);
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Error updating sections order: ${error.message}`);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getSectionsByCourseId,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  updateSectionsOrder
}; 