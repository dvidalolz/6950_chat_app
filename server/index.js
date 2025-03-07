

const express = require('express'); // web requests
const http = require('http'); // make server
const socketIo = require('socket.io'); // instant message
const mongoose = require('mongoose'); // database communciation
const jwt = require('jsonwebtoken'); // make/check tokens
const JWT_SECRET = 'your_jwt_secret';

const app = express();
const server = http.createServer(app);
const cors = require('cors'); // frontend backend talks with with (I was running into issues without this early on)


// frontend connection
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST'],      
}));

// start server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json()); 
app.use('/auth', require('./routes/auth')); // router imported and mounted

// connect to database
const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1/chat-app';
mongoose.connect(dbUri).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// how message is saved in database
const Message = mongoose.model('Message', new mongoose.Schema({
  room: String,
  username: String,
  avatar: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
}));

// Check the token before letting users chat
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

// handle chat connections
io.on('connection', (socket) => {
  console.log('New client connected');

  // fetch messages from mongodb, sort, and send to front_app chatContainer (there's an emit join room in chatcontainer)
  socket.on('join_room', async (room) => {
    socket.join(room);
    const messages = await Message.find({ room }).sort({ timestamp: -1 }).limit(100);
    socket.emit('initial_messages', messages.reverse()); // send them old old messages
  });

  // when new messages come in
  socket.on('new_message', async (data) => { 
    const { room, message } = data;
    const newMessage = new Message({ // define structure of message
      room,
      username: socket.user.username,
      avatar: socket.user.avatar,
      message,
    });
    await newMessage.save(); // save it to mongo
    io.to(room).emit('new_message', newMessage); // send to all
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});

// define port, start server
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, server, io }; // export backend components to be used frontend and elsewhere