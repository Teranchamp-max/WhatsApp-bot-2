// index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Initialize app & server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allow all origins
});

// Middleware
app.use(cors());
app.use(express.json());

// 🧪 Default route for Render
app.get('/', (req, res) => {
  res.send('✅ WhatsApp Bot Backend is Live');
});

// Store session codes and their socket connections
const sessions = new Map();

// WebSocket Events
io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id);

  // 1. Generate an 8-character session code
  socket.on('generate-session-code', () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase(); // e.g. AB12CD34
    sessions.set(code, socket);
    socket.emit('session-code', code);

    console.log(`📦 Code generated: ${code}`);

    // Expire code after 3 minutes
    setTimeout(() => {
      sessions.delete(code);
      console.log(`⛔ Code expired: ${code}`);
    }, 3 * 60 * 1000);
  });

  // 2. Link bot using session code
  socket.on('link-bot', ({ code, message }) => {
    const targetSocket = sessions.get(code);
    if (targetSocket) {
      targetSocket.emit('bot-linked', message || '✅ Bot linked successfully!');
      sessions.delete(code);
      console.log(`🔗 Bot linked using code: ${code}`);
    } else {
      console.log(`❌ Invalid code used for linking: ${code}`);
    }
  });

  // 3. Start bot (simulate progress)
  socket.on('start-bot', async ({ code, groupName, messages }) => {
    const targetSocket = sessions.get(code);
    if (!targetSocket) {
      console.log(`⚠️ Invalid session code: ${code}`);
      return;
    }

    console.log(`🚀 Bot started for group "${groupName}" with messages:`, messages);

    // Simulate sending messages to 10 members
    for (let i = 1; i <= 10; i++) {
      await new Promise((res) => setTimeout(res, 1000));
      targetSocket.emit('bot-progress', `📨 Sent to ${i} of 10 members in "${groupName}"`);
    }

    targetSocket.emit('bot-progress', '✅ All messages sent!');
    console.log(`✅ Bot finished for group: ${groupName}`);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
