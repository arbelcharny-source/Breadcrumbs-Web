import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { resolveImageUrl } from '../../services/user-service';

const UserActions = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => navigate('/profile')}
        className={`p-0.5 rounded-full border-2 transition-all ${location.pathname === '/profile' ? 'border-[#4A3728]' : 'border-transparent hover:border-[#D2B48C]'}`}
      >
        <img 
          src={resolveImageUrl(user?.profileUrl, 'profile')} 
          alt="Profile" 
          className="w-7 h-7 rounded-full object-cover shadow-sm" 
        />
      </button>
      <button onClick={handleLogout} className="p-2 text-[#8B5E34] hover:text-red-600 transition-colors">
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserActions;
