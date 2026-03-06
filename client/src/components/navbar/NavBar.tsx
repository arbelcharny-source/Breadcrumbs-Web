import NavBrand from './NavBrand';
import NavLinks from './NavLinks';
import UserActions from './UserActions';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#D2B48C]/10 px-8 py-3">
      <div className="w-full flex items-center justify-between">
        <NavBrand />

        <div className="flex items-center gap-4">
          <NavLinks />
          
          <div className="h-6 w-[1px] bg-[#D2B48C]/20 mx-2"></div>

          <UserActions />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
