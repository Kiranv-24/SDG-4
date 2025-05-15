import express from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authMiddleware from '../middlewares/Auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Apply auth middleware to all routes
router.use(authMiddleware);

// Chat with a book
router.post('/book', async (req, res) => {
  try {
    const { bookId, message } = req.body;

    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const context = await getRelevantContext(book, message);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent([
      `You are a helpful AI assistant that helps users understand the book "${book.title}".`,
      `Use the following context from the book to answer the user's question: ${context}`,
      message
    ]);

    const reply = result.response.text();

    await prisma.chatMessage.create({
      data: {
        bookId,
        userId: req.user.id,
        message,
        response: reply
      }
    });

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Error processing chat request' });
  }
});

async function getRelevantContext(book, question) {
  return "Context from the book would be retrieved here based on the question";
}

export default router;
