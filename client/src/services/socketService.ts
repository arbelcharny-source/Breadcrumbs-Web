import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (this.socket) return;

    this.socket = io(SOCKET_URL);

    this.socket.on("connect", () => {
      console.log("Connected to socket server");
      this.socket?.emit("join_room", { userId });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(senderId: string, receiverId: string, content: string) {
    this.socket?.emit("send_message", { senderId, receiverId, content });
  }

  onMessage(callback: (data: any) => void) {
    this.socket?.on("receive_message", callback);
  }

  offMessage() {
    this.socket?.off("receive_message");
  }
}

export default new SocketService();
