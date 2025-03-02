const router = require("express").Router();
const { ensureAuthenticated } = require("../Middlewares/Auth");
const { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } = require("../Controllers/CourseController");
const { handleUpload } = require("../Middlewares/uploadMiddleware");

// Middleware to check if user is a tutor
const ensureTutor = (req, res, next) => {
    if (!req.user.isTutor) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only tutors can perform this action.'
        });
    }
    next();
};

// Apply authentication and tutor check to all routes
router.use(ensureAuthenticated);
router.use(ensureTutor);

// Course routes with file upload
router.post("/", handleUpload('thumbnail'), createCourse);
router.put("/:id", handleUpload('thumbnail'), updateCourse);

// Other routes remain the same
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.delete("/:id", deleteCourse);

module.exports = router; 