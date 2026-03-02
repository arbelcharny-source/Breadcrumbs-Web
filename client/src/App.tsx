import GoogleLoginComp from "./components/GoogleLoginComp";
import { useUser } from "./context/UserContext";

function App() {
  const { user, logout } = useUser();

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Breadcrumbs 🍞</h1>

      {user ? (
        <div>
          <h3>ברוכה הבאה, {user.username || "משתמשת יקרה"}!</h3>
          
          {user.imgUrl && (
            <img 
              src={user.imgUrl} 
              alt="Profile" 
              style={{ width: "50px", borderRadius: "50%" }} 
            />
          )}
          
          <p>האימייל שלך: {user.email}</p>
          
          <button 
            onClick={logout}
            style={{ padding: "10px", backgroundColor: "#ff4d4d", color: "white", border: "none", cursor: "pointer" }}
          >
            התנתקות (Logout)
          </button>
        </div>
      ) : (
        <div>
          <p>אנא התחברי כדי להמשיך</p>
          <GoogleLoginComp />
        </div>
      )}
    </div>
  );
}

export default App;