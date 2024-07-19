import Fastify, { FastifyInstance } from 'fastify';
import fastifySSEPlugin from 'fastify-sse-v2';

const fastify: FastifyInstance = Fastify({ logger: true });
fastify.register(fastifySSEPlugin);

// Simulated blockchain data
let currentPrice = 100;

// Array to store all connected clients
let clients: Array<{ id: number; send: (data: string) => void }> = [];
let clientIdCounter = 0;

// Function to simulate blockchain data updates
function updatePrice() {
  const change = (Math.random() - 0.5) * 10;
  currentPrice += change;
  currentPrice = Math.max(0, currentPrice); // Ensure price doesn't go negative
  return currentPrice.toFixed(2);
}

// Function to generate a random delay between 100ms and 3000ms
function getRandomDelay() {
    return Math.floor(Math.random() * 2900) + 100;
}

// Function to broadcast price updates to all connected clients
function broadcastPrice() {
  const price = updatePrice();
  const message = JSON.stringify({ price });
  clients.forEach(client => client.send(message));
  console.log(`Broadcasted price ${price} to ${clients.length} clients`);
}

// Start the price update loop
function startPriceUpdates() {
  const updateAndSchedule = () => {
    broadcastPrice();
    const delay = getRandomDelay();
    console.log(`Next update in ${delay}ms`);
    setTimeout(updateAndSchedule, delay);
  };
  updateAndSchedule();
}

// SSE route for price updates
fastify.get('/price-updates', { }, (request, reply) => {
  const clientId = clientIdCounter++;
  const client = {
    id: clientId,
    send: (data: string) => reply.sse({ data })
  };
  
  clients.push(client);
  console.log(`Client ${clientId} connected. Total clients: ${clients.length}`);

  request.raw.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.length}`);
  });

  reply.raw.on('error', (err) => {
    console.error(`Error with client ${clientId}:`, err);
    clients = clients.filter(c => c.id !== clientId);
  });

  // Send the current price immediately upon connection
  client.send(JSON.stringify({ price: currentPrice.toFixed(2) }));
});

// Start the server
const start = async () => {
  let port = 3000;
  while (true) {
    try {
      await fastify.listen({ port: port, host: '0.0.0.0' });
      console.log(`Blockchain Reader Server is running on http://localhost:${port}`);
      startPriceUpdates(); // Start the price update loop after server starts
      break;
    } catch (err) {
      if (err instanceof Error) {
        if ('code' in err && err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying ${port + 1}`);
          port++;
        } else {
          console.error('Error starting server:', err);
          process.exit(1);
        }
      } else {
        console.error('An unknown error occurred:', err);
        process.exit(1);
      }
    }
  }
};

start();