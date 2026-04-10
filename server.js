const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
 
const User = require('./models/User');
 
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let isConnected = false;

// Connect to MongoDB once
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.log('❌ MongoDB Error:', err.message);
  }
}

// Connect on startup
connectDB();

// Ensure connection on each request
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
  }
  next();
});
 
// HOME - Serve Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

 
// ─── CRUD OPERATIONS ───────────────────────────────────────────
 
// POST - Add User
app.post('/addUser', async (req, res) => {
  try {
    await connectDB();
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    // Extract validation error details
    let errorMsg = err.message;
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      errorMsg = errors.join(', ');
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      errorMsg = `${field} already exists`;
    }
    res.status(400).json({ error: errorMsg });
  }
});
 
// GET - Get All Users
app.get('/users', async (req, res) => {
  try {
    // Ensure DB connection before query
    if (!isConnected) {
      await connectDB();
    }
    const users = await User.find().lean();
    console.log('✅ Fetched', users.length, 'users');
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ 
      error: 'Failed to fetch users. ' + err.message,
      users: [] 
    });
  }
});
 
// PUT - Update User by ID
app.put('/updateUser/:id', async (req, res) => {
  try {
    await connectDB();
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    let errorMsg = err.message;
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      errorMsg = errors.join(', ');
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      errorMsg = `${field} already exists`;
    }
    res.status(400).json({ error: errorMsg });
  }
});
 
// DELETE - Delete User by ID
app.delete('/deleteUser/:id', async (req, res) => {
  try {
    await connectDB();
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// ─── QUERYING & FILTERING ───────────────────────────────────────
 
// GET - Search by name
app.get('/users/search', async (req, res) => {
  try {
    const users = await User.find({ name: new RegExp(req.query.name, 'i') });
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// GET - Filter by email and age
app.get('/users/filter', async (req, res) => {
  try {
    const { email, age } = req.query;
    const query = {};
    if (email) query.email = email;
    if (age) query.age = { $gte: Number(age) };
    const users = await User.find(query);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// GET - Find by hobbies
app.get('/users/hobbies', async (req, res) => {
  try {
    const users = await User.find({ hobbies: req.query.hobby });
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// GET - Text search on bio
app.get('/users/bio-search', async (req, res) => {
  try {
    const users = await User.find({ $text: { $search: req.query.text } });
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// GET - Sorting & Pagination
app.get('/users/paginate', async (req, res) => {
  try {
    const { page = 1, limit = 3, sortBy = 'name' } = req.query;
    const users = await User.find()
      .sort({ [sortBy]: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;