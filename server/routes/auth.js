const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; 

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
router.get('/profile', async (req, res) => {

  // Read authorization header, extract token
  const token = req.headers.authorization?.split(' ')[1];

  // nogo
  if (!token) return res.status(401).json({ message: 'No token provided' });

  
  try {
    // validate token, find user by id stored in token, exclude password,
    const decoded = jwt.verify(token, JWT_SECRET); 
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' }); // 404 if not found
    res.json(user); // return usser profile
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;