const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; 

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, dob, gender } = req.body;

    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    if (email && (await User.findOne({ email }))) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const avatar = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/200/300`;
    const user = new User({ username, password, email, firstName, lastName, dob, gender, avatar });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;