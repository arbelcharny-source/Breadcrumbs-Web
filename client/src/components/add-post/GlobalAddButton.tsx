import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddPostModal from './AddPostModal';

const FloatingAddButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleSuccess = () => setIsOpen(false);

  return (
    <>
      <button 
        onClick={handleOpen}
        className="fixed bottom-10 right-10 z-50 w-16 h-16 bg-[#2D2621] text-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
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
