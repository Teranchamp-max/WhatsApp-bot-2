const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const P = require("pino");
const qrcode = require("qrcode");

const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

async function startBotWithCode(sessionCode, onStatus) {
  const filePath = path.join(sessionsDir, `${sessionCode}.json`);
  const { state, saveState } = useSingleFileAuthState(filePath);

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["BWMXMD", "Chrome", "1.0.0"],
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr && onStatus) {
      const qrImage = await qrcode.toDataURL(qr);
      onStatus("qr", qrImage);
    }

    if (connection === "open") {
      console.log(`✅ WhatsApp connected for ${sessionCode}`);
      if (onStatus) onStatus("connected");

      // Auto-reply "saved"
      sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation?.toLowerCase().includes("save")) {
          await sock.sendMessage(msg.key.remoteJid, { text: "✅ saved" });
        }
      });
    }
  });

  sock.ev.on("creds.update", saveState);
}

module.exports = { startBotWithCode };