const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    console.log('Processing file:', file);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedTypes.includes(file.mimetype)) {
        console.log('File type accepted:', file.mimetype);
        cb(null, true);
    } else {
        console.log('File type rejected:', file.mimetype);
        cb(new Error(`Invalid file type. Only JPEG, JPG and PNG files are allowed. Got: ${file.mimetype}`), false);
    }
};

// Configure upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Add error handling
const handleUpload = (field) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.single(field);
        
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading
                console.error('Multer error:', err);
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message
                });
            } else if (err) {
                // An unknown error occurred
                console.error('Unknown upload error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading file',
                    error: err.message
                });
            }
            
            // Everything went fine
            next();
        });
    };
};

module.exports = { upload, handleUpload }; 