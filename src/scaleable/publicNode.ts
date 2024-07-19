import Fastify, { FastifyInstance } from 'fastify';
import fastifySSEPlugin from 'fastify-sse-v2';
import EventSource from 'eventsource';
import fastifyCors from '@fastify/cors';

const fastify: FastifyInstance = Fastify({ logger: true });
fastify.register(fastifySSEPlugin);

let latestPrice: string = '0';
const BLOCKCHAIN_READER_PORT = 3000;

// Register CORS plugin
fastify.register(fastifyCors, {
  origin: "*", // Allow all origins
});

// Connect to the Blockchain Reader Server
const connectToBlockchainReader = () => {
  const es = new EventSource(`http://127.0.0.1:${BLOCKCHAIN_READER_PORT}/price-updates`);

  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    latestPrice = data.price;
    console.log('Received new price:', latestPrice);
  };

  es.onerror = (err) => {
    console.error('Error connecting to Blockchain Reader Server:', err);
  };
};

// SSE route for public price updates
fastify.get('/public-price-updates', { }, (request, reply) => {
  reply.sse((async function* () {
    while (true) {
      yield { data: JSON.stringify({ price: latestPrice }) };
    }
  })());
});

// Start the server
const start = async () => {
  connectToBlockchainReader();

  let port = 3001;
  while (true) {
    try {
      await fastify.listen({ port: port, host: '0.0.0.0' });
      console.log(`Public Facing Server is running on http://localhost:${port}`);
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