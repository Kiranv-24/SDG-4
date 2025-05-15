import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://green-iq-deployed.vercel.app"],
    methods: ["GET", "POST"],
  },
});

// Map to store active user connections
const userSocketMap = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
  
  // Get userId from query params
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }
  
  // Emit online users list to all connected clients
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  
  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("get_online_users", () => {
    socket.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    
    // Remove user from online users
    for (const [key, value] of userSocketMap.entries()) {
      if (value === socket.id) {
        userSocketMap.delete(key);
        break;
      }
    }
    
    // Update online users for all clients
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

// Function to get socket ID for a specific user
const getReciverSocketId = (receiverId) => {
  return userSocketMap.get(receiverId);
};

export { app, server, io, getReciverSocketId };