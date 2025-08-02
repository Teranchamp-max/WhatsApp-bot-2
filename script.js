const socket = new WebSocket("wss://whatsapp-bot-2-we2a.onrender.com");

const codeEl = document.getElementById("code");
const statusEl = document.getElementById("status");
const qrContainer = document.getElementById("qr-container");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.code) {
    codeEl.innerText = data.code;
    statusEl.innerText = "Scan the QR with your WhatsApp device...";
  }

  if (data.qr) {
    const img = document.createElement("img");
    img.src = data.qr;
    img.className = "qr";
    qrContainer.innerHTML = "";
    qrContainer.appendChild(img);
  }

  if (data.status === "connected") {
    statusEl.innerText = "✅ WhatsApp Connected!";
    qrContainer.innerHTML = "";
  }

  if (data.status === "expired") {
    statusEl.innerText = "❌ Code Expired. Refresh to try again.";
  }
  const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

