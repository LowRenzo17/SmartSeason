const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/authMw');
const { computeStatus } = require('../utils/statusLogic');

const prisma = new PrismaClient();

// Get all fields (Agent vs Admin)
router.get('/', authenticate, async (req, res) => {
  try {
    let fields;
    if (req.user.role === 'ADMIN') {
      fields = await prisma.field.findMany({
        where: {
          agent: { createdByAdminId: req.user.id }
        },
        include: { agent: true }
      });
    } else {
      fields = await prisma.field.findMany({
        where: { agentId: req.user.id },
        include: { agent: true },
      });
    }

    const resFields = fields.map(f => {
      let fCopy = { ...f, status: computeStatus(f) };
      if (fCopy.agent) {
        fCopy.agentName = fCopy.agent.username;
        delete fCopy.agent;
      }
      return fCopy;
    });

    res.json(resFields);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin strictly: Get agents created by this admin
router.get('/agents', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', createdByAdminId: req.user.id },
      select: { id: true, username: true, _count: { select: { fields: true } } }
    });
    res.json(agents.map(agent => ({
      id: agent.id,
      username: agent.username,
      fieldCount: agent._count.fields
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin strictly: Create field
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { name, cropType, agentId } = req.body;
    
    let parsedAgentId = null;
    if (agentId) {
      parsedAgentId = parseInt(agentId);
      if (isNaN(parsedAgentId)) return res.status(400).json({ error: 'Invalid agentId' });
    }

    const field = await prisma.field.create({
      data: {
        name,
        cropType,
        plantingDate: new Date(),
        agentId: parsedAgentId,
      },
    });
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single field
router.get('/:id', authenticate, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    if (isNaN(fieldId)) return res.status(400).json({ error: 'Invalid ID' });
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { agent: true, notes: { include: { author: true }, orderBy: { createdAt: 'desc' } } },
    });
    
    if (!field) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'AGENT' && field.agentId !== req.user.id) {
       return res.status(403).json({ error: 'Forbidden' });
    }
    
    let fCopy = { ...field, status: computeStatus(field) };
    if (fCopy.agent) {
      fCopy.agentName = fCopy.agent.username;
      delete fCopy.agent;
    }

    fCopy.notes = fCopy.notes.map(n => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      authorName: n.author.username
    }));

    res.json(fCopy);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update field
router.put('/:id', authenticate, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    if (isNaN(fieldId)) return res.status(400).json({ error: 'Invalid ID' });
    const { currentStage, agentId, name, cropType } = req.body;
    
    const oldField = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!oldField) return res.status(404).json({ error: 'Not found' });
    
    if (req.user.role === 'AGENT' && oldField.agentId !== req.user.id) {
       return res.status(403).json({ error: 'Forbidden' });
    }

    let dataToUpdate = {};
    if (currentStage) dataToUpdate.currentStage = currentStage;
    if (name) dataToUpdate.name = name;
    if (cropType) dataToUpdate.cropType = cropType;

    if (req.user.role === 'ADMIN' && typeof agentId !== 'undefined') {
      if (agentId) {
        const parsedId = parseInt(agentId);
        if (isNaN(parsedId)) return res.status(400).json({ error: 'Invalid agentId' });

        const targetAgent = await prisma.user.findUnique({ where: { id: parsedId } });
        if (!targetAgent || targetAgent.role !== 'AGENT' || targetAgent.createdByAdminId !== req.user.id) {
          return res.status(403).json({ error: 'Agent not found or not managed by this admin' });
        }

        dataToUpdate.agentId = parsedId;
      } else {
        dataToUpdate.agentId = null;
      }
    }

    const field = await prisma.field.update({
      where: { id: fieldId },
      data: dataToUpdate,
    });
    
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin strictly: Delete field
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    if (isNaN(fieldId)) return res.status(400).json({ error: 'Invalid ID' });
    
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) return res.status(404).json({ error: 'Not found' });
    
    await prisma.field.delete({ where: { id: fieldId } });
    
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add note
router.post('/:id/notes', authenticate, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    if (isNaN(fieldId)) return res.status(400).json({ error: 'Invalid ID' });
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') return res.status(400).json({ error: 'Invalid content' });

    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) return res.status(404).json({ error: 'Not found' });
    
    if (req.user.role === 'AGENT' && field.agentId !== req.user.id) {
       return res.status(403).json({ error: 'Forbidden' });
    }

    const note = await prisma.fieldNote.create({
      data: {
        content,
        fieldId,
        authorId: req.user.id,
      }
    });

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
