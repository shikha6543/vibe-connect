import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

// Humne jo file routes/auth.js rename ki thi use yahan import kiya
import authRoutes from './routes/auth.js'; 

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS configurations
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Aapka Vite frontend port
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(express.json());
app.use(cors());

// Auth Routes Config
app.use('/api/auth', authRoutes);

// MongoDB Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected successfully! 🔥"))
  .catch((err) => console.log("DB Connection Error: ", err));

// --- REAL-TIME COMMUNICATION SOCKET MANAGEMENT ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Jab user specific video room join karega
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room: ${roomId}`);
    
    // Baaki sabhi users ko inform karna ki naya user aa gaya hai
    socket.to(roomId).emit('user-connected', userId);

    // 💬 TASK 5 LISTENER: Chat aur Files ko baaki logo tak broadcast karna
    socket.on('send-message', (roomId, messageData) => {
      // Apne alawa room ke sabhi logon ko data bhej do
      socket.to(roomId).emit('receive-message', {
        ...messageData,
        sender: 'Peer User' // Saamne wale ki screen par text change ho sake
      });
    });

    // 🖼️ TASK 6 LISTENER: Collaborative Whiteboard ke coordinates share karna
    socket.on('draw', (roomId, drawData) => {
      socket.to(roomId).emit('draw-data', drawData);
    });

    // Board clear karne ka global trigger
    socket.on('clear-board', (roomId) => {
      socket.to(roomId).emit('clear-board');
    });

    // Jab user leave karega call ko ya browser band karega
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Server Configuration Ports
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));