import EventSource from 'eventsource';

const NUM_CONNECTIONS: number = 100;
const TEST_DURATION: number = 10000; // 60 seconds

let activeConnections: number = 0;
let totalMessages: number = 0;
let failedConnections: number = 0;

function createConnection(): EventSource {
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

// Create connections
const connections: EventSource[] = Array(NUM_CONNECTIONS).fill(null).map(createConnection);

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


// Handle script interruption
process.on('SIGINT', () => {
  console.log('\nInterrupting test...');
  connections.forEach(es => es.close());
  console.log(`Test interrupted.`);
  console.log(`Total messages received: ${totalMessages}`);
  console.log(`Active connections: ${activeConnections}`);
  console.log(`Failed connections: ${failedConnections}`);
  console.log(`Average messages per successful connection: ${activeConnections > 0 ? totalMessages / activeConnections : 0}`);
  process.exit(0);
});