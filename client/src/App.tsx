import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Register from "./components/Register";
import Login from "./components/Login";

function App() {
  const { user } = useUser();

  return (
    <Router>
      <div className="min-h-screen bg-[#FFF5EC]">
        <main>
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-6xl font-serif font-bold text-[#2D2D2D] mb-6 tracking-tight">Capture your journey.</h1>
                <p className="text-xl text-gray-500 font-light max-w-2xl leading-relaxed mb-10">
                  Every step is a story. Document your travels with high-design journals and share your path with the world.
                </p>
                {!user ? (
                   <div className="flex gap-4">
                     <button onClick={() => window.location.href='/login'} className="bg-white text-[#FF8422] border border-[#FF8422] px-10 py-4 rounded-2xl text-lg font-bold hover:bg-orange-50 transition-all">Sign In</button>
                     <button onClick={() => window.location.href='/register'} className="bg-[#FF8422] text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:bg-[#e6761d] transform hover:scale-105 transition-all">Start Your Journal</button>
                   </div>
                ) : (
                  <button onClick={() => window.location.href='/profile'} className="bg-[#FF8422] text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl hover:bg-[#e6761d] transition-all">Go to My Profile</button>
                )}
              </div>
            } />

            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <div className="p-10 text-center font-serif text-3xl">Coming Soon...</div> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;