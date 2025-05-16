import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';
import authMiddleware from '../middlewares/Auth.middleware.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

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

    // Upload to Cloudinary - this is the primary storage method
    console.log('Uploading to Cloudinary...');
    const cloudinaryResponse = await uploadToCloudinary(file.buffer);
    console.log('Cloudinary response:', cloudinaryResponse);

    // Also save a local copy for backup only
    const uploadsDir = path.join(process.cwd(), 'uploads', 'books');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const localFilename = `${timestamp}-${file.originalname.replace(/\s+/g, '_')}`;
    const localFilePath = path.join(uploadsDir, localFilename);
    
    // Save the file locally
    fs.writeFileSync(localFilePath, file.buffer);

    // Extract text content from PDF for AI processing
    const pdfDoc = await PDFDocument.load(file.buffer);
    const numPages = pdfDoc.getPageCount();
    
    // Save book details to database
    const book = await prisma.book.create({
      data: {
        title,
        description,
        fileName: file.originalname,
        filePath: cloudinaryResponse.secure_url, // Use Cloudinary URL as primary URL
        pageCount: numPages,
        uploadedBy: req.user.id,
        cloudinaryPublicId: cloudinaryResponse.public_id,
        localFilePath: `/uploads/books/${localFilename}` // Store relative path for fallback
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

// Add a proxy endpoint to serve PDFs - IMPORTANT: place this BEFORE the /:id route
router.get('/pdf/:id', async (req, res) => {
  try {
    console.log('PDF proxy request for book ID:', req.params.id);
    
    const book = await prisma.book.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!book) {
      console.log('Book not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Book not found' });
    }

    console.log('Book details:', book);
    
    // Set PDF-specific headers for all responses
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.fileName}"`);
    
    // Remove all CSP headers that might be added by Helmet, we'll handle this here
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    
    // Prioritize Cloudinary URL if available
    if (book.cloudinaryPublicId && book.filePath.startsWith('http')) {
      try {
        console.log('Fetching from Cloudinary URL:', book.filePath);
        const response = await axios({
          method: 'GET',
          url: book.filePath,
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        console.log('Successfully fetched PDF from Cloudinary, size:', response.data.length);
        
        // Send the PDF data
        return res.send(response.data);
      } catch (fetchError) {
        console.error('Error fetching from Cloudinary:', fetchError.message);
        return res.status(500).json({ 
          error: 'Error fetching PDF from Cloudinary',
          details: fetchError.message
        });
      }
    }
    
    // Fallback to local files only if Cloudinary isn't available
    if (book.localFilePath) {
      const localPath = path.join(process.cwd(), book.localFilePath);
      
      if (fs.existsSync(localPath)) {
        console.log('Falling back to local PDF file:', localPath);
        
        // Stream the file
        const fileStream = fs.createReadStream(localPath);
        fileStream.on('error', (err) => {
          console.error('Error streaming file:', err);
          res.status(500).json({ error: 'Error streaming PDF file' });
        });
        
        return fileStream.pipe(res);
      }
    } else if (book.filePath && book.filePath.startsWith('uploads')) {
      // If filePath exists and points to an uploads directory
      const localPath = path.join(process.cwd(), book.filePath);
      
      if (fs.existsSync(localPath)) {
        console.log('Falling back to uploads directory file:', localPath);
        
        // Stream the file
        const fileStream = fs.createReadStream(localPath);
        fileStream.on('error', (err) => {
          console.error('Error streaming file:', err);
          res.status(500).json({ error: 'Error streaming PDF file' });
        });
        
        return fileStream.pipe(res);
      }
    }
    
    // No valid source available
    return res.status(404).json({ error: 'PDF file not found in any storage location' });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return res.status(500).json({ 
      error: 'Error serving PDF file',
      message: error.message
    });
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

    // Delete local file if it exists
    if (book.localFilePath) {
      const localPath = path.join(process.cwd(), book.localFilePath);
      
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
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
 