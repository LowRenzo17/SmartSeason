const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '2h'; // Shorter expiration for better security

if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
}

// Input validation
const validateUsername = (username) => {
  return typeof username === 'string' && username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(username);
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6 && password.length <= 100;
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate input format
  if (!validateUsername(username) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Invalid credentials format' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  // Validate input format
  if (!validateUsername(username) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Invalid credentials format. Username must be 3-50 alphanumeric characters. Password must be 6-100 characters.' });
  }

  // Validate role if provided
  if (role && role !== 'AGENT' && role !== 'ADMIN') {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'AGENT'
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
