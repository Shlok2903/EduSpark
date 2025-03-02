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

const login = async (req, res)=>{
    try {
        const { name, email, password } = req.body
        const user = await UserModel.findOne({email})
        const errorMsg = 'Auth failed email or password is wrong'
        if(!user){
            return res.status(403).json({message: errorMsg, success: false})
        }
        const isPassEqual = await bcrypt.compare(password, user.password)
        if(!isPassEqual){
            return res.status(403).json({message: errorMsg, success: false})
        }
        const jwtToken = jwt.sign({
            email: user.email, 
            _id: user._id,
            isAdmin: user.isAdmin,
            isTutor: user.isTutor
        }, process.env.JWT_SECRET, {expiresIn: '24h'})

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            email,
            name: user.name,
            isAdmin: user.isAdmin,
            isTutor: user.isTutor
        })
    } catch (err) {
        res.status(500).json({message: "Internal server error",
            success: false
        })
    }
}

module.exports = {
    signup, login
}