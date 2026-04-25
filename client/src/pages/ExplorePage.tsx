import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { type PostResponse, resolveImageUrl, toggleLike, smartSearch } from '../services/user-service';
import { useUser } from '../context/UserContext';
import { MapPin, Heart, MessageCircle, Loader2, Search } from 'lucide-react';
import CommentsModal from '../components/comments/CommentsModal';

const ExplorePage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const fetchAllPosts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/posts');
            if (response.data.success) {
                setPosts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching all posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPosts();
    }, []);

    const handleCommentClick = (post: PostResponse) => {
        setSelectedPost(post);
        setIsCommentsModalOpen(true);
    };

    const handleLike = async (post: PostResponse) => {
        if (!user) {
            alert("Please log in to like posts");
            return;
        }
        try {
            const response = await toggleLike(post._id);
            if (response.success) {
                setPosts(prev => prev.map(p => p._id === post._id ? response.data : p));
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleSmartSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchAllPosts();
            return;
        }
        setIsSearching(true);
        try {
            const res = await smartSearch(searchQuery);
            if (res.success) {
                setPosts(res.data.posts);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    if (loading && !isSearching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F3F0]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B5E34]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:p-10 bg-[#F7F3F0]">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2D2621] mb-6 md:mb-8">Explore Journey</h1>
            <form onSubmit={handleSmartSearch} className="mb-6 md:mb-8 relative max-w-2xl">
                <input 
                    type="text" 
                    placeholder="Describe a trip you want to do (e.g. 'Looking for a cheap trip to Sri Lanka')" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-full pl-5 md:pl-6 pr-12 py-3 md:py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B5E34] transition-all text-[#2D2621] text-sm md:text-base"
                />
                <button type="submit" disabled={isSearching} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 bg-[#8B5E34] text-white rounded-full hover:bg-[#6c4826] transition-colors disabled:opacity-50">
                    {isSearching ? <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" /> : <Search className="w-4 md:w-5 h-4 md:h-5" />}
                </button>
            </form>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {posts.map(post => (
                    <div key={post._id} className="bg-white rounded-[2rem] overflow-hidden shadow-xl group">
                        <div className="aspect-[4/3] overflow-hidden relative">
                            <img 
                                src={resolveImageUrl(post.imageAttachmentUrl)} 
                                alt={post.title} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                            />
                            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                <MapPin size={12} className="text-[#8B5E34]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D2621]">{post.location}</span>
                            </div>
                        </div>
                        
                            <div className="p-6">
                            <h3 className="text-xl font-bold text-[#2D2621] mb-2">{post.title}</h3>
                            <p className="text-sm text-stone-500 line-clamp-2 mb-4">{post.content}</p>
                            
                            {post.hashtags && post.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post.hashtags.map(tag => (
                                        <span key={tag} className="text-[10px] font-bold tracking-widest text-[#8B5E34] bg-[#D2B48C]/20 px-2 py-1 rounded-full uppercase">
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleLike(post)}
                                        className={`flex items-center gap-1.5 transition-colors ${user && post.likes?.includes(user._id) ? 'text-red-500' : 'text-stone-400 hover:text-red-500'}`}
                                    >
                                        <Heart size={18} fill={user && post.likes?.includes(user._id) ? "currentColor" : "none"} />
                                        <span className="text-xs font-bold">{post.likes ? post.likes.length : (post.likesCount || 0)}</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCommentClick(post)} 
                                        className="flex items-center gap-1.5 text-stone-400 hover:text-blue-500 transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                        <span className="text-xs font-bold">{post.commentsCount || 0}</span>
                                    </button>
                                </div>
                                {user?._id !== post.ownerId && (
                                    <button 
                                        onClick={() => navigate(`/messages?user=${post.ownerId}`)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#8B5E34] hover:text-[#4A3728] transition-colors"
                                    >
                                        Message Owner
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isCommentsModalOpen && selectedPost && (
                <CommentsModal 
                    postId={selectedPost._id}
                    onClose={() => setIsCommentsModalOpen(false)}
                    onCommentAdded={() => {}} 
                />
            )}
        </div>
    );
};

export default ExplorePage;
