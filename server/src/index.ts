import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectToDB } from "./config/mongo-db.js";
import fs from "fs";
import http from "http";
import https from "https"; // Import https
import { setupSocket } from "./socket.js";

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

let server;

if (isProd && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
  // SSL Options - Path to your certificates
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

setupSocket(server);

connectToDB().then(() => {
  server.listen(PORT, () => {
    const protocol = isProd ? "https" : "http";
    console.log(`${protocol.toUpperCase()} Server running on port ${PORT}`);
  });
});