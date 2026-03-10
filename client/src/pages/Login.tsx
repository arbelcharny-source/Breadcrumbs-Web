import { useNavigate } from "react-router-dom";
import AuthForm from "../components/auth/AuthForm";

const Login = () => {
  const navigate = useNavigate();

  const handleToggleAuth = () => navigate("/register");

  return <AuthForm isLogin={true} toggleAuth={handleToggleAuth} />;
};

export default Login;
