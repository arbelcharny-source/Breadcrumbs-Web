import { useState } from "react";
import { login as loginService } from "../services/user-service";
import { useUser } from "../context/UserContext";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginService(credentials);
      login(response.data.user, response.data.accessToken, response.data.refreshToken);
      alert("התחברת בהצלחה!");
    } catch (err: any) {
      setError(err.response?.data?.error || "שם משתמש או סיסמה שגויים");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>התחברות ל-Breadcrumbs 🍞</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          placeholder="שם משתמש"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">התחבר</button>
      </form>
    </div>
  );
};

export default Login;