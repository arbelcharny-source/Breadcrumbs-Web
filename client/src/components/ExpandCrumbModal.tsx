import React, { useState, useEffect } from "react";
import { X, MapPin, Heart, MessageCircle, Loader2, Send, Edit3, Trash2 } from 'lucide-react';
import apiClient, { type PostResponse, resolveImageUrl, toggleLike, addComment, deletePost, updatePost } from '../services/user-service';
import { useUser } from '../context/UserContext';
import EditCrumbModal from './EditCrumbModal';

interface Comment {
  _id: string;
  content: string;
  ownerId: {
    _id: string;
    username: string;
    profileUrl?: string;
  };
  postId: string;
  createdAt: string;
}

interface ExpandCrumbModalProps {
  post: PostResponse;
  onClose: () => void;
  onPostUpdate?: (updatedPost: PostResponse) => void;
  onPostDelete?: (postId: string) => void;
}

const ExpandCrumbModal: React.FC<ExpandCrumbModalProps> = ({ post, onClose, onPostUpdate, onPostDelete }) => {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [currentPost, setCurrentPost] = useState<PostResponse>(post);
  const [isLiking, setIsLiking] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [post._id]);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/comments/post/${post._id}`);
      setComments(res.data.data);
    } catch (err) {
      console.error("Error fetching comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    try {
      const response = await toggleLike(currentPost._id);
      if (response.success) {
        setCurrentPost(response.data);
        if (onPostUpdate) onPostUpdate(response.data);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const response = await addComment(post._id, newComment);
      if (response.success) {
        setNewComment("");
        fetchComments();
        // Update comment count locally
        const updatedPost = { ...currentPost, commentsCount: (currentPost.commentsCount || 0) + 1 };
        setCurrentPost(updatedPost);
        if (onPostUpdate) onPostUpdate(updatedPost);
      }
    } catch (err) {
      console.error("Error adding comment", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this crumb?")) return;
    try {
      const response = await deletePost(currentPost._id);
      if (response.success) {
        if (onPostDelete) onPostDelete(currentPost._id);
        onClose();
      }
    } catch (err) {
      console.error("Error deleting post", err);
      alert("Failed to delete crumb.");
    }
  };

  const handleSaveEdit = async (formData: FormData) => {
    setIsSubmittingEdit(true);
    try {
      const response = await updatePost(currentPost._id, formData);
      if (response.success) {
        // The backend might not return populated ownerId in updatePost, 
        // let's ensure we keep the owner info or re-fetch
        const updatedPost = { ...response.data, ownerId: currentPost.ownerId };
        setCurrentPost(updatedPost);
        if (onPostUpdate) onPostUpdate(updatedPost);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error("Error updating post", err);
      alert("Failed to update crumb.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const owner = currentPost.ownerId;
  const isOwner = user?._id === owner._id;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-md">
      <div className="bg-[#FAF9F6] w-full max-w-5xl h-full max-h-[85vh] md:h-auto md:aspect-[16/10] rounded-[2.5rem] shadow-2xl relative flex flex-col md:flex-row overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-[#2D2621] md:text-stone-400 md:hover:text-stone-600 transition-colors z-20 rounded-full"
        >
          <X size={24} />
        </button>

        {/* Left Side: Image */}
        <div className="w-full md:w-[55%] h-64 md:h-full relative overflow-hidden bg-stone-200">
          <img 
            src={resolveImageUrl(currentPost.imageAttachmentUrl)} 
            alt={currentPost.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <MapPin size={14} className="text-[#8B5E34]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#2D2621]">{currentPost.location}</span>
          </div>
        </div>

        {/* Right Side: Content & Comments */}
        <div className="flex-1 flex flex-col h-full bg-[#FAF9F6]">
          {/* Header: User Info */}
          <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 shadow-inner border-2 border-white">
                <img 
                  src={resolveImageUrl(owner?.profileUrl, 'profile')} 
                  alt={owner?.username || 'User'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-0.5 justify-center">
                <span className="font-bold text-[#2D2621] text-lg leading-tight">{owner?.fullName || owner?.username || 'Loading...'}</span>
                <span className="text-xs text-stone-400 font-medium leading-tight">@{owner?.username || 'username'}</span>
                <span className="text-[10px] text-[#2D2621]/60 font-medium leading-tight">
                  {new Date(currentPost.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 mr-12">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 text-stone-400 hover:text-[#8B5E34] transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Content: Title & Text (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#2D2621] mb-3 tracking-tight">{currentPost.title}</h2>
                <p className="text-[#2D2621]/70 leading-relaxed whitespace-pre-wrap text-sm md:text-base">{currentPost.content}</p>
              </div>

              {currentPost.hashtags && currentPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentPost.hashtags.map(tag => (
                    <span key={tag} className="text-[11px] font-bold tracking-widest text-[#8B5E34] bg-[#D2B48C]/10 px-3 py-1.5 rounded-full uppercase">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Interactions Summary */}
              <div className="flex items-center gap-6 py-4 border-y border-stone-50">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-all hover:scale-110 ${user && currentPost.likes?.includes(user._id) ? 'text-red-500' : 'text-stone-400'}`}
                >
                  <Heart size={22} fill={user && currentPost.likes?.includes(user._id) ? "currentColor" : "none"} />
                  <span className="text-sm font-bold">{currentPost.likesCount || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-stone-400">
                  <MessageCircle size={22} />
                  <span className="text-sm font-bold">{currentPost.commentsCount || 0}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-6">
                <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400">Comments</h4>
                <div className="space-y-5">
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-stone-400 italic">No comments yet.</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment._id} className="flex gap-3 items-start group">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-100 flex-shrink-0">
                          <img 
                            src={resolveImageUrl(comment.ownerId.profileUrl, 'profile')} 
                            className="w-full h-full object-cover" 
                            alt={comment.ownerId.username}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#2D2621] leading-snug">{comment.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-[#2D2621] opacity-60">{comment.ownerId.username}</span>
                            <span className="text-[10px] text-stone-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-6 md:p-8 border-t border-stone-100 bg-white/50">
            <form onSubmit={handleCommentSubmit} className="relative">
              <input 
                type="text" 
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-[#F7F3F0] border-none rounded-2xl pl-5 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-[#8B5E34]/20 transition-all text-[#2D2621] placeholder:text-stone-400"
              />
              <button 
                type="submit"
                disabled={!newComment.trim() || !user}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#8B5E34] hover:text-[#4A3728] disabled:opacity-30 transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditCrumbModal 
          post={currentPost}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          isSubmitting={isSubmittingEdit}
        />
      )}
    </div>
  );
};

export default ExpandCrumbModal;
