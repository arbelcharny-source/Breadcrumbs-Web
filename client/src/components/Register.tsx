import { useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";

const Register = () => {
  const navigate = useNavigate();
  return <AuthForm isLogin={false} toggleAuth={() => navigate("/login")} />;
};

export default Register;