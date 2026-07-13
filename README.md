# ChatGram 💬

ChatGram is a production-focused real-time chat application built to demonstrate modern full-stack development practices. It provides secure one-on-one and group messaging with real-time updates, online/offline presence tracking, image sharing, and deep authorization boundaries — all wrapped in a responsive React and CSS user interface.

---

## Features

- **Centralized Authentication:** Lightweight JWT-based validation middleware protecting all sensitive endpoints.
- **Granular Authorization:** strict boundaries checking chat room membership and group roles (admin vs. normal member) at both REST and Socket.IO layers.
- **Real-Time Messaging:** Event synchronization using Socket.IO, mapping rooms directly to authenticated MongoDB chat collections.
- **Multi-Device Presence:** Process-local tracking mapping each user to multiple active sockets, maintaining accurate online status across tabs.
- **Cursor-Based Pagination:** Efficient message history fetching sorted chronologically using MongoDB ObjectId cursors.
- **Media Validation:** Server-side Base64 validation safeguarding database documents against malformed payloads and size inflation (>5MB).
- **Security hardening:** Protected using `helmet` headers, origin-locked CORS controls, and rate-limiting on authentication entry points.

---

## Tech Stack

### Frontend
- **React (Vite):** Core interface library and routing.
- **Vanilla CSS:** Custom styling layout.
- **Socket.IO Client:** Low-latency bi-directional messaging client.

### Backend
- **Node.js (Express):** REST API server and Socket.IO controller.
- **Socket.IO:** Real-time event communication.
- **Helmet & Express Rate Limit:** Server hardening.

### Database & Authentication
- **MongoDB (Mongoose):** Persistent storage for users, chats, and messages.
- **JSON Web Tokens (JWT):** Secure stateless authentication.

---

## Architecture

```
React Client (Vite)
       │
       ├─────── REST APIs ───────► Express Server ───► MongoDB (Mongoose)
       │                              ▲
       └─────── Socket.IO ────────────┘
         (Real-Time Event Layer)
```

- **REST APIs** handle persistent state modifications (signup, login, sending messages, profile updates, and group management).
- **Socket.IO** handles low-latency real-time synchronization (messages, typing indicators, and user presence).
- **MongoDB** persists users, chat memberships, and message history.

---

## Real-Time Messaging Flow

1. **Authentication:** The client logs in and receives a JWT token.
2. **Socket Handshake:** The client connects to Socket.IO, supplying the JWT in the `auth` handshake object.
3. **Identity Verification:** The server verifies the token via Socket middleware, rejecting unauthenticated connections and attaching `socket.user = { id }`.
4. **Room Authorization:** The client requests to join a chat room using `join_chat(chatId)`. The server verifies that the user is a member of the MongoDB chat document before executing `socket.join(chatId)`.
5. **Message Persistence:** When a user sends a message, they POST to the REST API `/api/messages`. The server authorizes the user, persists the message, updates the chat's latest message reference, and returns the message object.
6. **Real-Time Broadcast:** The client emits `send_message` on the socket. The server verifies room membership and broadcasts the message to other room members via Socket.IO.

---

## Authentication and Authorization

- **JWT Middleware:** Every protected route passes through a centralized `protect` middleware which decodes the JWT and attaches `req.user = { id }`. Client-supplied user identities are never trusted.
- **Chat Membership Checks:** A centralized `requireChatMember` middleware ensures that only users registered in the chat's `users` array in MongoDB can fetch messages or post new ones.
- **Group Role Enforcement:** Administrative operations (adding members, removing members, updating group avatars) are restricted strictly to the group creator (`groupAdmin`). Normal members are only authorized to view details or leave the group.
- **Socket.IO JWT Verification:** Handshake middleware (`io.use`) decodes the token at the socket level. Emits (`typing`, `send_message`, `delete_message`) verify socket room membership in-memory (`socket.rooms`) before broadcasting.

---

## Presence Model

- User presence is tracked in memory using a process-local map: `userId -> Set<socket.id>`.
- **Multi-Device Support:** When a user opens multiple browser tabs or devices, each socket ID is added to their set. The user is marked offline only when their last active socket disconnects.
- **Scalability Note:** *The current presence store is process-local. Horizontal scaling across multiple Node.js instances would require shared presence state and a Socket.IO adapter such as Redis.*

---

## API Overview

### Authentication (`/api/auth`)
- `POST /signup` - Register a new user (with optional profile image).
- `POST /login` - Sign in and get a JWT token.
- `GET /search?q=<query>` - Search users (excludes self, requires JWT).
- `POST /change-password` - Change user password (requires JWT).
- `POST /update-profile` - Update user avatar or about text (requires JWT).
- `DELETE /delete-account` - Permanently delete user account and clean up database (requires JWT).

### Chats (`/api/chats`)
- `GET /` - Fetch all chats for the authenticated user.
- `POST /` - Create or fetch a 1-to-1 chat.
- `POST /group` - Create a group chat (sets creator as `groupAdmin`).
- `PUT /group/add` - Add user to group (Admin only).
- `PUT /group/remove` - Remove user from group (Admin only).
- `PUT /group/image` - Update group image (Admin only).
- `PUT /group/leave` - Leave a group (auto-promotes another member if admin leaves).
- `DELETE/:chatId` - Delete a 1-to-1 chat (clears messages) or leave group.

### Messages (`/api/messages`)
- `GET /:chatId?before=<msgId>&limit=50` - Fetch chat history (Cursor-based pagination, membership verified).
- `POST /` - Send a text or image message (membership verified).
- `DELETE /:messageId` - Delete message for everyone (sender check, 1-hour window).

---

## Socket.IO Events

### Client -> Server
- `join_chat` - Join a Socket.IO chat room (authorized).
- `typing` - Emit typing status (verified).
- `stop_typing` - Emit stop typing status (verified).
- `send_message` - Distribute message payload (verified).
- `delete_message` - Distribute deleted message metadata (verified).

### Server -> Client
- `update_users` - Broadcasts array of online user IDs.
- `receive_message` - Receives new incoming message.
- `typing` - Receives typing status of partner.
- `stop_typing` - Receives stop typing status.
- `message_deleted` - Receives deleted message ID.

---

## Project Structure

```
chatgram/
├── chatgram-front/              # Frontend Application (React)
│   ├── src/
│   │   ├── components/          # Chatbox, Sidebar, GroupInfo, Message, UserProfileModal
│   │   ├── config/              # Centralized API and Socket config
│   │   ├── context/             # ThemeContext (Light/Dark mode)
│   │   ├── pages/               # Login, Signup, Profile pages
│   │   └── utils/               # Avatar & UI helpers
│   └── package.json
└── chatgram-server/             # Backend Application (Node.js + Express)
    ├── middleware/              # JWT auth and Chat membership middleware
    ├── models/                  # User, Chat, and Message Mongoose schemas
    ├── routes/                  # REST Endpoint routes
    ├── tests/                   # Security unit test suite
    ├── utils/                   # Validation helpers
    └── package.json
```

---

## Local Setup

### Prerequisite
Ensure you have Node.js (v18+) and MongoDB running locally.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/ThakurSaiPrakash12/chatgram
   cd chatgram
   ```

2. Set up the backend:
   ```bash
   cd chatgram-server
   npm install
   # Create a .env file based on .env.example and run:
   npm dev
   ```

3. Run security tests:
   ```bash
   npm test
   ```

4. Set up the frontend:
   ```bash
   cd ../chatgram-front
   npm install
   npm run dev
   ```

App will run at `http://localhost:5173`.

---

## Environment Variables

### Backend (`chatgram-server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatgram
JWT_SECRET=your_long_random_jwt_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Security Improvements
- **Zero-Trust Sender Identity:** Derived strictly from the verified JWT on the server, preventing client impersonation.
- **Chat Access Isolation:** Implemented `requireChatMember` middleware validating user memberships before fetching/writing messages.
- **Enforced Group Boundaries:** Admin permissions validated on MongoDB for member modification and image uploads.
- **WebSocket Verification:** Handshake is authenticated, and active rooms are matched against the user's chat membership.
- **Safe Base64 Handlers:** Verified MIME signatures and strictly enforced payload size limits to protect database storage.
- **Defensive API Hardening:** Integrated security headers (`helmet`), IP rate limits, safe regular expressions on queries, and disabled stack trace leakage.

---

## Known Limitations
- **Process-Local Presence Map:** Presence tracking is stored in Node.js process memory. Cannot scale horizontally without a Redis Socket.IO adapter.
- **Base64 Payload Storage:** Shared images are stored as Base64 strings in MongoDB. Incurs ~33% BSON overhead; should be replaced with Object Storage (e.g. S3, Cloudinary) in production.
- **No End-to-End Encryption:** Messages are sent over TLS but stored in plaintext on the database server.
