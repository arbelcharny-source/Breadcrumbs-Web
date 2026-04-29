import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { type PostResponse, resolveImageUrl, toggleLike, smartSearch } from '../services/user-service';
import { useUser } from '../context/UserContext';
import { MapPin, Heart, MessageCircle, Loader2, Search } from 'lucide-react';
import ExpandCrumbModal from '../components/ExpandCrumbModal';

const HomePage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
    const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);

    const lastPostElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore || isSearching) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, isSearching]);

    const fetchPosts = async (pageToFetch: number, append: boolean = true) => {
        if (pageToFetch === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await apiClient.get('/posts', {
                params: { page: pageToFetch, limit: 12 }
            });
            if (response.data.success) {
                const newPosts = response.data.data.data || response.data.data;
                const pagination = response.data.data.pagination;

                setPosts(prev => {
                    if (!append) return newPosts;
                    const existingIds = new Set(prev.map(p => p._id));
                    return [...prev, ...newPosts.filter((p: PostResponse) => !existingIds.has(p._id))];
                });

                if (pagination) {
                    setHasMore(pagination.page < pagination.totalPages);
                } else {
                    setHasMore(newPosts.length === 12);
                }
            }
        } catch (error) {
            console.error("Error fetching posts", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!isSearching) {
            fetchPosts(page, true);
        }
    }, [page, isSearching]);

    const handlePostClick = (post: PostResponse) => {
        setSelectedPost(post);
        setIsExpandModalOpen(true);
    };

    const handleLike = async (e: React.MouseEvent, post: PostResponse) => {
        e.stopPropagation();
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
            setIsSearching(false);
            setPage(1);
            fetchPosts(1, false);
            return;
        }
        setIsSearching(true);
        setLoading(true);
        try {
            const res = await smartSearch(searchQuery);
            if (res.success) {
                setPosts(res.data.posts);
                setHasMore(false); 
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostUpdate = (updatedPost: PostResponse) => {
        setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    const handlePostDelete = (postId: string) => {
        setPosts(prev => prev.filter(p => p._id !== postId));
    };

    if (loading && page === 1 && !isSearching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F3F0]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8B5E34]" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 py-6 md:px-10 md:py-8 bg-[#F7F3F0]">
            <div className="flex flex-col items-center">
                <form onSubmit={handleSmartSearch} className="mb-8 md:mb-12 relative w-full max-w-4xl mx-auto">
                    <input 
                        type="text" 
                        placeholder="Describe a trip you want to do (e.g. 'Looking for a cheap trip to Sri Lanka')" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-full pl-6 md:pl-8 pr-14 py-3 md:py-3.5 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2D2621]/10 transition-all text-[#2D2621] text-base md:text-lg"
                    />
                    <button type="submit" disabled={loading} className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 hover:bg-stone-50 rounded-full transition-colors disabled:opacity-50">
                        {isSearching && loading ? <Loader2 className="w-5 md:w-6 h-5 md:h-6 animate-spin text-[#2D2621]" /> : <Search className="w-5 md:w-6 h-5 md:h-6 text-[#2D2621]" />}
                    </button>
                </form>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
                    {posts.map((post, index) => {
                        const isLastElement = posts.length === index + 1;
                        return (
                            <div 
                                key={post._id} 
                                ref={isLastElement ? lastPostElementRef : null}
                                onClick={() => handlePostClick(post)}
                                className="bg-white rounded-[2rem] overflow-hidden shadow-md group transition-all hover:shadow-xl cursor-pointer flex flex-col"
                            >
                                <div className="aspect-square overflow-hidden relative">
                                    <img 
                                        src={resolveImageUrl(post.imageAttachmentUrl)} 
                                        alt={post.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <MapPin size={10} className="text-[#8B5E34]" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D2621]">{post.location}</span>
                                    </div>
                                </div>
                                
                                <div className="p-5 flex-1 flex flex-col">
                                    <span className="text-[10px] font-bold text-[#2D2621] opacity-40 uppercase tracking-widest mb-1.5">
                                        @{post.ownerId.username}
                                    </span>
                                    <h3 className="text-lg font-bold text-[#2D2621] mb-2 line-clamp-1">{post.title}</h3>
                                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-4 flex-1">{post.content}</p>
                                    
                                    <div className="flex items-center justify-between border-t border-stone-50 pt-4">
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={(e) => handleLike(e, post)}
                                                className={`flex items-center gap-1.5 transition-colors ${user && post.likes?.includes(user._id) ? 'text-red-500' : 'text-stone-400 hover:text-red-500'}`}
                                            >
                                                <Heart size={16} fill={user && post.likes?.includes(user._id) ? "currentColor" : "none"} />
                                                <span className="text-[10px] font-bold">{post.likes ? post.likes.length : (post.likesCount || 0)}</span>
                                            </button>
                                            <div className="flex items-center gap-1.5 text-stone-400">
                                                <MessageCircle size={16} />
                                                <span className="text-[10px] font-bold">{post.commentsCount || 0}</span>
                                            </div>
                                        </div>
                                        {user?._id !== post.ownerId._id && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/messages?user=${post.ownerId._id}`);
                                                }}
                                                className="text-[9px] font-bold uppercase tracking-widest text-[#8B5E34] hover:text-[#2D2621] transition-colors"
                                            >
                                                Message
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loadingMore && (
                    <div className="w-full flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#8B5E34]" />
                    </div>
                )}
            </div>

            {isExpandModalOpen && selectedPost && (
                <ExpandCrumbModal 
                    post={selectedPost}
                    onClose={() => setIsExpandModalOpen(false)}
                    onPostUpdate={handlePostUpdate}
                    onPostDelete={handlePostDelete}
                />
            )}
        </div>
    );
};

export default HomePage;
