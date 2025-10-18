# 💬 ChatGram - Real-time Chat Application

<div align="center">

![ChatGram Logo](https://img.shields.io/badge/ChatGram-Real--time%20Messaging-purple?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.17.0-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2-010101?style=flat&logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.2.1-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)

**A modern, full-stack real-time chat application with group messaging, image sharing, and user authentication.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🚀 About

**ChatGram** is a feature-rich, real-time messaging platform built with the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO. It provides seamless one-on-one and group conversations with instant message delivery, online status indicators, typing notifications, and media sharing capabilities.

### Why ChatGram?

- 🔒 **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- ⚡ **Real-time Communication**: Powered by Socket.IO for instant bidirectional messaging
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 📱 **Mobile-Friendly**: Fully responsive across all devices
- 🖼️ **Media Support**: Share images in chats and customize profile pictures
- 👥 **Group Chats**: Create and manage group conversations with custom avatars
- 🟢 **Online Status**: See who's online in real-time
- ⌨️ **Typing Indicators**: Know when someone is typing

---

## ✨ Features

### 🔐 Authentication & User Management
- User registration with email validation
- Secure login with JWT tokens
- Profile customization (name, profile picture, about section)
- Password change functionality
- Persistent authentication with localStorage

### 💬 Messaging
- **Real-time one-on-one messaging** with instant delivery
- **Group chat creation** with custom names and avatars
- **Image sharing** in messages (Base64 encoding, 5MB limit)
- **Message history** persisted in MongoDB
- **Typing indicators** to show when users are typing
- **Unread message counts** for each conversation
- **Message timestamps** with user-friendly formatting

### 👥 Social Features
- **Online/Offline status** with real-time updates
- **User search** to find and start conversations
- **Group member management** with participant lists
- **Avatar system** with automatic initials generation
- **Profile pictures** for personalization

### 🎨 User Interface
- **Modern gradient themes** for different sections
  - Login/Signup: Green & Teal gradient
  - Profile: Purple & Pink gradient
  - Chatbox/Sidebar: Blue & Purple gradient
- **Responsive design** that works on all screen sizes
- **Smooth animations** and transitions
- **Empty state illustrations** for better UX
- **Loading states** for all async operations

---

## 🎬 Demo

### Live Preview
> Add your deployment link here once deployed

### Video Walkthrough
> Add a GIF or video demo here

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library for building component-based interfaces |
| **React Router** | 6.x | Client-side routing and navigation |
| **Socket.IO Client** | 4.7.2 | Real-time bidirectional event-based communication |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework for styling |
| **Vite** | 7.1.10 | Fast build tool and dev server |
| **Axios** | 1.7.9 | HTTP client for API requests |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.17.0 | JavaScript runtime environment |
| **Express.js** | 4.18.2 | Web application framework |
| **Socket.IO** | 4.7.2 | Real-time WebSocket communication |
| **MongoDB** | 7.x | NoSQL database for data persistence |
| **Mongoose** | 7.2.1 | MongoDB object modeling (ODM) |
| **JWT** | 9.0.2 | JSON Web Tokens for authentication |
| **bcrypt** | 5.1.1 | Password hashing and security |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing middleware |

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Client   │◄───────►│  Express API    │◄───────►│    MongoDB      │
│  (Port 5173)    │         │  (Port 5000)    │         │   Database      │
│                 │         │                 │         │                 │
└────────┬────────┘         └────────┬────────┘         └─────────────────┘
         │                           │
         │                           │
         │      ┌─────────────────┐  │
         │      │                 │  │
         └─────►│  Socket.IO      │◄─┘
                │  (WebSocket)    │
                │                 │
                └─────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   - User submits credentials → Express validates → JWT token generated → Client stores token → Subsequent requests include token

2. **Message Flow**:
   - User types message → Client emits Socket event → Server broadcasts to room → Recipients receive instantly → Message saved to MongoDB

3. **Real-time Updates**:
   - User actions (online/offline, typing) → Socket.IO events → Server broadcasts → All connected clients update UI

---

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn** package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/chatgram.git
cd chatgram
```

### Step 2: Install Backend Dependencies
```bash
cd chatgram-server
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../chatgram-front
npm install
```

### Step 4: Configure Environment Variables

#### Backend (.env in chatgram-server/)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatgram
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatgram

JWT_SECRET=your_super_secret_jwt_key_here_change_this
NODE_ENV=development
```

#### Frontend (.env in chatgram-front/)
```env
VITE_API_URL=http://localhost:5000
```

### Step 5: Start the Application

#### Terminal 1 - Start Backend Server
```bash
cd chatgram-server
npm start
```
Backend will run on `http://localhost:5000`

#### Terminal 2 - Start Frontend Development Server
```bash
cd chatgram-front
npm run dev
```
Frontend will run on `http://localhost:5173`

### Step 6: Open in Browser
Navigate to `http://localhost:5173` and start chatting! 🎉

---

## 🔧 Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Port for Express server | Yes | 5000 |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | http://localhost:5000 |

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePic": null,
    "about": "Hey there! I am using ChatGram"
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/login`
Login existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePic": "base64_image_string",
    "about": "Hey there! I am using ChatGram"
  },
  "token": "jwt_token_here"
}
```

#### PUT `/api/auth/update-profile`
Update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "profilePic": "base64_image_string",
  "about": "New about text"
}
```

#### PUT `/api/auth/change-password`
Change user password (requires authentication).

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

### Chat Endpoints

#### GET `/api/chats`
Get all chats for authenticated user.

**Response:**
```json
[
  {
    "id": "chat_id",
    "isGroupChat": false,
    "participants": [...],
    "lastMessage": {...},
    "unreadCount": 3
  }
]
```

#### POST `/api/chats`
Create or get existing one-on-one chat.

**Request Body:**
```json
{
  "userId": "other_user_id"
}
```

#### POST `/api/chats/group`
Create a new group chat.

**Request Body:**
```json
{
  "name": "Project Team",
  "users": ["user_id_1", "user_id_2"],
  "groupAvatar": "base64_image_string"
}
```

### Message Endpoints

#### GET `/api/messages/:chatId`
Get all messages in a chat.

**Response:**
```json
[
  {
    "id": "message_id",
    "sender": {...},
    "content": "Hello!",
    "image": null,
    "timestamp": "2025-10-18T10:30:00Z"
  }
]
```

#### POST `/api/messages`
Send a new message.

**Request Body:**
```json
{
  "chatId": "chat_id",
  "content": "Hello, how are you?",
  "image": "base64_image_string" // optional
}
```

### Socket.IO Events

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `setup` | `{ userId }` | Initialize Socket connection for user |
| `join chat` | `{ chatId }` | Join a specific chat room |
| `typing` | `{ chatId }` | Notify that user is typing |
| `stop typing` | `{ chatId }` | Notify that user stopped typing |
| `new message` | `{ message }` | Send a new message |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | - | Confirmation of Socket connection |
| `message received` | `{ message }` | New message received in chat |
| `typing` | `{ chatId, userName }` | User is typing in chat |
| `stop typing` | `{ chatId }` | User stopped typing |
| `online users` | `[userId1, userId2, ...]` | List of currently online users |

---

## 📁 Project Structure

```
chatgram/
├── chatgram-front/                 # React Frontend
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/            # Reusable React components
│   │   │   ├── Chatbox.jsx        # Main chat interface
│   │   │   ├── Sidebar.jsx        # Chat list sidebar
│   │   │   ├── Message.jsx        # Individual message component
│   │   │   └── Inputbox.jsx       # Message input component
│   │   ├── pages/                 # Page components
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Signup.jsx         # Registration page
│   │   │   └── Profile.jsx        # User profile page
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js             # Vite configuration
│   └── tailwind.config.js         # Tailwind CSS config
│
├── chatgram-server/                # Node.js Backend
│   ├── models/                    # Mongoose schemas
│   │   ├── user.js                # User model
│   │   ├── chat.js                # Chat model
│   │   └── message.js             # Message model
│   ├── routes/                    # Express routes
│   │   ├── auth.js                # Authentication routes
│   │   ├── chat.js                # Chat routes
│   │   └── message.js             # Message routes
│   ├── db.js                      # MongoDB connection
│   ├── index.js                   # Server entry point
│   └── package.json
│
├── README.md                       # This file
├── PROJECT_DOCUMENTATION.md        # Detailed technical documentation
├── INTERVIEW_QUICK_GUIDE.md        # Interview preparation guide
└── ARCHITECTURE_DIAGRAMS.md        # System architecture diagrams
```

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] User authentication (signup/login)
- [x] Real-time one-on-one messaging
- [x] Group chat creation
- [x] Image sharing
- [x] Profile customization
- [x] Online status indicators

### Phase 2: Enhanced Features 🚧
- [ ] Message reactions (emojis)
- [ ] Message editing and deletion
- [ ] Voice messages
- [ ] File sharing (PDF, documents)
- [ ] Message search functionality
- [ ] User blocking/reporting

### Phase 3: Advanced Features 📋
- [ ] Video calling (WebRTC)
- [ ] Voice calling
- [ ] End-to-end encryption
- [ ] Message pinning
- [ ] Chat backup and export
- [ ] Dark mode toggle
- [ ] Multi-language support

### Phase 4: Mobile & Desktop 📱💻
- [ ] Progressive Web App (PWA)
- [ ] React Native mobile app
- [ ] Electron desktop app
- [ ] Push notifications

---

### Development Guidelines

- Follow the existing code style and structure
- Write clear commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

### Bug Reports

If you find a bug, please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment details



## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Express.js](https://expressjs.com/) - Backend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Font Awesome](https://fontawesome.com/) - Icons (if used)

---


[⬆ Back to Top](#-chatgram---real-time-chat-application)

</div>
