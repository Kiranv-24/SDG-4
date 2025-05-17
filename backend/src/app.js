import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import createError from "http-errors";
import morgan from "morgan";
import path from "path";
import fs from "fs";

import favicon from "serve-favicon";
import { Server } from 'socket.io';
import "./v1/config/env.config.js";

import { authRoutes, userRoute } from "./v1/routes/index.js";
import videoRoutes from "./v1/routes/videoRoutes.js";
// New
import OpenAI from "openai";

import { PrismaClient } from "@prisma/client";
import { app, server } from "./socket.js";
import bookRoutes from './v1/routes/books.js';
import chatRoutes from './v1/routes/chat.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: createError.TooManyRequests().status,
    message: createError.TooManyRequests().message,
  },
});
const prisma = new PrismaClient();
async function sendMessage(senderId, receiverId, message) {
  const chatMessage = await prisma.chat.create({
    data: {
      senderId,
      receiverId,
      message,
    },
  });
  return chatMessage;
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory at:', uploadsDir);
}

// Update CORS options to allow PDF content type
const corsOptions = {
  origin: ["http://localhost:3000", "https://green-iq-deployed.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Global variable appRoot with base dirname
global.appRoot = path.resolve(__dirname);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://res.cloudinary.com"],
      frameAncestors: ["'self'", "http://localhost:3000", "https://green-iq-deployed.vercel.app"],
      frameSrc: ["'self'", "data:", "http://localhost:*", "https://res.cloudinary.com"],
      objectSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      workerSrc: ["'self'", "blob:", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.set("trust proxy", 1);
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

// Welcome Route
app.all("/", (req, res, next) => {
  res.send({ message: "API is Up and Running on render 😎🚀" });
});

const apiVersion = "v1";

// Routes
app.use(`/${apiVersion}/auth`, authRoutes);
app.use(`/${apiVersion}/user`, userRoute);
app.use(`/${apiVersion}/video`, videoRoutes);

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.post(`/find-complexity`, async (req, res) => {
  try {
    const {prompt} =req.body;
     const chatSession = model.startChat({
    generationConfig,
     
    history: [
    
    ],
  });
  const result = await chatSession.sendMessage(prompt);
  console.log(result.response.text())
    return res.status(200).json({
      success: true,
      data: JSON.stringify(result.response.text()),
    });
  } catch (error) {
    console.log(error);
  }
});

// Add new routes
app.use('/api/books', bookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);

// Serve static files from the uploads directory - make sure the path is correct
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'inline');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.set('X-Frame-Options', 'ALLOWALL');
      
      // Remove any CSP headers that would prevent iframe embedding
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');
    }
  }
}));

// 404 Handler
app.use((req, res, next) => {
  next(createError.NotFound());
});

// Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});


// Server Configs
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 @ http://localhost:${PORT}`);
  console.log(`connected to ${process.env.DATABASE_URL}`);
});
