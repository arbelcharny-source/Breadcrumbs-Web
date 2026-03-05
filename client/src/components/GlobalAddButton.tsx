import { useState, useRef } from 'react';
import { Plus, X, Camera, MapPin, Loader2 } from 'lucide-react';
import { createPost } from '../services/user-service';

const FloatingAddButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    location: ''
  });
  const [preview, setPreview] = useState<string | null>(null);
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
    if (!file) {
      alert("Please upload an image for your crumb.");
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('tripName', formData.title); // Using tripName as per controller expectations
    fd.append('content', formData.content);
    fd.append('location', formData.location);
    fd.append('image', file);

    try {
      const response = await createPost(fd);
      if (response.success) {
        setIsOpen(false);
        setFormData({ title: '', content: '', location: '' });
        setFile(null);
        setPreview(null);
        // Dispatch event to refresh profile if we are on it
        window.dispatchEvent(new CustomEvent('post-created'));
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create crumb. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 z-50 w-16 h-16 bg-[#2D2621] text-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
          <div className="bg-[#FAF9F6] w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative flex flex-col md:flex-row gap-8 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"
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
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-[#2D2621] tracking-tighter mb-1">New Crumb</h2>
                  <p className="text-[#8B5E34] text-xs font-medium opacity-60">Add a moment to your journal</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Trip Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Summer in Italy"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] font-medium"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Location</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-1 top-1/2 -translate-y-1/2 text-[#D2B48C]" />
                    <input 
                      type="text" 
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 pl-7 pr-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#8B5E34] opacity-60 ml-1">Description</label>
                  <textarea 
                    placeholder="What happened here?"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-transparent border-b border-[#D2B48C]/30 py-2 px-1 focus:outline-none focus:border-[#2D2621] transition-colors text-[#2D2621] font-medium resize-none h-24"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#2D2621] text-white py-4 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Drop Crumb'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAddButton;