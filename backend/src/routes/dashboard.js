const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/authMw');
const { computeStatus } = require('../utils/statusLogic');

const prisma = new PrismaClient();

// Get summary for dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    let fields;
    if (req.user.role === 'ADMIN') {
      fields = await prisma.field.findMany();
    } else {
      fields = await prisma.field.findMany({ where: { agentId: req.user.id } });
    }

    const fieldsWithStatus = fields.map(f => ({
      ...f,
      status: computeStatus(f)
    }));

    // Fetch recent notes
    let recentNotes = [];
    if (req.user.role === 'ADMIN') {
      recentNotes = await prisma.fieldNote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { author: true, field: true }
      });
    } else {
      const fieldIds = fields.map(f => f.id);
      recentNotes = await prisma.fieldNote.findMany({
        where: { fieldId: { in: fieldIds } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { author: true, field: true }
      });
    }

    const formattedNotes = recentNotes.map(n => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      authorName: n.author.username,
      fieldName: n.field.name,
      cropType: n.field.cropType
    }));

    const totalFields = fieldsWithStatus.length;
    let active = 0, atRisk = 0, completed = 0;

    fieldsWithStatus.forEach(f => {
      if (f.status === 'Active') active++;
      else if (f.status === 'At Risk') atRisk++;
      else if (f.status === 'Completed') completed++;
    });

    res.json({
      totalFields,
      statusBreakdown: {
        active,
        atRisk,
        completed
      },
      recentNotes: formattedNotes
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
