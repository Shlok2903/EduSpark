const Semester = require('../Models/Semester');
const Branch = require('../Models/Branch');

// Get all semesters
exports.getAllSemesters = async (req, res) => {
  try {
    // If branchId query param is provided, filter by branch
    const filter = {};
    if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    }
    
    const semesters = await Semester.find(filter)
      .sort({ name: 1 })
      .populate('branchId', 'name');
      
    return res.status(200).json({ success: true, data: semesters });
  } catch (error) {
    console.error('Error getting semesters:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch semesters' });
  }
};

// Get semester by ID
exports.getSemesterById = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id).populate('branchId', 'name');
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    return res.status(200).json({ success: true, data: semester });
  } catch (error) {
    console.error('Error getting semester:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch semester' });
  }
};

// Get semesters by branch
exports.getSemestersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    
    const semesters = await Semester.find({ branchId }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: semesters });
  } catch (error) {
    console.error('Error getting semesters by branch:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch semesters for this branch' });
  }
};

// Create new semester
exports.createSemester = async (req, res) => {
  try {
    const { name, description, branchId } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Semester name is required' });
    }
    
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch is required' });
    }
    
    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check if semester with same name exists in the same branch
    const existingByName = await Semester.findOne({ 
      name: name.trim(),
      branchId
    });
    
    if (existingByName) {
      return res.status(400).json({ success: false, message: 'A semester with this name already exists in the selected branch' });
    }

    const newSemester = new Semester({
      name: name.trim(),
      branchId,
      description: description ? description.trim() : '',
    });

    await newSemester.save();
    return res.status(201).json({ success: true, data: newSemester, message: 'Semester created successfully' });
  } catch (error) {
    console.error('Error creating semester:', error);
    return res.status(500).json({ success: false, message: 'Failed to create semester' });
  }
};

// Update semester
exports.updateSemester = async (req, res) => {
  try {
    const { name, description, isActive, branchId } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Semester name is required' });
    }
    
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch is required' });
    }
    
    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check if another semester already has this name in the same branch
    const existingByName = await Semester.findOne({ 
      name: name.trim(),
      branchId,
      _id: { $ne: req.params.id } 
    });
    
    if (existingByName) {
      return res.status(400).json({ success: false, message: 'Another semester with this name already exists in the selected branch' });
    }

    const updatedSemester = await Semester.findByIdAndUpdate(
      req.params.id,
      { 
        name: name.trim(),
        branchId,
        description: description ? description.trim() : '',
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('branchId', 'name');

    if (!updatedSemester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }

    return res.status(200).json({ success: true, data: updatedSemester, message: 'Semester updated successfully' });
  } catch (error) {
    console.error('Error updating semester:', error);
    return res.status(500).json({ success: false, message: 'Failed to update semester' });
  }
};

// Delete semester
exports.deleteSemester = async (req, res) => {
  try {
    const deletedSemester = await Semester.findByIdAndDelete(req.params.id);
    
    if (!deletedSemester) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete semester' });
  }
}; 