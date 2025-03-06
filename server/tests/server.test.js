process.env.DB_URI = 'mongodb://127.0.0.1/chat-app-test';

const ioClient = require('socket.io-client');
const mongoose = require('mongoose');
const request = require('supertest');
const { app, server, io } = require('../index'); 

let testServer;
let testPort;

beforeAll(async () => {
  testServer = server.listen(0); 
  testPort = testServer.address().port;
  process.env.TEST_PORT = testPort; 
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); 
  await mongoose.connection.close(); 
  testServer.close(); 
  io.close(); 
});

describe('Backend Tests', () => {
  describe('Authentication Endpoints', () => {
 
    beforeEach(async () => {
      await mongoose.model('User').deleteMany({});
    });

    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created successfully');
    });

    it('should fail to register with duplicate username', async () => {
      await request(app)
        .post('/auth/register')
        .send({ username: 'duplicateuser', password: 'password123' });
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'duplicateuser', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already exists');
    });

    it('should login an existing user', async () => {
      await request(app)
        .post('/auth/register')
        .send({ username: 'loginuser', password: 'password123' });
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'loginuser', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe('loginuser');
    });

    it('should fail login with incorrect password', async () => {
      await request(app)
        .post('/auth/register')
        .send({ username: 'failuser', password: 'password123' });
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'failuser', password: 'wrongpassword' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Socket.io Functionality', () => {
    let token;

    beforeAll(async () => {
      await mongoose.model('User').deleteMany({});
      await request(app)
        .post('/auth/register')
        .send({ username: 'socketuser', password: 'password123' });
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'socketuser', password: 'password123' });
      token = res.body.token;
    });

    it('should connect to the server with a valid token', (done) => {
      const client = ioClient(`http://localhost:${testPort}`, {
        query: { token },
      });
      client.on('connect', () => {
        client.disconnect();
        done();
      });
      client.on('connect_error', (err) => {
        done(err); 
      });
    });

    it('should join a room and receive initial messages', (done) => {
      const client = ioClient(`http://localhost:${testPort}`, {
        query: { token },
      });
      client.emit('join_room', 'general');
      client.on('initial_messages', (messages) => {
        expect(Array.isArray(messages)).toBe(true);
        client.disconnect();
        done();
      });
    }, 10000);

    it('should send and receive a new message', (done) => {
      const client1 = ioClient(`http://localhost:${testPort}`, {
        query: { token },
      });
      const client2 = ioClient(`http://localhost:${testPort}`, {
        query: { token },
      });

      client1.emit('join_room', 'general');
      client2.emit('join_room', 'general');

      client1.emit('new_message', {
        room: 'general',
        message: 'Hello, world!',
      });

      client2.on('new_message', (msg) => {
        expect(msg.message).toBe('Hello, world!');
        expect(msg.username).toBe('socketuser');
        client1.disconnect();
        client2.disconnect();
        done();
      });
    }, 10000); 
  });
});