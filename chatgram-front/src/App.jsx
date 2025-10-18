import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatBox from "./components/Chatbox";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import { ThemeProvider } from "./context/ThemeContext";
import { API_BASE_URL } from "./config/api";

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
        
        const res = await fetch(`${API_BASE_URL}/api/chats/${user.user._id}`, {
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
      
      const res = await fetch(`${API_BASE_URL}/api/chats/${user.user._id}`, {
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
    <ThemeProvider>
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
              <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
                {/* Sidebar - Hidden on mobile when chat is selected, always visible on desktop */}
                <div className={`${currentChat ? 'hidden md:block' : 'block'} w-full md:w-1/3 lg:w-1/4`}>
                  <Sidebar 
                    user={user}
                    chats={chats} 
                    setCurrentChat={setCurrentChat}
                    refreshChats={refreshChats}
                  />
                </div>
                
                {/* Chatbox - Hidden on mobile when no chat selected */}
                <div className={`${currentChat ? 'block' : 'hidden md:flex'} flex-1`}>
                  {currentChat ? (
                    <ChatBox 
                      chat={currentChat}
                      user={user}
                      setCurrentChat={setCurrentChat}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 p-4 text-center">
                      <div>
                        <div className="text-6xl md:text-8xl mb-4">💬</div>
                        <p className="text-base md:text-lg">Select a chat to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
