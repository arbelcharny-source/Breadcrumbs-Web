import { MapPin, Heart, MessageCircle, Edit3 } from 'lucide-react';
import { type PostResponse, resolveImageUrl } from '../../services/user-service';

export interface GroupedTrip {
  title: string;
  date: string;
  crumbs: PostResponse[];
}

interface TripsGridProps {
  trips: GroupedTrip[];
  user: any; 
  lastPostElementRef: (node: HTMLDivElement) => void;
  onEditPost: (post: PostResponse) => void;
  onLike: (post: PostResponse) => void;
  onComment: (post: PostResponse) => void;
}

const TripsGrid = ({ trips, user, lastPostElementRef, onEditPost, onLike, onComment }: TripsGridProps) => {
  return (
    <>
      {trips.map((trip, tripIdx) => (
        <div key={trip.title} className="mb-14">
          <div className="flex items-center justify-between mb-4 border-b border-[#D2B48C]/10 pb-2">
            <h3 className="text-base font-bold text-[#4A3728] uppercase tracking-[0.15em]">{trip.title}</h3>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{trip.date}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
            {trip.crumbs.map((crumb, crumbIdx) => {
              const isLastElement = tripIdx === trips.length - 1 && crumbIdx === trip.crumbs.length - 1;
              return (
                <div 
                  key={crumb._id} 
                  ref={isLastElement ? lastPostElementRef : null}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm bg-stone-200"
                >
                  <img src={resolveImageUrl(crumb.imageAttachmentUrl, 'post')} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[#2D2621]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-2 text-white p-2">
                    {user?._id === crumb.ownerId && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPost(crumb);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    <div className="flex gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onLike(crumb); }}
                        className={`flex items-center gap-1.5 hover:scale-110 transition-transform ${user && crumb.likes?.includes(user._id) ? 'text-red-500' : 'text-white'}`}
                      >
                        <Heart size={16} fill={user && crumb.likes?.includes(user._id) ? "currentColor" : "transparent"} className={user && crumb.likes?.includes(user._id) ? "" : "stroke-white"} /> 
                        <span className="text-xs font-bold">{crumb.likes ? crumb.likes.length : crumb.likesCount}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onComment(crumb); }}
                        className="flex items-center gap-1.5 hover:scale-110 transition-transform"
                      >
                        <MessageCircle size={16} fill="white" /> 
                        <span className="text-xs font-bold">{crumb.commentsCount}</span>
                      </button>
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
      ))}
    </>
  );
};

export default TripsGrid;
