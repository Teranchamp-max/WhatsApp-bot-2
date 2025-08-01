const http = require("http");
const WebSocket = require("ws");
const { startBotWithCode } = require("./whatsapp_bot");

const PORT = process.env.PORT || 3000;
const sessions = {};

function generateCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("WebSocket server is running.");
  }
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  const sessionCode = generateCode();
  const createdAt = Date.now();

  sessions[sessionCode] = {
    socket: ws,
    status: "pending",
    createdAt,
    timeout: null,
  };

  console.log(`🟡 Session code generated: ${sessionCode}`);
  ws.send(JSON.stringify({ code: sessionCode }));

  const timeout = setTimeout(() => {
    if (sessions[sessionCode]?.status !== "connected") {
      sessions[sessionCode].status = "expired";
      sessions[sessionCode].socket.send(JSON.stringify({ status: "expired" }));
      delete sessions[sessionCode];
      console.log(`❌ Code expired: ${sessionCode}`);
    }
  }, 180000);

  sessions[sessionCode].timeout = timeout;

  startBotWithCode(sessionCode, (status, qrImage) => {
    if (status === "qr" && qrImage) {
      ws.send(JSON.stringify({ qr: qrImage }));
    }
    if (status === "connected") {
      sessions[sessionCode].status = "connected";
      ws.send(JSON.stringify({ status: "connected" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket server running at ws://localhost:${PORT}`);
});