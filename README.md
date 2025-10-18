# 💬 ChatGram

![ChatGram Logo](https://img.shields.io/badge/ChatGram-Real--time%20Messaging-purple?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.17.0-339933?logo=node.js)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2-010101?logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.2.1-47A248?logo=mongodb)](https://www.mongodb.com/)

> A **modern real-time chat application** built with **React + Socket.IO**, featuring authentication, group chats, media sharing, and a beautiful responsive UI.

---

## 🚀 About

**ChatGram** enables seamless **one-on-one** and **group messaging** with **real-time updates**, **image sharing**, and **secure JWT authentication** — all wrapped in a **responsive Tailwind UI**.

---

## ✨ Key Features

- 🔒 JWT Authentication & Profile Customization  
- ⚡ Real-time Messaging (Socket.IO)  
- 👥 Group Chats with Custom Avatars  
- 🖼️ Image Sharing (Base64, 5MB limit)  
- 🟢 Online Status & Typing Indicators  
- 🎨 Modern Responsive UI (Tailwind + Animations)  
- 💾 Persistent Message History (MongoDB)

---

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Socket.IO Client, Axios  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Socket.IO  

---

## 🏗️ Architecture

```
React (Client) ⇄ Express + Socket.IO (Server) ⇄ MongoDB (Database)
```

- **Auth Flow:** User → Express → JWT → Client  
- **Chat Flow:** Socket events → Broadcast → MongoDB persist  

---

## ⚙️ Installation

```bash
# Clone the repo
git clone https://github.com/your-username/chatgram.git
cd chatgram

# Backend setup
cd chatgram-server
npm install
npm start

# Frontend setup
cd ../chatgram-front
npm install
npm run dev
```

App runs at:  
Frontend → `http://localhost:5173`  
Backend → `http://localhost:5000`

---

## � Deployment

Want to deploy ChatGram so everyone can use it? We've got you covered!

### Quick Deploy (100% FREE)

**Recommended Stack:**
- 🎨 Frontend: **Vercel** (React/Vite)
- ⚙️ Backend: **Render** (Node.js + Socket.IO)
- 💾 Database: **MongoDB Atlas** (Cloud MongoDB)

📘 **[Read Full Deployment Guide](DEPLOYMENT_GUIDE.md)** - Detailed step-by-step instructions

✅ **[Quick Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Fast deployment in 20 minutes

### One-Click Deployment

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ThakurSaiPrakash12/chatgram&project-name=chatgram&root-directory=chatgram-front)

---

## �🔧 Environment Variables

**Backend (.env)**  
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatgram
JWT_SECRET=your_secret_key
```

**Frontend (.env)**  
```env
VITE_API_URL=http://localhost:5000
```

---

## 🗺️ Roadmap

✅ Real-time Messaging  
✅ Group Chats & Media Sharing  
🚧 Message Reactions & Deletion  
📞 Voice/Video Calls (WebRTC)  
🌙 Dark Mode & Multi-language  

---


## 🙏 Acknowledgments

React • Node.js • Express • Socket.IO • MongoDB • Tailwind CSS • Vite  

---

⭐ **Star this repo** if you like ChatGram!  
[⬆ Back to Top](#-chatgram)
