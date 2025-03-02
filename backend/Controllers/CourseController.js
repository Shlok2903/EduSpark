const CourseModel = require('../Models/Course');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (buffer) => {
    try {
        // Verify Cloudinary configuration
        const { cloud_name, api_key, api_secret } = cloudinary.config();
        if (!cloud_name || !api_key || !api_secret) {
            throw new Error('Cloudinary configuration is incomplete');
        }

        return new Promise((resolve, reject) => {
            const writeStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'course-thumbnails',
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            
            const readStream = new Readable({
                read() {
                    this.push(buffer);
                    this.push(null);
                }
            });
            
            readStream.pipe(writeStream);
        });
    } catch (error) {
        console.error('Error in uploadToCloudinary:', error);
        throw error;
    }
};

const createCourse = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        const { name, description, deadline } = req.body;
        const is_optional = req.body.is_optional === 'true';
        const createdby_tutor_id = req.user._id;

        // Validate required fields
        if (!name || !description || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Upload image to Cloudinary if present
        let thumbnail_url = '';
        if (req.file) {
            try {
                console.log('Uploading file to Cloudinary...');
                const result = await uploadToCloudinary(req.file.buffer);
                console.log('Cloudinary upload result:', result);
                thumbnail_url = result.secure_url;
            } catch (error) {
                console.error('Detailed Cloudinary error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image to Cloudinary',
                    error: error.message,
                    details: error
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Course thumbnail is required'
            });
        }

        // Create and save the course
        const course = new CourseModel({
            name,
            thumbnail_url,
            description,
            is_optional,
            deadline,
            createdby_tutor_id
        });

        console.log('Saving course:', course);
        await course.save();
        
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Detailed error in createCourse:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course',
            error: error.message,
            details: error
        });
    }
};

const getCourses = async (req, res) => {
    try {
        const courses = await CourseModel.find({ createdby_tutor_id: req.user._id })
            .sort({ created_at: -1 });
        
        res.status(200).json({
            success: true,
            courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

const getCourseById = async (req, res) => {
    try {
        const course = await CourseModel.findOne({
            _id: req.params.id,
            createdby_tutor_id: req.user._id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
};

const updateCourse = async (req, res) => {
    try {
        const { name, description, is_optional, deadline } = req.body;
        let updateData = { name, description, is_optional, deadline };

        // Upload new image to Cloudinary if present
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            updateData.thumbnail_url = result.secure_url;
        }
        
        const course = await CourseModel.findOneAndUpdate(
            {
                _id: req.params.id,
                createdby_tutor_id: req.user._id
            },
            updateData,
            { new: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const course = await CourseModel.findOneAndDelete({
            _id: req.params.id,
            createdby_tutor_id: req.user._id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
};

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse
}; 