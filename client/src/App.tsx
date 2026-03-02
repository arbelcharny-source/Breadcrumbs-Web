import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Register from "./components/Register";
import Login from "./components/Login";
import GoogleLoginComp from "./components/GoogleLoginComp";

function App() {
  const { user, logout } = useUser();

  return (
    <Router>
      <nav style={{ 
        padding: "20px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: "1px solid #eee" 
      }}>
        <Link to="/" style={{ fontSize: "24px", fontWeight: "bold", textDecoration: "none", color: "black" }}>
          Breadcrumbs 🍞
        </Link>
        
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {!user ? (
            <>
              <Link to="/login">התחברות</Link>
              <Link to="/register">הרשמה</Link>
            </>
          ) : (
            <>
              <span>שלום, <strong>{user.username}</strong></span>
              <Link to="/profile">פרופיל</Link>
              <button onClick={logout} style={{ cursor: "pointer" }}>התנתק</button>
            </>
          )}
        </div>
      </nav>

      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={
            <div>
              <h1>ברוכים הבאים ל-Breadcrumbs!</h1>
              <p>שתפו את חוויות הטיול שלכם.</p>
              {!user && <GoogleLoginComp />}
            </div>
          } />

          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <div>מסך פרופיל (בקרוב...)</div> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;