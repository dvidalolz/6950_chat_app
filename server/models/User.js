const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, unique: true },
  firstName: String,
  lastName: String,
  dob: Date,
  gender: String,
  avatar: String,
  // Added friends field to store an array of user references
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

// run hashing before saving password so database don't store the plain-text password
userSchema.pre('save', async function (next) {
  // hash password if new or updated
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10); // hash slinging slasher
  }
  next(); // save it to mongo
});

// check password method for comparison
userSchema.methods.comparePassword = function (candidatePassword) { 
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);