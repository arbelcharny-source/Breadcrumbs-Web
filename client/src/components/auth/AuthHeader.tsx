import logo from '../../assets/Logo.png';

const AuthHeader = () => {
  return (
    <div className="flex flex-col items-center mb-8">
      <img 
        src={logo} 
        alt="Breadcrumbs Logo" 
        className="w-36 h-36 object-contain mb-6 drop-shadow-sm hover:scale-105 transition-transform duration-300"
      />
      <h1 className="text-4xl font-bold text-[#2D2621] mb-1 tracking-tight">Breadcrumbs</h1>
      <p className="text-[#8B5E34] font-light tracking-wide">Your Travel Memories</p>
    </div>
  );
};

export default AuthHeader;
