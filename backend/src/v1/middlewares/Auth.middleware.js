import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/index";
import config from "../config/env.config";

// all the request made from the frontend will have the access token as header and will be authenticated here

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(" ")[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.USER_ACCESS_SECRET);
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get the user ID from the decoded token
    const userId = typeof decoded === 'string' ? decoded : decoded.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set the user object on the request
    req.user = user;
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default authMiddleware;
