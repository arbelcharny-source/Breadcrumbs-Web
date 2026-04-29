import { Link, useLocation } from 'react-router-dom';
import { Compass, MessageCircle } from 'lucide-react';

const getLinkClass = (path: string, currentPath: string) => `
  flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300
  ${currentPath === path 
    ? 'bg-[#4A3728] text-white shadow-md' 
    : 'text-[#4A3728] hover:bg-[#D2B48C]/20'}
`;

const NavLinks = () => {
  const location = useLocation();

  return (
    <div className="flex items-center gap-4">
      <Link to="/explore" className={getLinkClass('/explore', location.pathname)}>
        <Compass size={18} />
        <span className="text-sm font-bold tracking-tight hidden md:inline">Explore</span>
      </Link>
      <Link to="/messages" className={getLinkClass('/messages', location.pathname)}>
        <MessageCircle size={18} />
        <span className="text-sm font-bold tracking-tight hidden md:inline">Messages</span>
      </Link>
    </div>
  );
};

export default NavLinks;
