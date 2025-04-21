const Branch = require('../Models/Branch');
const Semester = require('../Models/Semester');

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    return res.status(200).json({ success: true, data: branches });
  } catch (error) {
    console.error('Error getting branches:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch branches' });
  }
};

// Get branch by ID
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    return res.status(200).json({ success: true, data: branch });
  } catch (error) {
    console.error('Error getting branch:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch branch' });
  }
};

// Get branch with its semesters
exports.getBranchWithSemesters = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    
    // Find all semesters associated with this branch
    const semesters = await Semester.find({ branchId: req.params.id }).sort({ name: 1 });
    
    return res.status(200).json({ 
      success: true, 
      data: {
        branch,
        semesters
      } 
    });
  } catch (error) {
    console.error('Error getting branch with semesters:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch branch with semesters' });
  }
};

// Get all branches with their semesters
exports.getAllBranchesWithSemesters = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ name: 1 });
    
    // For each branch, find its semesters
    const branchesWithSemesters = await Promise.all(
      branches.map(async (branch) => {
        const semesters = await Semester.find({ branchId: branch._id }).sort({ name: 1 });
        return {
          ...branch.toObject(),
          semesters
        };
      })
    );
    
    return res.status(200).json({ success: true, data: branchesWithSemesters });
  } catch (error) {
    console.error('Error getting branches with semesters:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch branches with semesters' });
  }
};

// Create new branch
exports.createBranch = async (req, res) => {
  try {
    const { name, description, code } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Branch code is required' });
    }

    // Check for existing branch with same name
    const existingBranchName = await Branch.findOne({ name: name.trim() });
    if (existingBranchName) {
      return res.status(400).json({ success: false, message: 'Branch with this name already exists' });
    }
    
    // Check for existing branch with same code
    const existingBranchCode = await Branch.findOne({ code: code.trim() });
    if (existingBranchCode) {
      return res.status(400).json({ success: false, message: 'Branch with this code already exists' });
    }

    const newBranch = new Branch({
      name: name.trim(),
      code: code.trim(),
      description: description ? description.trim() : '',
    });

    await newBranch.save();
    return res.status(201).json({ success: true, data: newBranch, message: 'Branch created successfully' });
  } catch (error) {
    console.error('Error creating branch:', error);
    return res.status(500).json({ success: false, message: 'Failed to create branch' });
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    const { name, description, code, isActive } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Branch name is required' });
    }
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Branch code is required' });
    }

    // Check if another branch already has this name
    const existingBranchName = await Branch.findOne({ 
      name: name.trim(), 
      _id: { $ne: req.params.id } 
    });
    
    if (existingBranchName) {
      return res.status(400).json({ success: false, message: 'Another branch with this name already exists' });
    }
    
    // Check if another branch already has this code
    const existingBranchCode = await Branch.findOne({ 
      code: code.trim(), 
      _id: { $ne: req.params.id } 
    });
    
    if (existingBranchCode) {
      return res.status(400).json({ success: false, message: 'Another branch with this code already exists' });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      { 
        name: name.trim(),
        code: code.trim(),
        description: description ? description.trim() : '',
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    return res.status(200).json({ success: true, data: updatedBranch, message: 'Branch updated successfully' });
  } catch (error) {
    console.error('Error updating branch:', error);
    return res.status(500).json({ success: false, message: 'Failed to update branch' });
  }
};

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    // Check if branch has associated semesters
    const associatedSemesters = await Semester.find({ branchId: req.params.id });
    
    if (associatedSemesters.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete branch with associated semesters. Please delete the semesters first or reassign them to another branch.' 
      });
    }
    
    const deletedBranch = await Branch.findByIdAndDelete(req.params.id);
    
    if (!deletedBranch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete branch' });
  }
}; 