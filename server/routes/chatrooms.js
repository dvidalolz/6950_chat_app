const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');

// Get all chat rooms the user is a member of
router.get('/', authenticate, async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({ members: req.user._id }).populate('members', 'username avatar');
    res.json(chatRooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new group chat room
router.post('/', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const chatRoom = new ChatRoom({
      name,
      creator: req.user._id,
      members: [req.user._id]
    });
    await chatRoom.save();
    const populatedChatRoom = await ChatRoom.findById(chatRoom._id).populate('members', 'username avatar');
    res.status(201).json(populatedChatRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or get one-on-one chat room
router.post('/one-on-one', authenticate, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ message: 'Friend ID is required' });
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ message: 'Friend not found' });
    if (!req.user.friends.includes(friend._id)) return res.status(400).json({ message: 'Not friends with this user' });

    // Check if a one-on-one chat room already exists
    const existingChatRoom = await ChatRoom.findOne({
      members: { $all: [req.user._id, friend._id] },
      $expr: { $eq: [{ $size: "$members" }, 2] }
    });

    if (existingChatRoom) {
      return res.json(existingChatRoom);
    }

    // Create a new one-on-one chat room
    const chatRoom = new ChatRoom({
      name: `Chat between ${req.user.username} and ${friend.username}`,
      creator: req.user._id,
      members: [req.user._id, friend._id]
    });
    await chatRoom.save();
    const populatedChatRoom = await ChatRoom.findById(chatRoom._id).populate('members', 'username avatar');
    res.status(201).json(populatedChatRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite a friend to a chat room
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const { friendId } = req.body;
    const chatRoom = await ChatRoom.findById(req.params.id);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });
    if (!chatRoom.members.includes(req.user._id)) return res.status(403).json({ message: 'You are not a member of this chat room' });
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ message: 'Friend not found' });
    if (!req.user.friends.includes(friend._id)) return res.status(400).json({ message: 'Not friends with this user' });
    if (chatRoom.members.includes(friend._id)) return res.status(400).json({ message: 'Friend is already a member' });
    chatRoom.members.push(friend._id);
    await chatRoom.save();
    const populatedChatRoom = await ChatRoom.findById(chatRoom._id).populate('members', 'username avatar');
    res.json(populatedChatRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat rooms of a specific user
router.get('/user/:id', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Check if the user is a friend or the same user
    if (req.user._id.toString() !== userId && !req.user.friends.some(f => f._id.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized to view this user\'s chat rooms' });
    }
    const chatRooms = await ChatRoom.find({ members: userId }).populate('members', 'username avatar');
    res.json(chatRooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;