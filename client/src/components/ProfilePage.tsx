import { useUser } from '../context/UserContext';
import { Settings, MapPin, Heart, MessageCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useUser();

  // נתונים מדומים לחלוקה לטיולים
  const trips = [
    {
      title: "Sri Lanka Expedition",
      date: "March 2026",
      crumbs: [
        { id: 1, url: 'https://images.unsplash.com/photo-1546708973-b339540b5162', location: 'Ella', likes: 24, comments: 5 },
        { id: 2, url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a', location: 'Mirissa', likes: 42, comments: 12 },
      ]
    },
    {
      title: "Paris Weekend",
      date: "January 2026",
      crumbs: [
        { id: 3, url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', location: 'Le Marais', likes: 19, comments: 3 },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F3F0] pb-20">
      <div className="max-w-[1400px] mx-auto pt-8 px-10">
        
        {/* Compact Header */}
        <div className="flex items-center gap-10 mb-12 bg-white/40 p-6 rounded-[1.5rem] border border-white/60 shadow-sm">
          <img 
            src={user?.imgUrl} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md" 
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-[#2D2621]">{user?.fullName || 'Traveler'}</h2>
              <span className="text-[#8B5E34] text-sm font-medium opacity-60">
                @{user?.username || 'user'}
              </span>
              <button className="ml-auto p-2 text-stone-300 hover:text-[#2D2621] transition-colors"><Settings size={20} /></button>
            </div>
            
            <p className="text-[#8B5E34] text-xs mb-4 max-w-xl font-medium leading-relaxed">
              Exploring the world one crumb at a time. Currently planning a trip to Sri Lanka 🇱🇰.
            </p>

            {/* Statistics Schema */}
            <div className="flex gap-10 border-t border-[#D2B48C]/10 pt-4">
              <div className="flex gap-1.5 items-baseline"><span className="font-bold text-sm">{trips.length}</span><span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Trips</span></div>
              <div className="flex gap-1.5 items-baseline text-sm"><span className="font-bold">24</span><span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Crumbs</span></div>
              <div className="flex gap-1.5 items-baseline text-sm"><span className="font-bold">182</span><span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Followers</span></div>
              <div className="flex gap-1.5 items-baseline text-sm"><span className="font-bold">95</span><span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">Following</span></div>
            </div>
          </div>
        </div>

        {/* Trips Sections - Groups of square posts */}
        {trips.map((trip, idx) => (
          <div key={idx} className="mb-14">
            <div className="flex items-center justify-between mb-4 border-b border-[#D2B48C]/10 pb-2">
              <h3 className="text-base font-bold text-[#4A3728] uppercase tracking-[0.15em]">{trip.title}</h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{trip.date}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {trip.crumbs.map((crumb) => (
                <div key={crumb.id} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm bg-stone-200">
                  <img src={crumb.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* Hover Overlay - Likes, Comments & Location */}
                  <div className="absolute inset-0 bg-[#2D2621]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-2 text-white p-2">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5"><Heart size={16} fill="white" /> <span className="text-xs font-bold">{crumb.likes}</span></div>
                      <div className="flex items-center gap-1.5"><MessageCircle size={16} fill="white" /> <span className="text-xs font-bold">{crumb.comments}</span></div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 opacity-90">
                      <MapPin size={10} className="text-[#D2B48C]" /> {crumb.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;