import { Server } from "socket.io";
import http from "http";
import chatService from "./services/chat.service.js";

interface ServerToClientEvents {
  receive_message: (data: {
    senderId: string;
    content: string;
    createdAt: Date;
  }) => void;
}

interface ClientToServerEvents {
  join_room: (data: { userId: string }) => void;
  send_message: (data: {
    senderId: string;
    receiverId: string;
    content: string;
  }) => void;
}

interface InterServerEvents {}

interface SocketData {
  userId: string;
}

export const setupSocket = (server: http.Server) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_room", (data) => {
      socket.join(data.userId);
      console.log(`User joined room: ${data.userId}`);
    });

    socket.on("send_message", async (data) => {
      const { senderId, receiverId, content } = data;
      
      // Save message to DB
      const savedMsg = await chatService.saveMessage(senderId, receiverId, content);

      // Emit to receiver
      io.to(receiverId).emit("receive_message", {
        senderId,
        content,
        createdAt: savedMsg.createdAt,
      });

      // Also emit to sender (to confirm/update UI)
      io.to(senderId).emit("receive_message", {
        senderId,
        content,
        createdAt: savedMsg.createdAt,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};
