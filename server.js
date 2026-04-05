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
 
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.log('❌ Error:', err));
 
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
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// GET - Get All Users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().maxTimeMS(10000);
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: err.message, users: [] });
  }
});
 
// PUT - Update User by ID
app.put('/updateUser/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// DELETE - Delete User by ID
app.delete('/deleteUser/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
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
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;