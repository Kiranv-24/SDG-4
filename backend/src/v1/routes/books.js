import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';
import authMiddleware from '../middlewares/Auth.middleware.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });

    readableStream.pipe(uploadStream);
  });
};

// Upload a new book
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(file.buffer);

    // Extract text content from PDF for AI processing
    const pdfDoc = await PDFDocument.load(file.buffer);
    const numPages = pdfDoc.getPageCount();
    
    // Save book details to database
    const book = await prisma.book.create({
      data: {
        title,
        description,
        fileName: file.originalname,
        filePath: cloudinaryResponse.secure_url,
        pageCount: numPages,
        uploadedBy: req.user.id,
        cloudinaryPublicId: cloudinaryResponse.public_id
      }
    });

    res.json(book);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading book' });
  }
});

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books' });
  }
});

// Get a specific book
router.get('/:id', async (req, res) => {
  try {
    const book = await prisma.book.findUnique({
      where: {
        id: req.params.id
      }
    });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching book' });
  }
});

// Delete a book
router.delete('/:id', async (req, res) => {
  try {
    // Check if user owns the book
    const book = await prisma.book.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this book' });
    }

    // Delete from Cloudinary
    if (book.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(book.cloudinaryPublicId, { resource_type: 'raw' });
    }

    // Delete from database
    await prisma.book.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting book' });
  }
});

export default router;
 