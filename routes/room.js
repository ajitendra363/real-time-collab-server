const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Random 6-character room code generate karne ka function
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/rooms/create — naya room banao
router.post('/create', async (req, res) => {
  try {
    let code = generateCode();

    // Agar code already exist karta hai to naya generate karo
    let existing = await Room.findOne({ roomCode: code });
    while (existing) {
      code = generateCode();
      existing = await Room.findOne({ roomCode: code });
    }

    const room = new Room({ roomCode: code });
    await room.save();

    res.status(201).json({
      success: true,
      roomCode: room.roomCode,
      message: 'Room create ho gaya!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rooms/join — existing room join karo
router.post('/join', async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ success: false, message: 'Room code daalو' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room nahi mila!' });
    }

    res.status(200).json({
      success: true,
      roomCode: room.roomCode,
      content: room.content,
      message: 'Room join ho gaya!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rooms/:code — room ki info lo
router.get('/:code', async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room nahi mila!' });
    }

    res.status(200).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;