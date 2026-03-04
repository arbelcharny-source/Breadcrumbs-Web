import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Register from "./components/Register";
import Login from "./components/Login";
import Navbar from "./components/NavBar";
import ProfilePage from "./components/ProfilePage";
import FloatingAddButton from "./components/GlobalAddButton"; // 1. ייבוא הקומפוננטה

function App() {
  const { user } = useUser();

  return (
    <Router>
      <div className="min-h-screen bg-[#F7F3F0]">
        
        {/* ה-Navbar מופיע רק אם המשתמש מחובר */}
        {user && <Navbar />}

        <main>
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
                <h1 className="text-6xl font-bold text-[#2D2621] mb-6 tracking-tighter lowercase">Capture your journey.</h1>
                <p className="text-xl text-[#8B5E34] font-light max-w-2xl leading-relaxed mb-10">
                  Every step is a story. Document your travels with high-design journals and share your path with the world.
                </p>
                {!user ? (
                   <div className="flex gap-4">
                     <button onClick={() => window.location.href='/login'} className="bg-white text-[#4A3728] border border-[#D2B48C]/40 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-stone-50 transition-all shadow-sm">Sign In</button>
                     <button onClick={() => window.location.href='/register'} className="bg-[#4A3728] text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:bg-[#3d2d21] transform hover:scale-105 transition-all">Start Your Journal</button>
                   </div>
                ) : (
                  <button onClick={() => window.location.href='/profile'} className="bg-[#4A3728] text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:bg-[#3d2d21] transition-all">Go to My Profile</button>
                )}
              </div>
            } />

            <Route path="/register" element={!user ? <Register /> : <Navigate to="/profile" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/profile" />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {user && <FloatingAddButton />}
      </div>
    </Router>
  );
}

export default App;