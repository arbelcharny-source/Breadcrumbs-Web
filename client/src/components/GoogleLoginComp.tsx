import { useGoogleLogin } from "@react-oauth/google";
import { googleSignin } from "../services/user-service";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const GoogleLoginComp = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await googleSignin(tokenResponse.access_token);
        const { user, accessToken, refreshToken } = response.data;

        login(
          user, 
          accessToken, 
          refreshToken
        );
        
        navigate("/profile");
      } catch (error) {
        console.error("Login process failed:", error);
      }
    },
    onError: () => console.error("Google Login Failed"),
  });

  return (
    <button
      type="button"
      onClick={() => handleGoogleLogin()}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-4 rounded-full font-bold hover:bg-gray-50 transform hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm"
    >
      <img 
        src="https://www.google.com/favicon.ico" 
        alt="google" 
        className="w-5 h-5"
      />
      <span className="text-base tracking-tight">Continue with Google</span>
    </button>
  );
};

export default GoogleLoginComp;