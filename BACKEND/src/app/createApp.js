const express = require('express');
const cors = require('cors');
const path = require('path');

const adminRoutes = require('../routes/admin');
const authRoutes = require('../routes/auth');
const eventRoutes = require('../routes/events');
const localizacaoRoutes = require('../routes/localizacao');
const mediaRoutes = require('../routes/media');
const notificacaoRoutes = require('../routes/notificacoes');
const quadraRoutes = require('../routes/quadras');
const reservaRoutes = require('../routes/reservas');
const realtimeService = require('../services/realtimeService');

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function broadcastSuccessfulMutations(request, response, next) {
  if (!READ_ONLY_METHODS.has(request.method)) {
    response.once('finish', () => {
      if (response.statusCode >= 200 && response.statusCode < 400) {
        realtimeService.broadcastDataChange();
      }
    });
  }

  next();
}

function createCorsOptions() {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://play-arena-tcc.vercel.app',
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  ].filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  };
}

function createApp() {
  const app = express();

  const corsOptions = createCorsOptions();

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(express.json());

  app.use(
    '/uploads',
    cors(corsOptions),
    express.static(path.join(__dirname, '..', '..', 'uploads')),
  );

  app.get('/', (_request, response) => {
    response.json({
      message: 'API PlayArena rodando',
      health: '/api/health',
    });
  });

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'PlayArena API',
    });
  });

  app.use('/api', broadcastSuccessfulMutations);
  app.use('/api/events', eventRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/localizacao', localizacaoRoutes);
  app.use('/api/notificacoes', notificacaoRoutes);
  app.use('/api/quadras', quadraRoutes);
  app.use('/api/reservas', reservaRoutes);
  app.use('/api/admin', adminRoutes);

  app.use((request, response) => {
    response.status(404).json({
      message: `Rota ${request.method} ${request.originalUrl} não encontrada.`,
    });
  });

  app.use((error, _request, response, _next) => {
    const status = error.status || 500;

    response.status(status).json({
      message: status >= 500 ? 'Erro interno no servidor.' : error.message,
    });
  });

  return app;
}

module.exports = {
  createApp,
};
