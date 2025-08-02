const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const { startBotWithCode } = require("./whatsapp_bot");

const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

wss.on("connection", function connection(ws) {
  const sessionCode = generateSessionCode();
  console.log(`🆕 New user connected: ${sessionCode}`);

  // Send the code to the frontend
  ws.send(JSON.stringify({ code: sessionCode }));

  // Start bot
  startBotWithCode(sessionCode, (statusType, data) => {
    if (statusType === "qr") {
      ws.send(JSON.stringify({ qr: data }));
    }
    if (statusType === "connected") {
      ws.send(JSON.stringify({ status: "connected" }));
    }
  });

  // Optional: Handle disconnection
  ws.on("close", () => {
    console.log(`🔌 User ${sessionCode} disconnected`);
  });
});

// Generate an 8-character alphanumeric code
function generateSessionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
