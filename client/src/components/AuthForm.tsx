import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { login as loginService, register as registerService } from '../services/user-service';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import GoogleLoginComp from './GoogleLoginComp';
import logo from '../assets/Logo.png';

interface AuthFormProps {
  isLogin: boolean;
  toggleAuth: () => void;
}

const MIN_USERNAME_LENGHT = 2
const MIN_PASSWORD_LENGHT = 6

const AuthForm = ({ isLogin, toggleAuth }: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', fullName: '', password: '' });
  const [error, setError] = useState("");
  const { login } = useUser();

  const validate = () => {
    if (!isLogin) {
      if (!formData.username || formData.username.length < MIN_USERNAME_LENGHT) return "Username too short";
      if (!formData.fullName) return "Full name is required";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Invalid email address";
    if (formData.password.length < MIN_PASSWORD_LENGHT) return "Password must be at least 6 characters";
    
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    try {
      const response = isLogin 
        ? await loginService({ username: formData.email, password: formData.password }) 
        : await registerService(formData);
      
      login(response.data.user, response.data.accessToken, response.data.refreshToken);
    } catch (err: any) {
      setError(err.response?.data?.error || "Action failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3F0] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center mb-8">
        <img 
          src={logo} 
          alt="Breadcrumbs Logo" 
          className="w-36 h-36 object-contain mb-6 drop-shadow-sm hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-4xl font-bold text-[#2D2621] mb-1 tracking-tight">Breadcrumbs</h1>
        <p className="text-[#8B5E34] font-light tracking-wide">Your Travel Memories</p>
      </div>

      <div className="w-full max-w-md bg-white/60 backdrop-blur-md p-10 rounded-[3rem] shadow-sm border border-[#D2B48C]/20">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 bg-input-gray border-none rounded-full focus:ring-2 focus:ring-[#D2B48C] outline-none transition-all placeholder:text-stone-400"
                />
              </div>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Full name" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 bg-input-gray border-none rounded-full focus:ring-2 focus:ring-[#D2B48C] outline-none transition-all placeholder:text-stone-400"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-14 pr-6 py-4 bg-input-gray border-none rounded-full focus:ring-2 focus:ring-[#D2B48C] outline-none transition-all placeholder:text-stone-400"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-14 pr-14 py-4 bg-input-gray border-none rounded-full focus:ring-2 focus:ring-[#D2B48C] outline-none transition-all placeholder:text-stone-400"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm px-4 font-medium text-center">{error}</p>}

          <button type="submit" className="w-full bg-[#4A3728] text-white font-bold py-4 rounded-full shadow-lg hover:bg-[#3d2d21] transform hover:scale-[1.01] active:scale-[0.99] transition-all mt-2 text-lg">
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-stone-100"></div>
            <span className="px-4 text-[10px] text-stone-400 uppercase tracking-widest font-bold">or</span>
            <div className="flex-1 border-t border-stone-100"></div>
          </div>

          <GoogleLoginComp />
        </form>

        <p className="text-center mt-8 text-sm text-stone-500 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={toggleAuth}
            className="text-[#4A3728] font-bold hover:text-[#3d2d21] transition-colors"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;