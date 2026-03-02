import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { googleSignin } from "../services/user-service";

const GoogleLoginComp = () => {
  
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { credential } = credentialResponse;
      
      if (credential) {
        console.log("Google Token received:", credential);
        
        const serverResponse = await googleSignin(credential);
        console.log("Server login success:", serverResponse);
        
        alert("התחברת בהצלחה! בדוק את הקונסול לפרטים.");
      }
    } catch (error) {
      console.error("Login process failed:", error);
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
  };

  return (
    <div style={{ margin: "20px" }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
      />
    </div>
  );
};

export default GoogleLoginComp;