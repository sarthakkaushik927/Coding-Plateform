  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const morgan = require('morgan');
  const config = require('./config');

  const testRoutes = require('./routes/testRoutes');
  const authRoutes = require('./routes/authRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const eventRoutes = require('./routes/eventRoutes');
  const { completeExpiredTests } = require('./services/testLifecycleService');

  const app = express();

  const corsOptions = config.isProduction
    ? {
        origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
        credentials: true
      }
    : {
        origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
        credentials: true
      };

  app.set('trust proxy', 1);
  app.use(cors(corsOptions));
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', environment: config.env });
  });

  app.use('/api', testRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/events', eventRoutes);

  mongoose.connect(config.mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

  setInterval(async () => {
    try {
      await completeExpiredTests();
    } catch (error) {
      console.error('Failed to complete expired tests:', error.message);
    }
  }, 15000);

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
