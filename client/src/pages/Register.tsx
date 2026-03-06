import { useNavigate } from "react-router-dom";
import AuthForm from "../components/auth/AuthForm";

const Register = () => {
  const navigate = useNavigate();

  const handleToggleAuth = () => navigate("/login");

  return <AuthForm isLogin={false} toggleAuth={handleToggleAuth} />;
};

export default Register;
