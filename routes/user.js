const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET profile
router.get('/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ ok: true, user });
});

// POST update profile
router.post('/profile', authMiddleware, async (req, res) => {
  const { name, email, addresses } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.name = name || user.name;
  user.email = email || user.email;
  if (Array.isArray(addresses)) user.addresses = addresses;
  await user.save();
  res.json({ ok: true, user });
});

module.exports = router;