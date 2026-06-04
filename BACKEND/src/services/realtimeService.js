const clients = new Set();
let version = 0;

function formatEvent(name, data) {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

function subscribe(response) {
  clients.add(response);
  response.write(formatEvent('connected', {
    version,
    connectedAt: new Date().toISOString(),
  }));

  const heartbeatId = setInterval(() => {
    if (!response.writableEnded) {
      response.write(': keep-alive\n\n');
    }
  }, 25000);

  return () => {
    clearInterval(heartbeatId);
    clients.delete(response);
  };
}

function broadcastDataChange() {
  version += 1;
  const message = formatEvent('data-changed', {
    version,
    changedAt: new Date().toISOString(),
  });

  clients.forEach((response) => {
    if (response.writableEnded || response.destroyed) {
      clients.delete(response);
      return;
    }

    try {
      response.write(message);
    } catch {
      clients.delete(response);
    }
  });
}

module.exports = {
  broadcastDataChange,
  subscribe,
};
