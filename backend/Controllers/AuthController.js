const bcrypt = require('bcrypt')
const UserModel = require('../Models/User')
const jwt = require('jsonwebtoken')

const signup = async (req, res)=>{
try {
    const { name, email, password } = req.body
    const isTutor = req.originalUrl === '/auth/tutorsignup'
    
    const user = await UserModel.findOne({email})
    if(user){
        return res.status(409).json({message: 'User is already exist, you can login', success: false})
    }
    const userModel = new UserModel({
        name, 
        email, 
        password,
        isTutor
    })
    userModel.password = await bcrypt.hash(password, 10)
    await userModel.save()
    res.status(201).json({
        message: `${isTutor ? 'Tutor' : 'User'} signup successful`,
        success: true
    })
} catch (err) {
    res.status(500).json({message: "Internal server error",
        success: false
    })
}
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        const errorMsg = 'Auth failed email or password is wrong';
        
        if (!user) {
            return res.status(403).json({ message: errorMsg, success: false });
        }
        
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403).json({ message: errorMsg, success: false });
        }
        
        const jwtToken = jwt.sign({
            email: user.email, 
            id: user._id,
            isAdmin: user.isAdmin,
            isTutor: user.isTutor
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            jwtToken,
            id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isTutor: user.isTutor
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Validate the user's token
const validateToken = async (req, res) => {
    try {
        // If the middleware let us get here, the token is valid
        // Send back the user information (except password)
        const userId = req.user.id || req.user._id;
        const user = await UserModel.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isTutor: user.isTutor
            }
        });
    } catch (error) {
        console.error('Error validating token:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    signup,
    login,
    validateToken
}