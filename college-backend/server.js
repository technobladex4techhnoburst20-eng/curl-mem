const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Replace this with your actual MongoDB Atlas connection string!
const MONGO_URI = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/college_memories?retryWrites=true&w=majority";
const JWT_SECRET = "super_secret_jwt_token_change_me";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// --- Database Models ---
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  phone: String,
  branch: String,
  status: { type: String, default: 'active' }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
}));

// --- Routes ---

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name, phone, branch } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, name, phone, branch });
    await user.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    if (user.status === 'blocked') return res.status(403).json({ error: "Account blocked by admin" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Public Messages
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 });
  res.json(messages);
});

// Post Public Message
app.post('/api/messages', async (req, res) => {
  try {
    const { sender, text } = req.body;
    const msg = new Message({ sender, text });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
