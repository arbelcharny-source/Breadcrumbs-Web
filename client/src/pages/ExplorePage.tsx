import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { type PostResponse, resolveImageUrl } from '../services/user-service';
import { useUser } from '../context/UserContext';
import { MapPin, Heart, MessageCircle, Loader2 } from 'lucide-react';
import CommentsModal from '../components/comments/CommentsModal';

const ExplorePage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

    useEffect(() => {
        const fetchAllPosts = async () => {
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
        fetchAllPosts();
    }, []);

    const handleCommentClick = (post: PostResponse) => {
        setSelectedPost(post);
        setIsCommentsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F3F0]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B5E34]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-10 bg-[#F7F3F0]">
            <h1 className="text-4xl font-bold text-[#2D2621] mb-8">Explore Journey</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                            
                            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-1.5 text-stone-400 hover:text-red-500 transition-colors">
                                        <Heart size={18} />
                                        <span className="text-xs font-bold">{post.likesCount}</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCommentClick(post)} 
                                        className="flex items-center gap-1.5 text-stone-400 hover:text-blue-500 transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                        <span className="text-xs font-bold">{post.commentsCount}</span>
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
