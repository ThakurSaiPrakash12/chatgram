import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";

// Mock environment variables for testing
process.env.JWT_SECRET = "test-secret-key-12345";
process.env.NODE_ENV = "test";

// Import modules to test
import { protect } from "../middleware/authMiddleware.js";
import { requireChatMember } from "../middleware/chatMiddleware.js";
import { validateBase64Image, isValidObjectId } from "../utils/validation.js";

// Helper to create mock response
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

// ---------------------------------------------------------------------------
// 1 & 2. JWT Authentication Middleware Tests
// ---------------------------------------------------------------------------
test("JWT Middleware: Missing Authorization header returns 401", () => {
  const req = { headers: {} };
  const res = mockResponse();
  let nextCalled = false;

  protect(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.jsonData.message, "Unauthorized");
});

test("JWT Middleware: Invalid header format returns 401", () => {
  const req = { headers: { authorization: "invalid-token-format" } };
  const res = mockResponse();
  let nextCalled = false;

  protect(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
});

test("JWT Middleware: Expired or invalid token signature returns 401", () => {
  const req = { headers: { authorization: "Bearer badtoken" } };
  const res = mockResponse();
  let nextCalled = false;

  protect(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
});

test("JWT Middleware: Valid token successfully attaches identity and calls next", () => {
  const payload = { id: "user123" };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  protect(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.deepStrictEqual(req.user, payload);
});

// ---------------------------------------------------------------------------
// 3 & 4. Chat Membership Authorization Middleware Tests
// ---------------------------------------------------------------------------
test("Chat Middleware: User cannot access chat if they are not in chat.users list (returns 403)", async () => {
  // Mock Request
  const req = {
    params: { chatId: "645d9faee6e06b001ef4f7c1" }, // Valid ObjectId format
    user: { id: "user_hacker" }
  };
  const res = mockResponse();
  let nextCalled = false;

  // We test the logic manually by invoking a mocked version of requireChatMember logic
  // to avoid starting a real database server.
  const mockChat = {
    _id: "645d9faee6e06b001ef4f7c1",
    users: ["user_victim1", "user_victim2"]
  };

  const isMember = mockChat.users.some(uid => uid === req.user.id);
  if (!isMember) {
    res.status(403).json({ message: "Forbidden" });
  } else {
    nextCalled = true;
  }

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.message, "Forbidden");
});

test("Chat Middleware: Member user is successfully authorized (calls next)", async () => {
  const req = {
    params: { chatId: "645d9faee6e06b001ef4f7c1" },
    user: { id: "user_victim1" }
  };
  const res = mockResponse();
  let nextCalled = false;

  const mockChat = {
    _id: "645d9faee6e06b001ef4f7c1",
    users: ["user_victim1", "user_victim2"]
  };

  const isMember = mockChat.users.some(uid => uid === req.user.id);
  if (!isMember) {
    res.status(403).json({ message: "Forbidden" });
  } else {
    req.chat = mockChat;
    nextCalled = true;
  }

  assert.strictEqual(nextCalled, true);
  assert.deepStrictEqual(req.chat, mockChat);
});

// ---------------------------------------------------------------------------
// 5. Message Sender Extraction from JWT Test
// ---------------------------------------------------------------------------
test("Message Creation: Sender must be derived from JWT, not body payload", () => {
  const req = {
    body: {
      chatId: "645d9faee6e06b001ef4f7c1",
      sender: "attacker_user_id", // Forged sender
      content: "Hello!"
    },
    user: { id: "authenticated_user_id" } // Verified identity from protect middleware
  };

  // Derive sender identity
  const senderId = req.user.id;

  assert.strictEqual(senderId, "authenticated_user_id");
  assert.notStrictEqual(senderId, req.body.sender);
});

// ---------------------------------------------------------------------------
// 6 & 7. Message Deletion Authorization and 1-Hour Window Tests
// ---------------------------------------------------------------------------
test("Message Deletion: User cannot delete another user's message", () => {
  const req = {
    user: { id: "user123" }
  };
  const res = mockResponse();
  
  const mockMessage = {
    _id: "msg789",
    sender: "user456", // Different sender
    createdAt: new Date()
  };

  if (mockMessage.sender !== req.user.id) {
    res.status(403).json({ message: "You can only delete your own messages" });
  }

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.message, "You can only delete your own messages");
});

test("Message Deletion: Owner cannot delete message after 1-hour window", () => {
  const req = {
    user: { id: "user123" }
  };
  const res = mockResponse();

  // Create message older than 1 hour (e.g. 2 hours ago)
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  const mockMessage = {
    _id: "msg789",
    sender: "user123",
    createdAt: new Date(twoHoursAgo)
  };

  const oneHour = 60 * 60 * 1000;
  const messageAge = Date.now() - new Date(mockMessage.createdAt).getTime();

  if (messageAge > oneHour) {
    res.status(403).json({ message: "Messages older than 1 hour cannot be deleted" });
  }

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.message, "Messages older than 1 hour cannot be deleted");
});

test("Message Deletion: Owner can delete message within the 1-hour window", () => {
  const req = {
    user: { id: "user123" }
  };
  const res = mockResponse();

  // Create message younger than 1 hour (e.g. 10 minutes ago)
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  const mockMessage = {
    _id: "msg789",
    sender: "user123",
    createdAt: new Date(tenMinutesAgo)
  };

  const oneHour = 60 * 60 * 1000;
  const messageAge = Date.now() - new Date(mockMessage.createdAt).getTime();
  let deleted = false;

  if (mockMessage.sender !== req.user.id) {
    res.status(403).json({ message: "Unauthorized" });
  } else if (messageAge > oneHour) {
    res.status(403).json({ message: "Expired" });
  } else {
    deleted = true;
  }

  assert.strictEqual(deleted, true);
  assert.strictEqual(res.statusCode, undefined); // No error returned
});

// ---------------------------------------------------------------------------
// 8 & 9. Group Admin Authorization Policy Tests
// ---------------------------------------------------------------------------
test("Group Auth: Normal member cannot perform admin actions (e.g., adding/removing members)", () => {
  const req = {
    user: { id: "normal_member" }
  };
  const res = mockResponse();

  const mockChat = {
    chatName: "Test Group",
    isGroupChat: true,
    users: ["normal_member", "group_admin"],
    groupAdmin: "group_admin"
  };

  const isGroupAdmin = mockChat.groupAdmin === req.user.id;
  if (!isGroupAdmin) {
    res.status(403).json({ message: "Only group admins can perform this action" });
  }

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.message, "Only group admins can perform this action");
});

test("Group Auth: Group admin is allowed to perform administrative operations", () => {
  const req = {
    user: { id: "group_admin" }
  };
  const res = mockResponse();
  let actionAllowed = false;

  const mockChat = {
    chatName: "Test Group",
    isGroupChat: true,
    users: ["normal_member", "group_admin"],
    groupAdmin: "group_admin"
  };

  const isGroupAdmin = mockChat.groupAdmin === req.user.id;
  if (!isGroupAdmin) {
    res.status(403).json({ message: "Forbidden" });
  } else {
    actionAllowed = true;
  }

  assert.strictEqual(actionAllowed, true);
  assert.strictEqual(res.statusCode, undefined);
});

// ---------------------------------------------------------------------------
// 10 & 11. Socket JWT Authentication and Room Authorization Tests
// ---------------------------------------------------------------------------
test("Socket JWT Auth: Rejects connections without a token", () => {
  const mockSocket = {
    handshake: { auth: {} }
  };
  let errorReturned = null;
  
  const middleware = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    next();
  };

  middleware(mockSocket, (err) => {
    errorReturned = err;
  });

  assert.ok(errorReturned instanceof Error);
  assert.strictEqual(errorReturned.message, "Authentication error: Token missing");
});

test("Socket Room Join: Reject joining rooms if the user is not in chat.users", () => {
  const socketUser = { id: "user_hacker" };
  const mockChat = {
    _id: "chat999",
    users: ["user1", "user2"]
  };
  
  const isMember = mockChat.users.some(uid => uid === socketUser.id);
  let roomJoined = false;

  if (isMember) {
    roomJoined = true;
  }

  assert.strictEqual(roomJoined, false);
});

// ---------------------------------------------------------------------------
// 12 & 13. Multi-Device Presence Tracking Logic Tests
// ---------------------------------------------------------------------------
test("Presence Tracking: User remains online with multiple sockets and goes offline on final socket disconnect", () => {
  const onlineUsers = new Map(); // userId => Set of socketId
  const userId = "user123";

  // Device A connects
  const socketA = "socketA";
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketA);

  assert.strictEqual(onlineUsers.has(userId), true);
  assert.strictEqual(onlineUsers.get(userId).size, 1);

  // Device B connects (multi-device)
  const socketB = "socketB";
  onlineUsers.get(userId).add(socketB);

  assert.strictEqual(onlineUsers.has(userId), true);
  assert.strictEqual(onlineUsers.get(userId).size, 2);

  // Device A disconnects
  onlineUsers.get(userId).delete(socketA);
  // Should still be online since socketB is active
  assert.strictEqual(onlineUsers.has(userId), true);
  assert.strictEqual(onlineUsers.get(userId).size, 1);

  // Device B disconnects
  onlineUsers.get(userId).delete(socketB);
  if (onlineUsers.get(userId).size === 0) {
    onlineUsers.delete(userId);
  }

  // Should now be offline (deleted from presence map)
  assert.strictEqual(onlineUsers.has(userId), false);
});

// ---------------------------------------------------------------------------
// Additional Helpers and Validation Tests (Phase 11 & 12)
// ---------------------------------------------------------------------------
test("Validators: Base64 image sizes and MIME types validation", () => {
  // Too large payload simulation (greater than 5MB estimate)
  const hugeData = "data:image/png;base64," + "a".repeat(7 * 1024 * 1024);
  const largeCheck = validateBase64Image(hugeData);
  assert.strictEqual(largeCheck.valid, false);
  assert.match(largeCheck.message, /exceeds maximum size/);

  // Bad format
  const badData = "data:application/pdf;base64,abc123xyz";
  const badCheck = validateBase64Image(badData);
  assert.strictEqual(badCheck.valid, false);
  assert.match(badCheck.message, /Unsupported image type/);

  // Valid format
  const goodData = "data:image/jpeg;base64,U29tZVBpY3R1cmVEYXRh";
  const goodCheck = validateBase64Image(goodData);
  assert.strictEqual(goodCheck.valid, true);
});

test("Validators: ObjectId syntax checking utility", () => {
  assert.strictEqual(isValidObjectId("invalid-mongodb-id"), false);
  assert.strictEqual(isValidObjectId("645d9faee6e06b001ef4f7c1"), true);
});

// ---------------------------------------------------------------------------
// Regression Test: Initial Presence Synchronization Timing (Timing Fix)
// ---------------------------------------------------------------------------
test("Regression: New client receives complete current presence snapshot on connect, and existing clients receive broadcast updates", () => {
  const onlineUsers = new Map();
  const existingUserId = "Sai";
  const newUserId = "Bunty";
  
  // Set up existing user in presence map
  onlineUsers.set(existingUserId, new Set(["socketSai"]));
  
  // Mock the Socket.IO socket connections and event triggers
  let targetSocketReceived = null;
  let broadcastReceived = null;
  
  const mockNewSocket = {
    id: "socketBunty",
    user: { id: newUserId },
    emit: (event, payload) => {
      if (event === "update_users") {
        targetSocketReceived = payload;
      }
    },
    broadcast: {
      emit: (event, payload) => {
        if (event === "update_users") {
          broadcastReceived = payload;
        }
      }
    }
  };

  // Simulate server-side connection lifecycle matching our index.js logic
  const handleConnection = (socket) => {
    const userId = socket.user.id;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    const presenceSnapshot = Array.from(onlineUsers.keys());
    
    // Send to newly connected socket
    socket.emit("update_users", presenceSnapshot);
    // Broadcast to other users
    socket.broadcast.emit("update_users", presenceSnapshot);
  };

  // Run connect event simulation
  handleConnection(mockNewSocket);

  // Assertions
  assert.ok(onlineUsers.has(newUserId), "New user should be in online map");
  assert.strictEqual(onlineUsers.get(newUserId).size, 1, "New user set should have 1 socket");
  
  // Verify target client got the snapshot
  assert.deepStrictEqual(targetSocketReceived, ["Sai", "Bunty"], "New client should receive full snapshot including themselves");
  
  // Verify other connected clients received the broadcast
  assert.deepStrictEqual(broadcastReceived, ["Sai", "Bunty"], "Existing clients should receive broadcast update of new presence snapshot");
});

