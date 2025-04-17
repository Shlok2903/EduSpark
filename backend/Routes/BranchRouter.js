const express = require("express");
const router = express.Router();
const branchController = require("../Controllers/BranchController");
const authMiddleware = require("../Middlewares/authMiddleware");

// Route to get all branches (accessible by all authenticated users)
router.get("/", authMiddleware.verifyToken, branchController.getAllBranches);

// Route to get all branches with their semesters
router.get("/with-semesters", authMiddleware.verifyToken, branchController.getAllBranchesWithSemesters);

// Route to get a specific branch by ID (accessible by all authenticated users)
router.get("/:id", authMiddleware.verifyToken, branchController.getBranchById);

// Route to get a specific branch with its semesters
router.get("/:id/with-semesters", authMiddleware.verifyToken, branchController.getBranchWithSemesters);

// Admin-only routes for managing branches
router.post("/", authMiddleware.verifyToken, authMiddleware.isAdmin, branchController.createBranch);
router.put("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, branchController.updateBranch);
router.delete("/:id", authMiddleware.verifyToken, authMiddleware.isAdmin, branchController.deleteBranch);

module.exports = router; 