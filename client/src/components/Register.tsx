import { useState } from "react";
import { register } from "../services/user-service";
import { useUser } from "../context/UserContext";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { login } = useUser();

  const validate = () => {
    if (!formData.username || formData.username.length < 2) return "שם משתמש חייב להכיל לפחות 2 תווים";
    if (!formData.fullName) return "חובה להזין שם מלא";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "אימייל לא תקין";
    if (formData.password.length < 6) return "סיסמה חייבת להכיל לפחות 6 תווים";
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
      const response = await register(formData);
      login(response.data.user, response.data.accessToken, response.data.refreshToken);
      alert("נרשמת בהצלחה!");
    } catch (err: any) {
      setError(err.response?.data?.error || "הרשמה נכשלה. ייתכן והמשתמש כבר קיים.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>הרשמה ל-Breadcrumbs 🍞</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          placeholder="שם משתמש"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          type="text"
          placeholder="שם מלא"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        />
        <input
          type="email"
          placeholder="אימייל"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        
        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
        
        <button type="submit" style={{ padding: "10px", cursor: "pointer" }}>
          הירשם
        </button>
      </form>
    </div>
  );
};

export default Register;