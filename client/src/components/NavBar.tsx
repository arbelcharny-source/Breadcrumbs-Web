import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Compass, MessageCircle, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import logo from '../assets/Logo.png';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // פונקציית עזר ליצירת מחלקות ה-Pill hover
  const getLinkClass = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
    ${location.pathname === path 
      ? 'bg-[#4A3728] text-white shadow-md' 
      : 'text-[#4A3728] hover:bg-[#D2B48C]/20'}
  `;

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#D2B48C]/10 px-8 py-3">
      <div className="w-full flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Breadcrumbs" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-[#2D2621] tracking-tighter lowercase">breadcrumbs</span>
        </Link>

        {/* Navigation - Pill Hover Style */}
        <div className="flex items-center gap-4">
          <Link to="/explore" className={getLinkClass('/explore')}>
            <Compass size={18} />
            <span className="text-sm font-bold tracking-tight">Explore</span>
          </Link>
          <Link to="/messages" className={getLinkClass('/messages')}>
            <MessageCircle size={18} />
            <span className="text-sm font-bold tracking-tight">Messages</span>
          </Link>
          
          <div className="h-6 w-[1px] bg-[#D2B48C]/20 mx-2"></div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')}
              className={`p-0.5 rounded-full border-2 transition-all ${location.pathname === '/profile' ? 'border-[#4A3728]' : 'border-transparent hover:border-[#D2B48C]'}`}
            >
              <img 
                src={user?.imgUrl || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                className="w-7 h-7 rounded-full object-cover shadow-sm" 
              />
            </button>
            <button onClick={logout} className="p-2 text-[#8B5E34] hover:text-red-600 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;