const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authMw');

const prisma = new PrismaClient();

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!match) return null;

  const mimeType = match[1];
  const base64 = match[2];
  const byteLength = Buffer.byteLength(base64, 'base64');

  if (!ALLOWED_IMAGE_TYPES.has(mimeType) || byteLength > MAX_IMAGE_BYTES) {
    return null;
  }

  return { mimeType, base64, byteLength };
}

function canAccessField(user, field) {
  return user.role === 'ADMIN' || field.agentId === user.id;
}

function getAiFallbackMessage({ field, suspectedIssue, aiUnavailableReason, provider }) {
  if (aiUnavailableReason === 'missing-key') {
    const keyName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
    return `The image has been recorded for ${field.name}. Add ${keyName} in backend/.env to enable full AI image recognition. Based on the field crop and symptoms provided, this should be treated as ${suspectedIssue.toLowerCase()}.`;
  }

  if (aiUnavailableReason === 'quota-or-rate-limit') {
    return `The image has been recorded for ${field.name}. The AI provider was reached, but the key is currently rate-limited or has no available quota, so SmartSeason used symptom-based guidance instead. Treat this as ${suspectedIssue.toLowerCase()} until an agronomist or a working AI provider confirms it.`;
  }

  if (aiUnavailableReason === 'insufficient-quota') {
    return `The image has been recorded for ${field.name}. The OpenAI key is valid, but the account or project has no available API quota or billing credits, so SmartSeason used symptom-based guidance instead. Treat this as ${suspectedIssue.toLowerCase()} until billing is enabled or an agronomist confirms it.`;
  }

  if (aiUnavailableReason === 'provider-unavailable') {
    return `The image has been recorded for ${field.name}. The AI provider could not complete the image analysis right now, so SmartSeason used symptom-based guidance instead. Treat this as ${suspectedIssue.toLowerCase()} until the AI service or an agronomist confirms it.`;
  }

  return `The image has been recorded for ${field.name}. SmartSeason used symptom-based guidance for this diagnosis. Treat this as ${suspectedIssue.toLowerCase()} until it is confirmed by AI vision or an agronomist.`;
}

function fallbackDiagnosis({ field, symptoms, aiUnavailableReason, provider }) {
  const symptomText = (symptoms || '').toLowerCase();
  let suspectedIssue = 'Possible leaf stress or early crop disease';
  let severity = 'Medium';
  let confidence = 45;

  if (symptomText.includes('yellow') || symptomText.includes('chlorosis')) {
    suspectedIssue = 'Possible nutrient deficiency or leaf yellowing disease';
    confidence = 55;
  } else if (symptomText.includes('spot') || symptomText.includes('lesion')) {
    suspectedIssue = 'Possible fungal leaf spot';
    severity = 'High';
    confidence = 58;
  } else if (symptomText.includes('wilting') || symptomText.includes('dry')) {
    suspectedIssue = 'Possible water stress or root disease';
    confidence = 52;
  } else if (symptomText.includes('pest') || symptomText.includes('insect')) {
    suspectedIssue = 'Possible pest damage';
    severity = 'High';
    confidence = 57;
  }

  return {
    cropType: field.cropType,
    suspectedIssue,
    severity,
    confidence,
    summary: getAiFallbackMessage({ field, suspectedIssue, aiUnavailableReason, provider }),
    remedies: [
      'Isolate visibly affected plants where practical and remove severely damaged leaves.',
      'Improve field scouting frequency for the next 7 days and compare symptoms across nearby plants.',
      'Use crop-appropriate organic or chemical treatment only after confirming the disease or pest locally.'
    ],
    prevention: [
      'Avoid overhead watering late in the day and improve airflow around dense crop areas.',
      'Keep field records updated with symptoms, weather changes, and treatment dates.',
      'Rotate crops and clear infected residue after harvest to reduce reinfection risk.'
    ],
    escalation: 'Ask an agronomist to verify the diagnosis if symptoms are spreading quickly, yield is threatened, or confidence is below 70%.',
    source: 'fallback'
  };
}

function safeJsonParse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (err) {
    return null;
  }
}

function collectTextFields(value, texts = []) {
  if (!value) return texts;

  if (typeof value === 'string') {
    return texts;
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectTextFields(item, texts));
    return texts;
  }

  if (typeof value === 'object') {
    if (typeof value.text === 'string') texts.push(value.text);
    if (typeof value.output_text === 'string') texts.push(value.output_text);
    if (typeof value.outputText === 'string') texts.push(value.outputText);
    Object.values(value).forEach(item => collectTextFields(item, texts));
  }

  return texts;
}

function extractAiText(payload) {
  if (!payload) return '';

  if (typeof payload.output_text === 'string') return payload.output_text;
  if (typeof payload.outputText === 'string') return payload.outputText;

  const candidateText = payload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n');
  if (candidateText) return candidateText;

  return collectTextFields(payload).join('\n');
}

function buildDiagnosisPrompt({ field, symptoms }) {
  return `You are an agricultural crop health assistant. Analyze this crop image for field "${field.name}" growing "${field.cropType}". User symptoms: ${symptoms || 'not provided'}.

Return only JSON with these keys:
cropType, suspectedIssue, severity, confidence, summary, remedies, prevention, escalation.
confidence must be an integer from 0 to 100. remedies and prevention must be arrays of short practical strings. Include a caution that this is guidance, not a lab-confirmed diagnosis.`;
}

function normalizeAiDiagnosis(parsed, field, source) {
  return {
    cropType: parsed.cropType || field.cropType,
    suspectedIssue: parsed.suspectedIssue || 'Possible crop health issue',
    severity: parsed.severity || 'Medium',
    confidence: Number.isInteger(parsed.confidence) ? parsed.confidence : 60,
    summary: parsed.summary || 'AI analysis completed. Please verify recommendations with local agronomy guidance.',
    remedies: Array.isArray(parsed.remedies) ? parsed.remedies.slice(0, 6) : [],
    prevention: Array.isArray(parsed.prevention) ? parsed.prevention.slice(0, 6) : [],
    escalation: parsed.escalation || 'Consult an agronomist for severe or spreading symptoms.',
    source
  };
}

function createTimeoutSignal(ms = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function analyzeWithOpenAI({ imageDataUrl, field, symptoms }) {
  if (!process.env.OPENAI_API_KEY) {
    return { analysis: null, unavailableReason: 'missing-key' };
  }

  const timeout = createTimeoutSignal();

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    signal: timeout.signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildDiagnosisPrompt({ field, symptoms })
            },
            { type: 'input_image', image_url: imageDataUrl }
          ]
        }
      ],
      max_output_tokens: 900
    })
  }).finally(timeout.clear);

  if (!response.ok) {
    let unavailableReason = response.status === 429 ? 'quota-or-rate-limit' : 'provider-unavailable';
    try {
      const payload = await response.json();
      if (payload?.error?.code === 'insufficient_quota') {
        unavailableReason = 'insufficient-quota';
      }
    } catch (err) {
      // Keep the status-based fallback reason if the provider body is unreadable.
    }
    throw new Error(`AI analysis failed with status ${response.status}|${unavailableReason}`);
  }

  const data = await response.json();
  const outputText = data.output_text || data.output?.flatMap(item => item.content || []).map(part => part.text || '').join('\n');
  const parsed = safeJsonParse(outputText || '');

  if (!parsed) {
    throw new Error('AI analysis returned an unreadable response');
  }

  return {
    analysis: normalizeAiDiagnosis(parsed, field, 'openai'),
    unavailableReason: null
  };
}

async function analyzeWithGemini({ parsedImage, field, symptoms }) {
  if (!process.env.GEMINI_API_KEY) {
    return { analysis: null, unavailableReason: 'missing-key' };
  }

  const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10);
  const timeout = createTimeoutSignal(timeoutMs);
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    signal: timeout.signal,
    headers: {
      'x-goog-api-key': process.env.GEMINI_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        { type: 'text', text: buildDiagnosisPrompt({ field, symptoms }) },
        {
          type: 'image',
          data: parsedImage.base64,
          mime_type: parsedImage.mimeType
        }
      ]
    })
  }).finally(timeout.clear);

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const code = payload?.error?.status || payload?.error?.code;
    const unavailableReason = response.status === 429 || code === 'RESOURCE_EXHAUSTED'
      ? 'quota-or-rate-limit'
      : 'provider-unavailable';
    throw new Error(`Gemini analysis failed with status ${response.status}|${unavailableReason}`);
  }

  const outputText = extractAiText(payload);
  const parsed = safeJsonParse(outputText || '');

  if (!parsed) {
    throw new Error('Gemini analysis returned an unreadable response');
  }

  return {
    analysis: normalizeAiDiagnosis(parsed, field, 'gemini'),
    unavailableReason: null
  };
}

async function analyzeCropImage({ imageDataUrl, parsedImage, field, symptoms }) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'openai') {
    return analyzeWithOpenAI({ imageDataUrl, field, symptoms });
  }

  if (provider === 'gemini') {
    return analyzeWithGemini({ parsedImage, field, symptoms });
  }

  return { analysis: null, unavailableReason: 'provider-unavailable' };
}

router.get('/', authenticate, async (req, res) => {
  try {
    const fieldId = parseInt(req.query.fieldId, 10);
    if (isNaN(fieldId)) return res.status(400).json({ error: 'Invalid fieldId' });

    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (!canAccessField(req.user, field)) return res.status(403).json({ error: 'Forbidden' });

    const diagnoses = await prisma.cropDiagnosis.findMany({
      where: { fieldId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { username: true } }, field: { select: { name: true, cropType: true } } }
    });

    res.json(diagnoses.map(d => ({
      ...d,
      authorName: d.author.username,
      fieldName: d.field.name,
      fieldCropType: d.field.cropType,
      author: undefined,
      field: undefined
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { fieldId, imageDataUrl, symptoms } = req.body;
    const parsedFieldId = parseInt(fieldId, 10);
    if (isNaN(parsedFieldId)) return res.status(400).json({ error: 'Invalid fieldId' });

    const parsedImage = parseDataUrl(imageDataUrl);
    if (!parsedImage) {
      return res.status(400).json({ error: 'Upload a JPEG, PNG, or WebP image under 4MB.' });
    }

    const field = await prisma.field.findUnique({ where: { id: parsedFieldId } });
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (!canAccessField(req.user, field)) return res.status(403).json({ error: 'Forbidden' });

    let analysis;
    let aiUnavailableReason = 'provider-unavailable';
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    try {
      const aiResult = await analyzeCropImage({ imageDataUrl, parsedImage, field, symptoms });
      analysis = aiResult.analysis;
      aiUnavailableReason = aiResult.unavailableReason || aiUnavailableReason;
    } catch (err) {
      const [message, reason] = err.message.split('|');
      aiUnavailableReason = reason || aiUnavailableReason;
      console.error(message);
    }

    const result = analysis || fallbackDiagnosis({ field, symptoms, aiUnavailableReason, provider });

    const diagnosis = await prisma.cropDiagnosis.create({
      data: {
        cropType: result.cropType || field.cropType,
        symptoms: symptoms || null,
        imageDataUrl,
        suspectedIssue: result.suspectedIssue,
        severity: result.severity,
        confidence: Math.max(0, Math.min(100, result.confidence || 0)),
        summary: result.summary,
        remedies: result.remedies || [],
        prevention: result.prevention || [],
        escalation: result.escalation,
        source: result.source,
        fieldId: parsedFieldId,
        authorId: req.user.id
      },
      include: { author: { select: { username: true } }, field: { select: { name: true, cropType: true } } }
    });

    res.status(201).json({
      ...diagnosis,
      authorName: diagnosis.author.username,
      fieldName: diagnosis.field.name,
      fieldCropType: diagnosis.field.cropType,
      author: undefined,
      field: undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
