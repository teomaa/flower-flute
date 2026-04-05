const dgram = require("dgram");
const { WebSocketServer } = require("ws");

const UDP_HOST = process.env.UDP_HOST || "192.168.1.2";
const UDP_PORT = 4210;
const WS_PORT = 4211;

const udp = dgram.createSocket("udp4");
const wss = new WebSocketServer({ port: WS_PORT });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`WebSocket client connected (${clients.size} total)`);
  ws.on("close", () => {
    clients.delete(ws);
    console.log(`WebSocket client disconnected (${clients.size} total)`);
  });
});

udp.on("message", (msg) => {
  const packed = msg[0];
  const json = JSON.stringify({ packed });
  for (const ws of clients) {
    ws.send(json);
  }
});

udp.bind(UDP_PORT, UDP_HOST, () => {
  console.log(`UDP listening on ${UDP_HOST}:${UDP_PORT}`);
  console.log(`WebSocket server on ws://localhost:${WS_PORT}`);
});
