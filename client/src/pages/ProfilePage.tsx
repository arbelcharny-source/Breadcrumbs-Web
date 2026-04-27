import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { Loader2 } from 'lucide-react';
import { getUserProfile, updateUser, updatePost, deletePost, toggleLike, type UserResponse, type PostResponse } from '../services/user-service';
import ProfileHeader from '../components/profile/ProfileHeader';
import TripsGrid, { type GroupedTrip } from '../components/profile/TripsGrid';
import EditProfileModal from '../components/profile/EditProfileModal';
import EditCrumbModal from '../components/EditCrumbModal';
import ExpandCrumbModal from '../components/ExpandCrumbModal';

const ProfilePage = () => {
  const { user, updateUser: updateContextUser, logout } = useUser();
  const [profileUser, setProfileUser] = useState<UserResponse | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // Find the owner info from the existing post
        const existingPost = posts.find(p => p._id === postId);
        const updatedPost = { ...response.data, ownerId: existingPost?.ownerId };
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
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
    // confirmation handled in modal
    setIsSubmitting(true);
    try {
      const response = await deletePost(postId);
      if (response.success) {
        setPosts(prev => prev.filter(p => p._id !== postId));
        setIsPostModalOpen(false);
        setIsExpandModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error deleting post:", error);
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (post: PostResponse) => {
    try {
      const response = await toggleLike(post._id);
      if (response.success) {
        setPosts(prev => prev.map(p => p._id === post._id ? response.data : p));
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      handleAuthError(error);
    }
  };

  const handleExpandPost = (post: PostResponse) => {
    setSelectedPost(post);
    setIsExpandModalOpen(true);
  };

  const handlePostUpdate = (updatedPost: PostResponse) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-[#F7F3F0] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B5E34]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3F0] pb-20">
      <div className="max-w-[1400px] mx-auto pt-6 px-4 md:pt-8 md:px-10">
        
        <ProfileHeader 
          user={user} 
          profileUser={profileUser} 
          tripsCount={trips.length} 
          postsCount={posts.length} 
          onOpenSettings={() => setIsProfileModalOpen(true)} 
        />

        {trips.length > 0 ? (
          <TripsGrid 
            trips={trips} 
            user={user} 
            lastPostElementRef={lastPostElementRef} 
            onEditPost={(crumb) => {
              setSelectedPost(crumb);
              setIsPostModalOpen(true);
            }} 
            onLike={handleLike}
            onComment={handleExpandPost}
            onExpandPost={handleExpandPost}
          />
        ) : !loading && (
          <div className="text-center py-20">
            <p className="text-[#8B5E34] opacity-60 italic">No crumbs found. Start sharing your journey!</p>
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B5E34]" />
          </div>
        )}
      </div>

      {isProfileModalOpen && profileUser && (
        <EditProfileModal 
          user={profileUser} 
          onClose={() => setIsProfileModalOpen(false)} 
          onSave={handleUpdateProfile}
          isSubmitting={isSubmitting}
        />
      )}

      {isPostModalOpen && selectedPost && (
        <EditCrumbModal 
          post={selectedPost} 
          onClose={() => setIsPostModalOpen(false)} 
          onSave={(fd) => handleUpdatePost(selectedPost._id, fd)}
          onDelete={() => handleDeletePost(selectedPost._id)}
          isSubmitting={isSubmitting}
        />
      )}

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

export default ProfilePage;
