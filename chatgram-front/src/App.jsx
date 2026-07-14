import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import ChatBox from "./components/Chatbox";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import { ThemeProvider } from "./context/ThemeContext";
import { API_BASE_URL, SOCKET_URL } from "./config/api";

function App() {
  const [chats, setChats] = useState(() => {
    // Try to load cached chats from localStorage
    try {
      const cachedChats = localStorage.getItem("chatgramChatsCache");
      return cachedChats ? JSON.parse(cachedChats) : [];
    } catch (error) {
      console.error('Error parsing cached chats:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState(() => {
    try {
      const savedChat = localStorage.getItem("chatgramCurrentChat");
      return savedChat ? JSON.parse(savedChat) : null;
    } catch (error) {
      console.error('Error parsing current chat:', error);
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("chatgramUser");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  });
  
  // Single centralized Socket.IO instance and presence state (Phase 7, 8, & 9 timing fix)
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  // Sync Socket.IO connection state with user authentication token
  useEffect(() => {
    if (!user?.token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers({});
      return;
    }

    console.log(`🔌 [App.jsx] Initializing Socket.IO for user ${user?.user?._id || "unknown"}`);

    // Create the Socket.IO client with autoConnect: false to prevent background connection before listeners attach
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: user.token
      },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Register presence listener BEFORE calling connect
    const handleUpdateUsers = (usersList) => {
      const usersObj = {};
      if (Array.isArray(usersList)) {
        usersList.forEach(id => {
          usersObj[id] = true;
        });
      }
      setOnlineUsers(usersObj);
    };

    newSocket.on("update_users", handleUpdateUsers);

    newSocket.on("connect", () => {
      console.log(`🔌 [App.jsx] Socket connected. Socket ID: ${newSocket.id}`);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 [App.jsx] Socket connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log(`🔌 [App.jsx] Socket disconnected due to: ${reason}`);
    });

    // Now call connect after all key event handlers are bound
    newSocket.connect();
    setSocket(newSocket);

    return () => {
      console.log("🔌 [App.jsx] Cleaning up socket connection and listeners");
      newSocket.off("update_users", handleUpdateUsers);
      newSocket.disconnect();
    };
  }, [user]);

  // Save current chat to localStorage whenever it changes
  useEffect(() => {
    if (currentChat) {
      localStorage.setItem("chatgramCurrentChat", JSON.stringify(currentChat));
    } else {
      localStorage.removeItem("chatgramCurrentChat");
    }
  }, [currentChat]);

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchChats = async () => {
      try {
        if (!user?.token) return;
        
        setLoading(true);
        // GET /api/chats derives user identity directly from JWT (Phase 3)
        const res = await fetch(`${API_BASE_URL}/api/chats`, {
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
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (mounted) {
          setChats(data);
          // Cache chats in localStorage for faster initial load
          try {
            localStorage.setItem("chatgramChatsCache", JSON.stringify(data));
          } catch (e) {
            console.error('Error caching chats:', e);
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error('Error fetching chats:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
      if (!user?.token) return;
      
      // GET /api/chats derives user identity directly from JWT (Phase 3)
      const res = await fetch(`${API_BASE_URL}/api/chats`, {
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
      // Update cache
      try {
        localStorage.setItem("chatgramChatsCache", JSON.stringify(data));
      } catch (e) {
        console.error('Error caching chats:', e);
      }
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
                    loading={loading}
                    socket={socket}
                    onlineUsers={onlineUsers}
                  />
                </div>
                
                {/* Chatbox - Hidden on mobile when no chat selected */}
                <div className={`${currentChat ? 'block' : 'hidden md:flex'} flex-1`}>
                  {currentChat ? (
                    <ChatBox 
                      chat={currentChat}
                      user={user}
                      setCurrentChat={setCurrentChat}
                      socket={socket}
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
