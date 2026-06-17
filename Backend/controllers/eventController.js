const url = require('url');

let clients = [];

function getWaitingUsersByTest(testId) {
  return clients
    .filter((client) => client.testId === testId)
    .map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      joinedAt: client.joinedAt
    }));
}

function getWaitingQueueSnapshot() {
  const grouped = new Map();

  clients.forEach((client) => {
    if (!grouped.has(client.testId)) {
      grouped.set(client.testId, []);
    }

    grouped.get(client.testId).push({
      id: client.id,
      name: client.name,
      email: client.email,
      joinedAt: client.joinedAt
    });
  });

  return Array.from(grouped.entries()).map(([testId, waitingUsers]) => ({
    testId,
    waitingUsers
  }));
}

exports.getWaitingUsersByTest = getWaitingUsersByTest;
exports.getWaitingQueueSnapshot = getWaitingQueueSnapshot;

exports.getEvents = (req, res) => {
  const { testId } = req.params;
  const { query } = url.parse(req.url, true);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now() + Math.floor(Math.random() * 1000);
  const newClient = {
    id: clientId,
    testId,
    name: query.name || 'Candidate',
    email: query.email || '',
    joinedAt: new Date().toISOString(),
    res
  };
  clients.push(newClient);

  res.write(`data: ${JSON.stringify({
    message: 'Connected to waiting room',
    type: 'CONNECTED',
    testId
  })}\n\n`);

  req.on('close', () => {
    clients = clients.filter((client) => client.id !== clientId);
  });
};

exports.broadcastEvent = (testId, data) => {
  clients.forEach((client) => {
    if (client.testId === testId) {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  });
};
