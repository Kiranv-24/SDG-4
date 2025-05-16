import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/Auth.middleware.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Set the paths for ffmpeg and ffprobe
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const router = express.Router();
const prisma = new PrismaClient();
const execPromise = promisify(exec);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Local storage path for videos
const VIDEOS_DIR = path.join(process.cwd(), 'uploads', 'videos');

// Ensure video directory exists
try {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create video upload directory:', error);
}

// Helper function to upload to Cloudinary
const uploadToCloudinary = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, 
      { 
        resource_type: 'video',
        folder: 'educational_videos',
        ...options
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

// Get video duration using fluent-ffmpeg
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File does not exist: ${filePath}`));
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.warn('fluent-ffmpeg ffprobe failed:', err.message);
        // Fallback to approximate duration based on file size
        try {
          const stats = fs.statSync(filePath);
          const fileSizeInBytes = stats.size;
          const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
          // Rough estimate: 1MB ≈ 8 seconds of video (for medium quality)
          return resolve(fileSizeInMB * 8);
        } catch (statError) {
          console.error('Error getting file stats for fallback duration:', statError);
          return resolve(0); // Default to 0 if fallback also fails
        }
      }
      const duration = metadata.format.duration;
      resolve(isNaN(duration) || !isFinite(duration) ? 0 : parseFloat(duration));
    });
  });
};

// Apply auth middleware only to POST, PUT, DELETE routes
const protectedRoutes = [
  { path: '/', method: 'post' },
  { path: '/:id', method: 'put' },
  { path: '/:id', method: 'delete' }
];

router.use((req, res, next) => {
  const isProtected = protectedRoutes.some(route => 
    route.path === req.path && route.method === req.method.toLowerCase()
  );
  
  if (isProtected) {
    return authMiddleware(req, res, next);
  }
  
  next();
});

// Upload a new video
router.post('/', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const videoFile = req.files.video?.[0];
    const thumbnailFile = req.files.thumbnail?.[0];
    
    if (!videoFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video file provided' 
      });
    }
    
    // Generate unique filename
    const videoFileName = `${uuidv4()}_${videoFile.originalname.replace(/\s+/g, '_')}`;
    const videoPath = path.join(VIDEOS_DIR, videoFileName);
    
    // Save video to local storage temporarily
    fs.writeFileSync(videoPath, videoFile.buffer);
    
    // Get video duration
    let duration = 0;
    try {
      duration = await getVideoDuration(videoPath);
    } catch (durationErr) {
      console.error('Error getting video duration:', durationErr);
    }
    
    // Upload to Cloudinary
    let videoResult;
    let thumbnailResult;
    
    try {
      // Upload video to cloudinary
      videoResult = await uploadToCloudinary(videoPath, {
        public_id: path.parse(videoFileName).name,
      });
      
      // Remove temporary file
      fs.unlinkSync(videoPath);
      
      // Upload thumbnail if provided, otherwise use auto-generated from video
      if (thumbnailFile) {
        // Save thumbnail temporarily
        const thumbnailFileName = `thumbnail_${path.parse(videoFileName).name}.jpg`;
        const thumbnailPath = path.join(VIDEOS_DIR, thumbnailFileName);
        fs.writeFileSync(thumbnailPath, thumbnailFile.buffer);
        
        // Upload to Cloudinary
        thumbnailResult = await uploadToCloudinary(thumbnailPath, {
          resource_type: 'image',
          folder: 'educational_videos/thumbnails',
          public_id: `thumbnail_${path.parse(videoFileName).name}`,
        });
        
        // Remove temporary file
        fs.unlinkSync(thumbnailPath);
      } else {
        // Use auto-generated thumbnail from Cloudinary
        const thumbnailUrl = videoResult.secure_url.replace(/\.[^/.]+$/, ".jpg");
        thumbnailResult = { secure_url: thumbnailUrl };
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      // If Cloudinary upload fails, clean up temporary file
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Error uploading video to cloud storage' 
      });
    }
    
    // Create video document in database
    const video = await prisma.video.create({
      data: {
        title,
        description,
        category,
        uploadedBy: req.user.id,
        videoUrl: videoResult.secure_url,
        thumbnailUrl: thumbnailResult.secure_url,
        duration,
        cloudinaryId: videoResult.public_id,
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Could not upload video.' 
    });
  }
});

// Get all videos with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where condition
    const where = {};
    
    // Add category filter
    if (category && category !== 'All') {
      where.category = category;
    }
    
    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Determine sort order
    const orderBy = {};
    orderBy[sortBy] = order.toLowerCase();
    
    // Get videos
    const videos = await prisma.video.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy,
      skip,
      take: parseInt(limit)
    });
    
    // Get total count
    const total = await prisma.video.count({ where });
    
    res.status(200).json({
      success: true,
      videos,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Could not fetch videos.' 
    });
  }
});

// Get a single video by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      video
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Could not fetch video.' 
    });
  }
});

// Update video metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;
    const userId = req.user.id;
    
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id }
    });
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // Check if user is authorized to update
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (video.uploadedBy !== userId && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this video' 
      });
    }
    
    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    
    // Update in database
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: updateData
    });
    
    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      video: {
        id: updatedVideo.id,
        title: updatedVideo.title,
        description: updatedVideo.description,
        category: updatedVideo.category
      }
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Could not update video.' 
    });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id }
    });
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // Check if user is authorized to delete
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (video.uploadedBy !== userId && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this video' 
      });
    }
    
    // Delete from Cloudinary
    if (video.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: 'video' });
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    
    // Delete video from database
    await prisma.video.delete({
      where: { id }
    });
    
    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Could not delete video.' 
    });
  }
});

// Record a view for the video
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id }
    });
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // Increment view count
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: { views: video.views + 1 }
    });
    
    res.status(200).json({
      success: true,
      message: 'View recorded',
      views: updatedVideo.views
    });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Could not record view.' 
    });
  }
});

export default router;