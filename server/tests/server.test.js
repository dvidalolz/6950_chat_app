process.env.DB_URI = 'mongodb://127.0.0.1/chat-app-test'; // Set test DB URI

const ioClient = require('socket.io-client');
const mongoose = require('mongoose');
const { server, io } = require('../index'); // Require after setting DB_URI

let testServer;

beforeAll(async () => {
  // Start the server on a random port
  testServer = server.listen(0); // 0 lets the OS assign an available port
  const port = testServer.address().port;
  process.env.TEST_PORT = port; // Save port for client connections
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // Clean up test DB
  await mongoose.connection.close(); // Close DB connection
  testServer.close(); // Close test server
  io.close(); // Close Socket.io
});

describe('Backend Tests', () => {
  it('should connect to the server', (done) => {
    const port = process.env.TEST_PORT;
    const client = ioClient(`http://localhost:${port}`);
    client.on('connect', () => {
      client.disconnect();
      done();
    });
  });

  it('should join a room and receive initial messages', (done) => {
    const port = process.env.TEST_PORT;
    const client = ioClient(`http://localhost:${port}`);
    client.emit('join_room', 'general');
    client.on('initial_messages', (messages) => {
      expect(Array.isArray(messages)).toBe(true);
      client.disconnect();
      done();
    });
  });

  it('should send and receive a new message', (done) => {
    const port = process.env.TEST_PORT;
    const client1 = ioClient(`http://localhost:${port}`);
    const client2 = ioClient(`http://localhost:${port}`);
    client1.emit('join_room', 'general');
    client2.emit('join_room', 'general');

    client1.emit('new_message', {
      room: 'general',
      username: 'testuser',
      avatar: 'https://picsum.photos/id/1/200/300',
      message: 'Hello, world!',
    });

    client2.on('new_message', (msg) => {
      expect(msg.message).toBe('Hello, world!');
      client1.disconnect();
      client2.disconnect();
      done();
    });
  });
});