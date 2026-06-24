require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Security middleware
app.use(helmet());

// Rate limiting - stricter limits for auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter limit for login attempts
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/', generalLimiter);

// Cookie security
app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Limit payload size

const authRoutes = require('./src/routes/auth');
const fieldRoutes = require('./src/routes/fields');

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/dashboard/summary', require('./src/routes/dashboard'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
