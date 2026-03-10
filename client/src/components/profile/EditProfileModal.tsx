import { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { type UserResponse, resolveImageUrl } from '../../services/user-service';
import Input from '../common/Input';

interface EditProfileModalProps {
  user: UserResponse;
  onClose: () => void;
  onSave: (fd: FormData) => void;
  isSubmitting: boolean;
}

const EditProfileModal = ({ user, onClose, onSave, isSubmitting }: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    username: user.username,
    fullName: user.fullName,
    bio: user.bio || ''
  });
  const [preview, setPreview] = useState(() => resolveImageUrl(user.profileUrl, 'profile'));
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('username', formData.username);
    fd.append('fullName', formData.fullName);
    fd.append('bio', formData.bio);
    if (file) fd.append('image', file);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
      <div className="bg-[#FAF9F6] w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
        <h2 className="text-2xl font-bold text-[#2D2621] mb-8 tracking-tight">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative w-28 h-28 rounded-full overflow-hidden bg-stone-100 border-2 border-white shadow-md cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={24} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60">Change Photo</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Full Name</label>
              <Input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                variant="modal"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Username</label>
              <Input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                variant="modal"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Bio</label>
              <textarea 
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter resize-none h-20"
                maxLength={200}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#2D2621] text-white py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
