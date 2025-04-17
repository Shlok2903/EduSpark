const express = require("express");
const router = express.Router();
const semesterController = require("../Controllers/SemesterController");
const authMiddleware = require("../Middlewares/authMiddleware");

// Route to get all semesters (accessible by all authenticated users)
router.get("/", authMiddleware.verifyToken, semesterController.getAllSemesters);

// Route to get a specific semester by ID (accessible by all authenticated users)
router.get("/:id", authMiddleware.verifyToken, semesterController.getSemesterById);

// Route to get semesters for a specific branch
router.get("/by-branch/:branchId", authMiddleware.verifyToken, semesterController.getSemestersByBranch);

// Admin-only routes for managing semesters
router.post("/", authMiddleware.verifyToken, authMiddleware.isAdmin, semesterController.createSemester);
router.put("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, semesterController.updateSemester);
router.delete("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, semesterController.deleteSemester);

module.exports = router; 