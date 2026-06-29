const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  content: {
    type: String,
    default: ''          // shared code/notes yahan store hoga
  },
  users: {
    type: [String],
    default: []          // active usernames
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400       // 24 ghante baad room auto-delete ho jayega
  }
});

module.exports = mongoose.model('Room', roomSchema);