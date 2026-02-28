import mongoose from "mongoose";    
import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pokemon';

// Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }   
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: '+error.message });
    }   
});

// admin login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }   
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        const userObj = { _id: user._id, username: user.username, email: user.email, role: user.role };
        res.status(200).json({ message: 'Login successful', token, user: userObj });
    } catch (error) {
        res.status(500).json({ message: 'Server error: '+error.message });
    }
});

// student login user
router.post('/student-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email});
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        if (user.role !== 'student') {
            return res.status(403).json({ message: 'Access denied: Not a student' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        const userObj = { _id: user._id, username: user.username, email: user.email, role: user.role };
        res.status(200).json({ message: 'Student login successful', token, user: userObj });
    } catch (error) {
        res.status(500).json({ message: 'Server error: '+error.message });
    }
});

// teacher login user
router.post('/teacher-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        if (user.role !== 'teacher') {
            console.log(user.role);            
            return res.status(403).json({ message: 'Access denied: Not a teacher' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        const userObj = { _id: user._id, username: user.username, email: user.email, role: user.role };
        res.status(200).json({ message: 'Teacher login successful', token, user: userObj });
    } catch (error) {
        res.status(500).json({ message: 'Server error: '+error.message });
    }
});

// logout user
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});

export default router;