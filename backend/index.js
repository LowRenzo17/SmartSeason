require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust reverse proxy headers in production (required for rate limiting behind Render/Vercel)
app.set('trust proxy', 1);

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
app.use(express.json({ limit: '6mb' })); // Allows crop image diagnosis uploads while keeping payloads bounded.

const authRoutes = require('./src/routes/auth');
const fieldRoutes = require('./src/routes/fields');
const diagnosisRoutes = require('./src/routes/diagnoses');

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/dashboard/summary', require('./src/routes/dashboard'));

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeDatabase() {
  let tempPrisma;
  const maxRetries = parseInt(process.env.DB_INIT_RETRIES || '5', 10);
  const retryDelayMs = parseInt(process.env.DB_INIT_RETRY_DELAY_MS || '3000', 10);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Database Initialization: Ensuring database schema is up-to-date... (attempt ${attempt}/${maxRetries})`);
      const acceptDataLoss = process.env.PRISMA_ACCEPT_DATA_LOSS === 'true' ? ' --accept-data-loss' : '';
      execSync(`npx prisma db push --skip-generate${acceptDataLoss}`, { stdio: 'inherit' });

      tempPrisma = new PrismaClient();
      const userCount = await tempPrisma.user.count();
      if (userCount === 0) {
        console.log('Database Initialization: Empty database detected. Seeding demo data...');
        execSync('node seed.js', { stdio: 'inherit' });
        console.log('Database Initialization: Seeding completed successfully.');
      } else {
        console.log('Database Initialization: Database already contains data. Skipping seeding.');
      }

      return;
    } catch (error) {
      console.error('Database Initialization: Failed to initialize database:', error.message || error);

      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`Database Initialization: Retrying in ${retryDelayMs}ms...`);
      await wait(retryDelayMs);
    } finally {
      if (tempPrisma) {
        await tempPrisma.$disconnect();
        tempPrisma = null;
      }
    }
  }
}

const PORT = process.env.PORT || 3001;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Server startup aborted because the database is unavailable:', error.message || error);
    process.exit(1);
  });
