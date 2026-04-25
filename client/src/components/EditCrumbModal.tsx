import { useState, useRef } from 'react';
import { X, Camera, MapPin, Loader2, Trash2 } from 'lucide-react';
import { type PostResponse, resolveImageUrl } from '../services/user-service';
import { useUser } from '../context/UserContext';
import Input from './common/Input';

interface EditCrumbModalProps {
  post: PostResponse;
  onClose: () => void;
  onSave: (fd: FormData) => void;
  onDelete: () => void;
  isSubmitting: boolean;
}

const EditCrumbModal = ({ post, onClose, onSave, onDelete, isSubmitting }: EditCrumbModalProps) => {
  const { logout } = useUser();
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    location: post.location,
    hashtags: post.hashtags?.join(', ') || ''
  });
  const [preview, setPreview] = useState<string | null>(resolveImageUrl(post.imageAttachmentUrl));
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('content', formData.content);
    fd.append('location', formData.location);
    if (formData.hashtags.trim()) {
      fd.append('hashtags', formData.hashtags);
    }
    if (file) {
      fd.append('image', file);
    }

    try {
      onSave(fd);
    } catch (error: any) {
      console.error("Update failed:", error.response?.data || error.message);
      alert("Failed to update crumb. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 bg-black/20 backdrop-blur-md">
      <div className="bg-[#FAF9F6] w-full max-w-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative flex flex-col md:flex-row gap-6 md:gap-8 overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"
        >
          <X size={24} />
        </button>
        
        <div className="flex-1 space-y-4">
          <div 
            className="aspect-square w-full rounded-3xl overflow-hidden bg-stone-100 cursor-pointer group relative shadow-inner border-2 border-dashed border-[#D2B48C]/30 flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#8B5E34] opacity-40">
                <Camera size={40} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Upload Photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera size={32} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          
          <button 
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-2 w-full text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] hover:text-red-500 transition-colors py-2"
          >
            <Trash2 size={14} /> Delete Crumb
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 md:space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#2D2621] tracking-tighter mb-1">Edit Crumb</h2>
              <p className="text-[#8B5E34] text-xs font-medium opacity-60">Update your journey memory</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Trip Name</label>
              <Input 
                type="text" 
                placeholder="e.g., Summer in Italy"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                variant="modal"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Location</label>
              <Input 
                type="text" 
                placeholder="City, Country"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                Icon={MapPin}
                variant="modal"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Hashtags</label>
              <Input 
                type="text" 
                placeholder="e.g. food, nature, fun (comma separated)"
                value={formData.hashtags}
                onChange={e => setFormData({...formData, hashtags: e.target.value})}
                variant="modal"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Description</label>
              <textarea 
                placeholder="What happened here?"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] tracking-tighter placeholder:tracking-tighter resize-none h-24"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#2D2621] text-white py-4 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Crumb'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditCrumbModal;
