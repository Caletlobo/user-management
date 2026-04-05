const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [3, 'Name must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age cannot exceed 120']
  },
  hobbies: {
    type: [String]
  },
  bio: {
    type: String
  },
  userId: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// All 6 Indexes
userSchema.index({ name: 1 });                         // Single field
userSchema.index({ email: 1, age: -1 });               // Compound
userSchema.index({ hobbies: 1 });                      // Multikey
userSchema.index({ bio: 'text' });                     // Text
userSchema.index({ userId: 'hashed' });                // Hashed
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL

module.exports = mongoose.model('User', userSchema);
