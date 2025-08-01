const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const P = require("pino");
const qrcode = require("qrcode");

const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

/**
 * Send message to each member of a WhatsApp group privately
 */
async function sendMessageToGroupMembers(sock, groupName, messageText) {
  try {
    const groups = await sock.groupFetchAllParticipating();
    const group = Object.values(groups).find((g) => g.subject.toLowerCase().includes(groupName.toLowerCase()));

    if (!group) {
      console.log(`❌ Group '${groupName}' not found`);
      return;
    }

    const groupMetadata = await sock.groupMetadata(group.id);
    const participants = groupMetadata.participants;

    for (let p of participants) {
      const jid = p.id;
      if (!jid.endsWith("@g.us")) {
        await sock.sendMessage(jid, { text: messageText });
        console.log(`📤 Sent message to: ${jid}`);
      }
    }

    console.log(`✅ Done sending message to all members of '${group.subject}'`);
  } catch (err) {
    console.error("❌ Error sending to group:", err);
  }
}

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

      // 📤 Start group messaging
      await sendMessageToGroupMembers(sock, "save", "Hey! I'm Teranchamp. Let's connect. ✅");

      // 💬 Auto-reply feature
      sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation?.toLowerCase().includes("save")) {
          await sock.sendMessage(msg.key.remoteJid, { text: "✅ saved you!" });
        }
      });
    }
  });

  sock.ev.on("creds.update", saveState);
}

module.exports = { startBotWithCode };
