import { Settings } from 'lucide-react';
import { type UserResponse, resolveImageUrl } from '../../services/user-service';

interface ProfileHeaderProps {
  user: any; 
  profileUser: UserResponse | null;
  tripsCount: number;
  postsCount: number;
  onOpenSettings: () => void;
}

const ProfileHeader = ({ user, profileUser, tripsCount, postsCount, onOpenSettings }: ProfileHeaderProps) => {
  return (
    <div className="flex items-center gap-10 mb-12 bg-white/40 p-6 rounded-[1.5rem] border border-white/60 shadow-sm">
      <img 
        src={resolveImageUrl(profileUser?.profileUrl, 'profile')} 
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
              onClick={onOpenSettings}
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
            <span className="font-bold text-sm">{tripsCount}</span>
            <span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Trips</span>
          </div>
          <div className="flex gap-1.5 items-baseline text-sm">
            <span className="font-bold">{postsCount}</span>
            <span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Crumbs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
