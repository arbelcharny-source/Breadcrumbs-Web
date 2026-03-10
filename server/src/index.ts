import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectToDB } from "./config/mongo-db.js";
import http from "http";
import { setupSocket } from "./socket.js";

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

setupSocket(server);

connectToDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});