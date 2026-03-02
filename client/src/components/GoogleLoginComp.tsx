import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { googleSignin } from "../services/user-service";
import { useUser } from "../context/UserContext";

const GoogleLoginComp = () => {
  const { login } = useUser();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { credential } = credentialResponse;

      if (credential) {
        const serverResponse = await googleSignin(credential);

        const userData = serverResponse.data.user;
        const token = serverResponse.data.accessToken;

        const fixedUser = { 
            ...userData, 
            imgUrl: userData.profileUrl 
        };

        login(fixedUser, token);
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
      />
    </div>
  );
};

export default GoogleLoginComp;