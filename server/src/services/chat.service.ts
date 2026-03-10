import Message, { IMessage } from "../models/message.js";

class ChatService {
  async saveMessage(senderId: string, receiverId: string, content: string): Promise<IMessage> {
    const newMessage = new Message({
      senderId,
      receiverId,
      content,
    });
    return await newMessage.save();
  }

  async getChatHistory(user1: string, user2: string): Promise<IMessage[]> {
    return await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });
  }

  async getUserChats(userId: string): Promise<any[]> {
    // Get unique users this user has chatted with
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).populate("senderId receiverId", "username imgUrl");

    const chatPartners = new Map();

    messages.forEach((msg) => {
      const partner = msg.senderId._id.toString() === userId ? msg.receiverId : msg.senderId;
      chatPartners.set(partner._id.toString(), partner);
    });

    return Array.from(chatPartners.values());
  }
}

export default new ChatService();
