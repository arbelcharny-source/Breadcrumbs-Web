import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft } from 'lucide-react';
import { useUser } from "../context/UserContext";
import socketService from "../services/socketService";
import apiClient, { resolveImageUrl } from "../services/user-service";

interface Message {
  senderId: string;
  content: string;
  createdAt: string;
}

interface ChatPartner {
  _id: string;
  username: string;
  profileUrl?: string; // Changed from imgUrl to match UserResponse
}

const ChatPage: React.FC = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const partnerId = searchParams.get('user');
    if (partnerId && user?._id) {
        const fetchTargetUser = async () => {
            try {
                const res = await apiClient.get(`/users/profile/${partnerId}`);
                if (res.data.success) {
                    const target = res.data.data.user;
                    setSelectedPartner({
                        _id: target._id,
                        username: target.username,
                        profileUrl: target.profileUrl
                    });
                }
            } catch (err) {
                console.error("Error fetching target user for chat", err);
            }
        };
        fetchTargetUser();
    }
  }, [searchParams, user?._id]);

  useEffect(() => {
    if (user?._id) {
      socketService.connect(user._id);
      fetchPartners();
    }

    socketService.onMessage((msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // Refresh partners to show new conversation or update last message
      fetchPartners();
    });

    return () => {
      socketService.offMessage();
      socketService.disconnect();
    };
  }, [user?._id]);

  useEffect(() => {
    if (selectedPartner) {
      fetchHistory(selectedPartner._id);
    }
  }, [selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPartners = async () => {
    try {
      const res = await apiClient.get(`/chat/users`);
      if (res.data.success) {
        setPartners(res.data.data.map((p: any) => ({
            _id: p._id,
            username: p.username,
            profileUrl: p.profileUrl || p.imgUrl // Handle both names just in case
        })));
      }
    } catch (err) {
      console.error("Error fetching chat users", err);
    }
  };


  const fetchHistory = async (partnerId: string) => {
    try {
      const res = await apiClient.get(`/chat/history/${partnerId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching history", err);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedPartner || !user?._id) return;

    socketService.sendMessage(user._id, selectedPartner._id, newMessage);
    setNewMessage("");
  };

  return (
    <div className="w-full px-0 md:px-8 lg:px-12 h-[calc(100vh-68px)] md:h-[calc(100vh-140px)] mt-0 md:mt-10">
      <div className="max-w-6xl mx-auto h-full bg-white md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`w-full md:w-1/3 border-r border-gray-100 flex-col bg-gray-50 ${selectedPartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-[#2D2621]">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.length === 0 && !selectedPartner ? (
            <div className="p-10 text-center text-gray-400">
              No conversations yet. Start chatting from a post!
            </div>
          ) : (
            <>
              {/* Ensure selected partner is shown even if not in partners list yet */}
              {selectedPartner && !partners.find(p => p._id === selectedPartner._id) && (
                <div
                  onClick={() => setSelectedPartner(selectedPartner)}
                  className="p-4 flex items-center space-x-4 cursor-pointer transition-all bg-white border-r-4 border-[#8B5E34]"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                    {selectedPartner.profileUrl && <img src={resolveImageUrl(selectedPartner.profileUrl, 'profile')} alt={selectedPartner.username} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2D2621]">{selectedPartner.username}</h3>
                    <p className="text-[10px] text-[#8B5E34] italic">New conversation</p>
                  </div>
                </div>
              )}
              {partners.map((p) => (
                <div
                  key={p._id}
                  onClick={() => setSelectedPartner(p)}
                  className={`p-4 flex items-center space-x-4 cursor-pointer transition-all hover:bg-white ${
                    selectedPartner?._id === p._id ? "bg-white border-r-4 border-[#8B5E34]" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shadow-inner">
                    {p.profileUrl && <img src={resolveImageUrl(p.profileUrl, 'profile')} alt={p.username} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2D2621]">{p.username}</h3>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedPartner ? 'hidden md:flex' : 'flex'}`}>
        {selectedPartner ? (
          <>
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center space-x-3 md:space-x-4 bg-white sticky top-0 z-10">
              <button 
                onClick={() => setSelectedPartner(null)} 
                className="md:hidden p-1.5 -ml-2 text-stone-500 hover:text-stone-800"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-inner flex-shrink-0">
                {selectedPartner.profileUrl && (
                  <img src={resolveImageUrl(selectedPartner.profileUrl, 'profile')} alt={selectedPartner.username} className="w-full h-full object-cover" />
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[#2D2621] truncate">{selectedPartner.username}</h2>
            </div>

            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#F9F7F5]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.senderId === user?._id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                      m.senderId === user?._id
                        ? "bg-[#4A3728] text-white rounded-tr-none"
                        : "bg-white text-[#2D2621] rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm">{m.content}</p>
                    <span className="text-[10px] opacity-50 block mt-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex space-x-4 bg-gray-50 rounded-2xl p-2 pr-4 shadow-inner">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-[#2D2621]"
                />
                <button
                  onClick={handleSend}
                  className="bg-[#8B5E34] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#6D4A29] transition-all shadow-md"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl font-light">Select a connection to start talking.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ChatPage;
