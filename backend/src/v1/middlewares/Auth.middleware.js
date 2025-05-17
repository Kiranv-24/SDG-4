import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/index";
import config from "../config/env.config";

// all the request made from the frontend will have the access token as header and will be authenticated here

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth headers:", {
      authorization: authHeader,
      allHeaders: req.headers
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No valid auth header found");
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token extracted:", token ? "Token present" : "No token");
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.USER_ACCESS_SECRET);
      console.log("Token decoded successfully:", { decoded });
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token',
        error: err.message 
      });
    }

    // Get the user ID from the decoded token
    const userId = typeof decoded === 'string' ? decoded : decoded.id;
    console.log("Extracted userId:", userId);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format - no user ID' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log("User lookup result:", user ? "User found" : "User not found");

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Set the user object on the request
    req.user = user;
    console.log("Auth successful for user:", { 
      id: user.id, 
      email: user.email,
      role: user.role 
    });
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', {
      error: err.message,
      stack: err.stack,
      type: err.name
    });
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  } finally {
    await prisma.$disconnect();
  }
};

export default authMiddleware;
