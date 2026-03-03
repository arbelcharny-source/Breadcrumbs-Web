import { useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";

const Login = () => {
  const navigate = useNavigate();
  return <AuthForm isLogin={true} toggleAuth={() => navigate("/register")} />;
};

export default Login;