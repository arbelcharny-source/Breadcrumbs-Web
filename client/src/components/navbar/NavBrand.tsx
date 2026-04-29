import { Link } from 'react-router-dom';
import logo from '../../assets/Logo.png';

const NavBrand = () => {
  return (
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <img src={logo} alt="Breadcrumbs" className="w-8 h-8 object-contain" />
      <span className="text-xl font-bold text-[#2D2621] tracking-tighter hidden sm:inline">Breadcrumbs</span>
    </Link>
  );
};

export default NavBrand;
