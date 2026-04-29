import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AddPostModal from './AddPostModal';

const FloatingAddButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleSuccess = () => {
    setIsOpen(false);
    navigate('/explore');
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 w-14 h-14 md:w-16 md:h-16 bg-[#2D2621] text-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <Plus className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <AddPostModal 
          onClose={handleClose} 
          onSuccess={handleSuccess} 
        />
      )}
    </>
  );
};

export default FloatingAddButton;
