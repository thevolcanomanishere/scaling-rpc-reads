import EventSource from 'eventsource';

const NUM_CONNECTIONS: number = 1000;
const TEST_DURATION: number = 60000; // 10 seconds
const CONNECTION_DELAY: number = 100; // Delay in milliseconds between connections

let activeConnections: number = 0;
let totalMessages: number = 0;
let failedConnections: number = 0;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createConnection(): Promise<EventSource> {
  await delay(CONNECTION_DELAY); // Wait for the specified delay
  const es = new EventSource('http://127.0.0.1:3000/price-updates');

  es.onopen = () => {
    activeConnections++;
    console.log(`Connection opened. Active connections: ${activeConnections}`);
  };

  es.onmessage = () => {
    totalMessages++;
  };

  es.onerror = (err: Event) => {
    console.error('EventSource failed:', err);
    failedConnections++;
    es.close(); // Close the connection on error
  };

  return es;
}

// Create connections with delay
async function createConnections() {
  const connections: EventSource[] = [];
  for (let i = 0; i < NUM_CONNECTIONS; i++) {
    const es = await createConnection();
    connections.push(es);
  }

  // Run the test for the specified duration
  setTimeout(() => {
    connections.forEach(es => es.close());
    console.log(`Test completed.`);
    console.log(`Total messages received: ${totalMessages}`);
    console.log(`Active connections: ${activeConnections}`);
    console.log(`Failed connections: ${failedConnections}`);
    console.log(`Average messages per successful connection: ${activeConnections > 0 ? totalMessages / activeConnections : 0}`);
    process.exit(0);
  }, TEST_DURATION);
}

createConnections();

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\nInterrupting test...');
  // Assuming connections is accessible here, otherwise, manage scope accordingly
  console.log(`Test interrupted.`);
  console.log(`Total messages received: ${totalMessages}`);
  console.log(`Active connections: ${activeConnections}`);
  console.log(`Failed connections: ${failedConnections}`);
  console.log(`Average messages per successful connection: ${activeConnections > 0 ? totalMessages / activeConnections : 0}`);
  process.exit(0);
});