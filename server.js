const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const { startBotWithCode } = require("./whatsapp_bot");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// Generate 8-digit session code
function generateSessionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Handle WebSocket connection
wss.on("connection", function connection(ws) {
  const sessionCode = generateSessionCode();
  console.log(`🆕 WebSocket connected: ${sessionCode}`);

  ws.send(JSON.stringify({ code: sessionCode }));

  // Start WhatsApp bot
  startBotWithCode(sessionCode, (statusType, data) => {
    if (statusType === "qr") {
      ws.send(JSON.stringify({ qr: data }));
    }
    if (statusType === "connected") {
      ws.send(JSON.stringify({ status: "connected" }));
    }
  });

  ws.on("close", () => {
    console.log(`🔌 WebSocket disconnected: ${sessionCode}`);
  });
});

// Start server on the port Render gives
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
