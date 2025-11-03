const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
  },
  settings: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const response = await axios.post('http://localhost:8001/validate', {}, {
      headers: { Authorization: token }
    });

    if (!response.data.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = response.data.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Routes

// Get user profile
app.get('/profile', authenticate, async (req, res) => {
  try {
    let userProfile = await UserProfile.findOne({ userId: req.user.user_id });
    
    if (!userProfile) {
      // Create profile if it doesn't exist
      userProfile = new UserProfile({
        userId: req.user.user_id,
        email: req.user.email,
        username: req.user.email.split('@')[0], // Default username
      });
      await userProfile.save();
    }

    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, profile, settings } = req.body;
    
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: req.user.user_id },
      { 
        username,
        profile,
        settings,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (Admin only)
app.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await UserProfile.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (Admin only)
app.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await UserProfile.findOne({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});