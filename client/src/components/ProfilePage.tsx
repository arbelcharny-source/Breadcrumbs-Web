import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { Settings, MapPin, Heart, MessageCircle, Edit3, X, Camera, Trash2, Loader2 } from 'lucide-react';
import { getUserProfile, updateUser, updatePost, deletePost, type UserResponse, type PostResponse } from '../services/user-service';

interface GroupedTrip {
  title: string;
  date: string;
  crumbs: PostResponse[];
}

const ProfilePage = () => {
  const { user, updateUser: updateContextUser, logout } = useUser();
  const [profileUser, setProfileUser] = useState<UserResponse | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const handleAuthError = (error: any) => {
    if (error.response?.status === 401) {
      alert("Session expired or unauthorized. Logging out...");
      logout();
    }
  };

  const fetchProfile = async (pageToFetch: number, append: boolean = true) => {
    if (!user?._id) return;
    if (pageToFetch === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await getUserProfile(user._id, pageToFetch, 12);
      if (response.success) {
        if (pageToFetch === 1) {
          setProfileUser(response.data.user);
        }
        
        const newPosts = response.data.posts;
        setPosts(prev => {
          if (!append) return newPosts;
          const existingIds = new Set(prev.map(p => p._id));
          return [...prev, ...newPosts.filter(p => !existingIds.has(p._id))];
        });
        
        if (response.data.pagination) {
          setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
        } else {
          setHasMore(false);
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      handleAuthError(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProfile(page, true);
  }, [user?._id, page]);

  useEffect(() => {
    const handlePostCreated = () => {
      setPage(1);
      fetchProfile(1, false);
    };
    window.addEventListener('post-created', handlePostCreated);
    return () => window.removeEventListener('post-created', handlePostCreated);
  }, [user?._id]);

  const formatTripDate = (posts: PostResponse[]) => {
    if (posts.length === 0) return '';
    const dates = posts.map(p => new Date(p.createdAt).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const startMonth = minDate.toLocaleString('en-US', { month: 'long' });
    const endMonth = maxDate.toLocaleString('en-US', { month: 'long' });
    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();
    if (startMonth === endMonth && startYear === endYear) return `${startMonth} ${startYear}`;
    if (startYear === endYear) return `${startMonth} - ${endMonth} ${startYear}`;
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  // Group posts by title for display
  const groupPostsIntoTrips = (postsToGroup: PostResponse[]): GroupedTrip[] => {
    const groups = postsToGroup.reduce((acc: Record<string, PostResponse[]>, post: PostResponse) => {
      if (!acc[post.title]) {
        acc[post.title] = [];
      }
      acc[post.title].push(post);
      return acc;
    }, {});

    return Object.keys(groups).map(title => ({
      title,
      date: formatTripDate(groups[title]),
      crumbs: groups[title].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }));
  };

  const trips = groupPostsIntoTrips(posts);

  const handleUpdateProfile = async (formData: FormData) => {
    if (!user?._id) return;
    setIsSubmitting(true);
    try {
      const response = await updateUser(user._id, formData);
      if (response.success) {
        setProfileUser(response.data);
        updateContextUser(response.data);
        setIsProfileModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePost = async (postId: string, formData: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await updatePost(postId, formData);
      if (response.success) {
        // Refresh first page or find and update in local state
        // For simplicity and grouping consistency, we refresh
        setPage(1);
        await fetchProfile(1, false);
        setIsPostModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error updating post:", error);
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this crumb?")) return;
    setIsSubmitting(true);
    try {
      const response = await deletePost(postId);
      if (response.success) {
        setPosts(prev => prev.filter(p => p._id !== postId));
        setIsPostModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error deleting post:", error);
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-[#F7F3F0] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B5E34]" />
      </div>
    );
  }

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F3F0] pb-20">
      <div className="max-w-[1400px] mx-auto pt-8 px-10">
        
        {/* Header */}
        <div className="flex items-center gap-10 mb-12 bg-white/40 p-6 rounded-[1.5rem] border border-white/60 shadow-sm">
          <img 
            src={getImageUrl(profileUser?.profileUrl)} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md bg-stone-200" 
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-[#2D2621]">{profileUser?.fullName || 'Traveler'}</h2>
              <span className="text-[#8B5E34] text-sm font-medium opacity-60">
                @{profileUser?.username || 'user'}
              </span>
              {user?._id === profileUser?._id && (
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="ml-auto p-2 text-stone-300 hover:text-[#2D2621] transition-colors"
                >
                  <Settings size={20} />
                </button>
              )}
            </div>
            <p className="text-[#8B5E34] text-xs mb-4 max-w-xl font-medium leading-relaxed">
              {profileUser?.bio || "Exploring the world one crumb at a time."}
            </p>
            <div className="flex gap-10 border-t border-[#D2B48C]/10 pt-4">
              <div className="flex gap-1.5 items-baseline">
                <span className="font-bold text-sm">{trips.length}</span>
                <span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Trips</span>
              </div>
              <div className="flex gap-1.5 items-baseline text-sm">
                <span className="font-bold">{posts.length}</span>
                <span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Crumbs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {trips.length > 0 ? trips.map((trip, tripIdx) => (
          <div key={trip.title} className="mb-14">
            <div className="flex items-center justify-between mb-4 border-b border-[#D2B48C]/10 pb-2">
              <h3 className="text-base font-bold text-[#4A3728] uppercase tracking-[0.15em]">{trip.title}</h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{trip.date}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {trip.crumbs.map((crumb, crumbIdx) => {
                const isLastElement = tripIdx === trips.length - 1 && crumbIdx === trip.crumbs.length - 1;
                return (
                  <div 
                    key={crumb._id} 
                    ref={isLastElement ? lastPostElementRef : null}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm bg-stone-200"
                  >
                    <img src={getImageUrl(crumb.imageAttachmentUrl)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-[#2D2621]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-2 text-white p-2">
                      {user?._id === crumb.ownerId && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPost(crumb);
                            setIsPostModalOpen(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><Heart size={16} fill="white" /> <span className="text-xs font-bold">{crumb.likesCount}</span></div>
                        <div className="flex items-center gap-1.5"><MessageCircle size={16} fill="white" /> <span className="text-xs font-bold">{crumb.commentsCount}</span></div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 opacity-90">
                        <MapPin size={10} className="text-[#D2B48C]" /> {crumb.location}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )) : !loading && (
          <div className="text-center py-20">
            <p className="text-[#8B5E34] opacity-60 italic">No crumbs found. Start sharing your journey!</p>
          </div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B5E34]" />
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && profileUser && (
        <EditProfileModal 
          user={profileUser} 
          onClose={() => setIsProfileModalOpen(false)} 
          onSave={handleUpdateProfile}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Post Edit Modal */}
      {isPostModalOpen && selectedPost && (
        <EditPostModal 
          post={selectedPost} 
          onClose={() => setIsPostModalOpen(false)} 
          onSave={(fd) => handleUpdatePost(selectedPost._id, fd)}
          onDelete={() => handleDeletePost(selectedPost._id)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

// --- Modals ---

const EditProfileModal = ({ user, onClose, onSave, isSubmitting }: { user: UserResponse, onClose: () => void, onSave: (fd: FormData) => void, isSubmitting: boolean }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    fullName: user.fullName,
    bio: user.bio || ''
  });
  const [preview, setPreview] = useState(user.profileUrl ? (user.profileUrl.startsWith('http') ? user.profileUrl : `http://localhost:3000${user.profileUrl}`) : '');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('username', formData.username);
    fd.append('fullName', formData.fullName);
    fd.append('bio', formData.bio);
    if (file) fd.append('image', file);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
      <div className="bg-[#FAF9F6] w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-[#2D2621] mb-8 tracking-tight">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-28 h-28 rounded-full overflow-hidden bg-stone-100 border-2 border-white shadow-md cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={24} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60">Change Photo</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Full Name</label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Username</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Bio</label>
              <textarea 
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter resize-none h-20"
                maxLength={200}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#2D2621] text-white py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

const EditPostModal = ({ post, onClose, onSave, onDelete, isSubmitting }: { post: PostResponse, onClose: () => void, onSave: (fd: FormData) => void, onDelete: () => void, isSubmitting: boolean }) => {
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    location: post.location
  });
  const [preview, setPreview] = useState(post.imageAttachmentUrl ? (post.imageAttachmentUrl.startsWith('http') ? post.imageAttachmentUrl : `http://localhost:3000${post.imageAttachmentUrl}`) : '');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('content', formData.content);
    fd.append('location', formData.location);
    if (file) fd.append('image', file);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
      <div className="bg-[#FAF9F6] w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative flex flex-col md:flex-row gap-8">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"><X size={20} /></button>
        
        <div className="flex-1 space-y-4">
          <div 
            className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer group relative shadow-inner"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera size={32} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button 
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-2 w-full text-[11px] uppercase font-bold tracking-widest text-[#8B5E34] hover:text-red-500 transition-colors py-2"
          >
            <Trash2 size={14} /> Delete Crumb
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#2D2621] tracking-tight">Edit Crumb</h2>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Trip Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter placeholder:tracking-tighter"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter placeholder:tracking-tighter"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Content</label>
              <textarea 
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter placeholder:tracking-tighter resize-none h-32"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#2D2621] text-white py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Crumb'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;