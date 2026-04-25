import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Navbar from "./components/navbar/NavBar";
import ProfilePage from "./pages/ProfilePage";
import ExplorePage from "./pages/ExplorePage";
import ChatPage from "./pages/ChatPage";
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
                <Navigate to="/explore" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            <Route path="/register" element={!user ? <Register /> : <Navigate to="/profile" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/profile" />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/explore" element={user ? <ExplorePage /> : <Navigate to="/login" />} />
            <Route path="/messages" element={user ? <ChatPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {user && <FloatingAddButton />}
      </div>
    </Router>
  );
}

export default App;
