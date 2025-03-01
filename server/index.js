const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow frontend origin
    methods: ["GET", "POST"]
  }
});

// Use environment variable for DB URI, default to 'chat-app' for development
const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1/chat-app';

// Connect to MongoDB
mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Could not connect to MongoDB:', err);
});

// Define Message model
const messageSchema = new mongoose.Schema({
  room: String,
  username: String,
  avatar: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_room', async (room) => {
    socket.join(room);
    const messages = await Message.find({ room }).sort({ timestamp: -1 }).limit(100);
    socket.emit('initial_messages', messages.reverse());
  });

  socket.on('new_message', async (data) => {
    const { room, username, avatar, message } = data;
    const newMessage = new Message({ room, username, avatar, message });
    await newMessage.save();
    io.to(room).emit('new_message', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server only if not in test mode
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server, io };