const express = require('express');
const cors = require('cors');
const path = require('path');

const adminRoutes = require('../routes/admin');
const authRoutes = require('../routes/auth');
const quadraRoutes = require('../routes/quadras');
const reservaRoutes = require('../routes/reservas');

function createCorsOptions() {
  return {
    origin(origin, callback) {
      const allowedOrigin = process.env.FRONTEND_URL;

      if (
        !origin
        || origin.startsWith('http://localhost:')
        || origin.startsWith('http://127.0.0.1:')
        || origin === allowedOrigin
      ) {
        return callback(null, true);
      }

      return callback(new Error('Origem não permitida pelo CORS.'));
    },
  };
}

function createApp() {
  const app = express();

  app.use(cors(createCorsOptions()));
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

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

  app.use('/api/auth', authRoutes);
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

    if (status >= 500) {
      console.error(error);
    }

    response.status(status).json({
      message: status >= 500 ? 'Erro interno no servidor.' : error.message,
    });
  });

  return app;
}

module.exports = {
  createApp,
};
