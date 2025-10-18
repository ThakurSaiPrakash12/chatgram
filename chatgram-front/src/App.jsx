import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatBox from "./components/Chatbox";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

function App() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("chatgramUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchChats = async () => {
      try {
        if (!user?.user?._id) return;
        
        const res = await fetch(`http://localhost:5000/api/chats/${user.user._id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Accept': 'application/json'
          },
          signal: abortController.signal
        });

        if (!mounted) return;

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to fetch chats:', errorText);
          return;
        }

        const data = await res.json();
        if (mounted) {
          setChats(data);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [user]);

  const refreshChats = async () => {
    try {
      if (!user?.user?._id) return;
      
      const res = await fetch(`http://localhost:5000/api/chats/${user.user._id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        console.error('Failed to fetch chats');
        return;
      }

      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  const PublicRoute = ({ children }) => {
    return !user ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login setUser={setUser} />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <Signup setUser={setUser} />
          </PublicRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile user={user} setUser={setUser} />
          </PrivateRoute>
        } />
        <Route path="/" element={
          <PrivateRoute>
            <div className="flex h-screen">
              <Sidebar 
                user={user}
                chats={chats} 
                setCurrentChat={setCurrentChat}
                refreshChats={refreshChats}
              />
              {currentChat ? (
                <ChatBox 
                  chat={currentChat}
                  user={user}
                  setCurrentChat={setCurrentChat}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Select a chat
                </div>
              )}
            </div>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
