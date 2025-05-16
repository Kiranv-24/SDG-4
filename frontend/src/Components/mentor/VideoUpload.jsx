import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  IconButton
} from '@mui/material';
import { 
  CloudUpload, 
  Clear, 
  Photo,
  Delete
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const VideoUpload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  const categories = [
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
  ];
  
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('Video size exceeds 100MB limit');
        return;
      }
      
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file for thumbnail');
        return;
      }
      
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };
  
  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    // Clear the input field
    const videoInput = document.getElementById('video-upload');
    if (videoInput) videoInput.value = '';
  };
  
  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    // Clear the input field
    const thumbnailInput = document.getElementById('thumbnail-upload');
    if (thumbnailInput) thumbnailInput.value = '';
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('video', videoFile);
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      const response = await axiosInstance.post('/api/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minutes timeout for video upload
      });
      
      if (response.data.success) {
        setSuccess(true);
        toast.success('Video uploaded successfully');
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('Other');
        clearVideo();
        clearThumbnail();
        
        // Navigate to digital library after short delay
        setTimeout(() => {
          navigate('/user/video-library');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to upload video');
        toast.error('Error uploading video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Error uploading video. Please try again later.');
      toast.error('Error uploading video');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Educational Video
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Video uploaded successfully!
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Video Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 1 }}
                >
                  Select Video File
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={handleVideoChange}
                  />
                </Button>
                
                {videoFile && (
                  <Typography variant="body2">
                    Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    <IconButton 
                      size="small" 
                      onClick={clearVideo} 
                      sx={{ ml: 1, color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              {videoPreview && (
                <Card sx={{ mb: 2, position: 'relative' }}>
                  <CardMedia
                    component="video"
                    src={videoPreview}
                    controls
                    sx={{ height: 240 }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)',
                      }
                    }}
                    onClick={clearVideo}
                  >
                    <Clear />
                  </IconButton>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<Photo />}
                  sx={{ mb: 1 }}
                >
                  Upload Custom Thumbnail (Optional)
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleThumbnailChange}
                  />
                </Button>
                
                {thumbnailFile && (
                  <Typography variant="body2">
                    Selected: {thumbnailFile.name}
                    <IconButton 
                      size="small" 
                      onClick={clearThumbnail} 
                      sx={{ ml: 1, color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              {thumbnailPreview && (
                <Card sx={{ mb: 2, position: 'relative', maxWidth: 300 }}>
                  <CardMedia
                    component="img"
                    src={thumbnailPreview}
                    sx={{ height: 160 }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)',
                      }
                    }}
                    onClick={clearThumbnail}
                  >
                    <Clear />
                  </IconButton>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || !videoFile}
                  startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                >
                  {loading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        * Video files are limited to 100MB
      </Typography>
      <Typography variant="body2" color="text.secondary">
        * Supported formats: MP4, WebM, MOV, AVI
      </Typography>
    </Box>
  );
};

export default VideoUpload; 