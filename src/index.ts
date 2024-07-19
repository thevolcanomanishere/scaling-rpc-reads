import Fastify, { FastifyInstance } from 'fastify';
import fastifySSEPlugin from 'fastify-sse-v2';
import fastifyCors from '@fastify/cors';

// Initialize Fastify
const fastify: FastifyInstance = Fastify({ logger: false });

const PRICE_UPDATE_INTERVAL = 100; //ms
const NETWORK_LATENCY: number = 100;

// Register the SSE plugin
fastify.register(fastifySSEPlugin);

// Register CORS plugin
fastify.register(fastifyCors, {
  origin: true, // Allow all origins
});

// Store the latest price
let latestPrice: string = "0";

// Store the number of connected clients
let connectedClients: number = 0;

// Network latency simulation (in milliseconds)

// Function to generate a random price
function generateRandomPrice(): string {
  const randomPrice = Math.random() * (1000 - 100) + 100;
  return randomPrice.toFixed(2);
}

// Function to fetch the latest price (now just generates a random price)
async function fetchLatestPrice(): Promise<void> {
  latestPrice = generateRandomPrice();
}

// Fetch new random price every 10 seconds
setInterval(fetchLatestPrice, PRICE_UPDATE_INTERVAL);

// Helper function to simulate network latency
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// SSE route to send price updates to clients
fastify.get('/price-updates', { }, (request, reply) => {
  connectedClients++;
  console.log(`Client connected. Total clients: ${connectedClients}`);

  request.raw.on('close', () => {
    connectedClients--;
    console.log(`Client disconnected. Total clients: ${connectedClients}`);
  });

  reply.sse((async function* () {
    while (true) {
      await sleep(NETWORK_LATENCY); // Simulate network latency
      yield { data: JSON.stringify({ price: latestPrice }) };
    }
  })());
});

// Route to get the number of connected clients
fastify.get('/client-count', async (request, reply) => {
  return { connectedClients };
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    // Generate initial price
    await fetchLatestPrice();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();