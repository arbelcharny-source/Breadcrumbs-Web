import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Navbar from "./components/navbar/NavBar";
import ProfilePage from "./pages/ProfilePage";
import FloatingAddButton from "./components/add-post/GlobalAddButton";

function App() {
  const { user } = useUser();

  return (
    <Router>
      <div className="min-h-screen bg-[#F7F3F0]">
        {user && <Navbar />}

        <main>
          <Routes>
            <Route path="/" element={
              user ? (
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
                  <h1 className="text-6xl font-bold text-[#2D2621] mb-6 tracking-tighter lowercase">Capture your journey.</h1>
                  <p className="text-xl text-[#8B5E34] font-light max-w-2xl leading-relaxed mb-10">
                    Every step is a story. Document your travels with high-design journals and share your path with the world.
                  </p>
                  <button onClick={() => window.location.href='/profile'} className="bg-[#4A3728] text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:bg-[#3d2d21] transition-all">Go to My Profile</button>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
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
