import React, { useState, useEffect } from "react";
import apiClient from "../../services/user-service";
import { useUser } from "../../context/UserContext";

interface Comment {
  _id: string;
  content: string;
  ownerId: string;
  postId: string;
  createdAt: string;
}

interface CommentsModalProps {
  postId: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ postId, onClose, onCommentAdded }) => {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/comments/post/${postId}`);
      setComments(res.data.data);
    } catch (err) {
      console.error("Error fetching comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const token = localStorage.getItem("token");
      await apiClient.post(
        `/comments`,
        { content: newComment, postId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment("");
      fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error("Error adding comment", err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const token = localStorage.getItem("token");
      await apiClient.delete(`/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error("Error deleting comment", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#2D2621]">Comments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {loading ? (
            <div className="text-center text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-400 italic">No comments yet. Be the first to start the conversation!</div>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="group relative">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#F7F3F0] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[#2D2621] text-sm leading-relaxed">{c.content}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user?._id === c.ownerId && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5E34] transition-all"
            />
            <button
              type="submit"
              className="bg-[#4A3728] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#3d2d21] transition-all shadow-md"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
