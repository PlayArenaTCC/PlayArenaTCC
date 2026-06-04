const express = require('express');

const realtimeService = require('../services/realtimeService');

const router = express.Router();

router.get('/', (_request, response) => {
  response.status(200);
  response.set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
  });
  response.flushHeaders?.();

  const unsubscribe = realtimeService.subscribe(response);
  response.on('close', unsubscribe);
});

module.exports = router;
