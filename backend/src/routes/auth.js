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
  const { username, password, role, fields } = req.body;
  const accountRole = role === 'ADMIN' ? 'ADMIN' : 'AGENT';

  // Validate input format
  if (!validateUsername(username) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Invalid credentials format. Username must be 3-50 alphanumeric characters. Password must be 6-100 characters.' });
  }

  const agentFields = Array.isArray(fields) ? fields : [];

  if (accountRole === 'ADMIN') {
    const existingAdminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (existingAdminCount > 0) {
      return res.status(403).json({ error: 'Administrator registration is not allowed through the public form.' });
    }
  }

  if (accountRole === 'AGENT') {
    if (agentFields.length === 0) {
      return res.status(400).json({ error: 'Agent registration requires at least one field with a name and crop type.' });
    }

    const isValidFields = agentFields.every(field => 
      field && typeof field.name === 'string' && field.name.trim().length >= 2 &&
      typeof field.cropType === 'string' && field.cropType.trim().length >= 2
    );

    if (!isValidFields) {
      return res.status(400).json({ error: 'Each field must include a valid name and crop type.' });
    }
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const fieldCreateData = accountRole === 'AGENT' ? agentFields.map(field => ({
      name: field.name.trim(),
      cropType: field.cropType.trim(),
      plantingDate: new Date(),
    })) : [];

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: accountRole,
        ...(accountRole === 'AGENT' ? { fields: { create: fieldCreateData } } : {})
      },
      include: { fields: true }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({ token, user: { id: user.id, username: user.username, role: user.role, fields: user.fields } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
