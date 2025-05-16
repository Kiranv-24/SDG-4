import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    enum: [
      'Mathematics', 
      'Science', 
      'English', 
      'History', 
      'Geography', 
      'Technology',
      'Art',
      'Music',
      'Physical Education',
      'Other'
    ],
    default: 'Other'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds
  },
  views: {
    type: Number,
    default: 0
  },
  cloudinaryId: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1 });
videoSchema.index({ creator: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });

const Video = mongoose.model('Video', videoSchema);

export default Video; 