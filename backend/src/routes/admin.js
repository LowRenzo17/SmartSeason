const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/authMw');

const prisma = new PrismaClient();
const router = express.Router();

const validateUsername = (username) => {
  return typeof username === 'string' && username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(username);
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6 && password.length <= 100;
};

// List agents created by the authenticated admin
router.get('/agents', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', createdByAdminId: req.user.id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        _count: { select: { fields: true, diagnoses: true, notes: true } }
      }
    });

    res.json(agents.map(agent => ({
      id: agent.id,
      username: agent.username,
      createdAt: agent.createdAt,
      fieldCount: agent._count.fields,
      diagnosisCount: agent._count.diagnoses,
      noteCount: agent._count.notes
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new agent under the authenticated admin
router.post('/agents', authenticate, authorize(['ADMIN']), async (req, res) => {
  const { username, password, fields } = req.body;
  const agentFields = Array.isArray(fields) ? fields : [];

  if (!validateUsername(username) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Invalid credentials format. Username must be 3-50 alphanumeric characters. Password must be 6-100 characters.' });
  }

  if (agentFields.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one field for the agent.' });
  }

  const isValidFields = agentFields.every(field => 
    field && typeof field.name === 'string' && field.name.trim().length >= 2 &&
    typeof field.cropType === 'string' && field.cropType.trim().length >= 2
  );

  if (!isValidFields) {
    return res.status(400).json({ error: 'Each field must include a valid name and crop type.' });
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
        role: 'AGENT',
        createdByAdminId: req.user.id,
        fields: {
          create: agentFields.map(field => ({
            name: field.name.trim(),
            cropType: field.cropType.trim(),
            plantingDate: new Date()
          }))
        }
      },
      include: { fields: true }
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      fields: user.fields.map(field => ({ id: field.id, name: field.name, cropType: field.cropType }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
