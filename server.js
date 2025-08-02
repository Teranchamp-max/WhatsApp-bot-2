// index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (set your domain in production)
  }
});

app.use(cors());
app.use(express.json());

// 🟢 Simple test route
app.get('/', (req, res) => {
  res.send('✅ WhatsApp Bot Backend is Live');
});

// 🔐 Store session codes and sockets
const sessions = new Map();

// 🔌 WebSocket Logic
io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  // 1. Generate 8-character code
  socket.on('generate-session-code', () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    sessions.set(code, socket);

    socket.emit('session-code', code);
    console.log(`📦 Code generated: ${code}`);

    // Expire in 3 minutes
    setTimeout(() => {
      sessions.delete(code);
      console.log(`⛔ Code expired: ${code}`);
    }, 3 * 60 * 1000);
  });

  // 2. Bot links using the code
  socket.on('link-bot', ({ code, message }) => {
    const targetSocket = sessions.get(code);
    if (targetSocket) {
      targetSocket.emit('bot-linked', message || '✅ Bot linked successfully!');
      sessions.delete(code);
      console.log(`🔗 Bot linked using code: ${code}`);
    }
  });

  // 3. Start the bot: group + 3 messages
  socket.on('start-bot', async ({ code, groupName, messages }) => {
    const targetSocket = sessions.get(code);
    if (!targetSocket) {
      console.log(`⚠️ Invalid code used: ${code}`);
      return;
    }

    console.log(`🚀 Starting bot for group "${groupName}" with code ${code}`);
    for (let i = 1; i <= 10; i++) {
      await new Promise((res) => setTimeout(res, 1000)); // simulate delay
      targetSocket.emit('bot-progress', `📨 Sent to ${i} of 10 members in "${groupName}"`);
    }

    targetSocket.emit('bot-progress', '✅ All messages sent successfully!');
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
