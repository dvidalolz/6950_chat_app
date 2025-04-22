const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';
const authenticate = require('../middleware/authenticate');

// sign up
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, dob, gender } = req.body; // get user info from request

    // make sure it don't exist already
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    if (email && (await User.findOne({ email }))) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // create and save
    const avatar = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/200/300`; // random pic for avatar for now
    const user = new User({ username, password, email, firstName, lastName, dob, gender, avatar }); 
    await user.save(); // trigger pre-save hook (located User model bycrypt) for hashing

    res.status(201).json({ message: 'User created successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // get username/pass 

    // check credentials against database users
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // user auth jwt token retrieve and signin
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username, avatar: user.avatar });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// get user info (protected route - only accessible with valid token)
router.get('/profile', authenticate, async (req, res) => {
  // Populate friends with username and avatar, exclude password from response
  await req.user.populate('friends', 'username avatar');
  const user = req.user.toObject();
  delete user.password;
  res.json(user);
});

// Search for a user by username (protected route)
router.get('/search', authenticate, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: 'Username is required' });
  const user = await User.findOne({ username }).select('username avatar');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Add a friend by username (protected route)
router.post('/add-friend', authenticate, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username is required' });
  if (username === req.user.username) return res.status(400).json({ message: 'Cannot add yourself as a friend' });
  const friend = await User.findOne({ username });
  if (!friend) return res.status(404).json({ message: 'User not found' });
  if (req.user.friends.includes(friend._id)) return res.status(400).json({ message: 'Already friends' });
  req.user.friends.push(friend._id);
  await req.user.save();
  res.json({ message: 'Friend added successfully' });
});

module.exports = router;