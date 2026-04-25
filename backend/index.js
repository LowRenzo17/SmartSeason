require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true
}));

// Security middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(cookieParser());
app.use(express.json());

const authRoutes = require('./src/routes/auth');
const fieldRoutes = require('./src/routes/fields');

// Health check endpoint for cron-job.org
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);

app.use('/api/dashboard/summary', require('./src/routes/dashboard'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
