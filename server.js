const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Temporary in-memory store for users
let users = [];

// Telegram Webhook endpoint
app.post('/webhook', async (req, res) => {
  const { message } = req.body;

  if (message && message.text === '/start') {
    const chatId = message.chat.id;
    await sendMessage(chatId, 'Welcome! Click below to open the app:', [
      [{ text: 'Open App', web_app: { url: process.env.WEB_APP_URL } }]
    ]);
  }

  res.sendStatus(200);
});
// Function to send messages to Telegram
async function sendMessage(chatId, text, buttons) {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
  const data = {
    chat_id: chatId,
    text: text,
    reply_markup: { inline_keyboard: buttons }
  };

  try {
    await axios.post(url, data);
  } catch (err) {
    console.error('Error sending message:', err.response?.data || err.message);
  }
}

// === User Registration Endpoint ===
app.post('/api/register', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.json({ message: 'Name and Email are required!' });
  }

  // Check if user exists
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.json({ message: 'User already registered!' });
  }

  // Add new user with 0 points
  const newUser = { name, email, points: 0 };
  users.push(newUser);

  res.json({ message: 'Registration successful!', user: newUser });
});

// === Add Points Endpoint ===
app.post('/api/add-points', (req, res) => {
  const { email, points } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) return res.json({ message: 'User not found!' });

  user.points += points;
  res.json({ message: 'Points updated!', user });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
