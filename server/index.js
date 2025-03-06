const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';

const app = express();
const server = http.createServer(app);
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'],      
}));

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json()); 
app.use('/auth', require('./routes/auth'));

const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1/chat-app';
mongoose.connect(dbUri).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

const Message = mongoose.model('Message', new mongoose.Schema({
  room: String,
  username: String,
  avatar: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
}));

io.use(async (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await mongoose.model('User').findById(decoded.id);
    if (!user) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_room', async (room) => {
    socket.join(room);
    const messages = await Message.find({ room }).sort({ timestamp: -1 }).limit(100);
    socket.emit('initial_messages', messages.reverse());
  });

  socket.on('new_message', async (data) => {
    const { room, message } = data;
    const newMessage = new Message({
      room,
      username: socket.user.username,
      avatar: socket.user.avatar,
      message,
    });
    await newMessage.save();
    io.to(room).emit('new_message', newMessage);
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server, io };