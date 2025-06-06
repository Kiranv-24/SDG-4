import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  Card,
  CardContent,
  List,
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  DateRange,
  ThumbUp,
  ThumbDown,
  Comment,
  AccessTime,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axios';
import ReactPlayer from 'react-player';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideoData();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoId]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/api/videos/${videoId}`);
      if (response.data.success) {
        setVideoData(response.data.video);
        await axiosInstance.post(`/api/videos/${videoId}/view`);
        if (response.data.video?.category) {
          fetchRelatedVideos(response.data.video.category, videoId);
        }
      } else {
        setError(response.data.message || 'Failed to load video');
        toast.error('Error loading video');
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('Error loading video. Please try again later.');
      toast.error('Error loading video');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedVideos = async (category, currentVideoId) => {
    try {
      const response = await axiosInstance.get(`/api/videos?category=${category}`);
      if (response.data.success) {
        const filtered = response.data.videos
          .filter((v) => v.id !== currentVideoId)
          .slice(0, 4);
        setRelatedVideos(filtered);
      }
    } catch (error) {
      console.error('Error fetching related videos:', error);
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleVideoClick = (id) => {
    navigate(`/video-player/${id}`);
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Button startIcon={<ArrowBack />} onClick={goBack} sx={{ mb: 2 }}>
        Back to Videos
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : videoData && videoData.videoUrl ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                ref={containerRef}
                sx={{
                  position: 'relative',
                  paddingTop: isFullscreen ? '0' : '56.25%',
                  height: isFullscreen ? '100vh' : 'auto',
                  backgroundColor: '#000',
                }}
              >
                <ReactPlayer
                  ref={playerRef}
                  url={videoData.videoUrl}
                  width="100%"
                  height="100%"
                  style={{
                    position: isFullscreen ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  playing={playing}
                  volume={volume}
                  muted={muted}
                  onProgress={handleProgress}
                  onDuration={handleDuration}
                  controls
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload',
                        disablePictureInPicture: true,
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {videoData.title}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Visibility sx={{ mr: 0.5 }} />
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      {videoData.views || 0} views
                    </Typography>
                    <DateRange sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{formatDate(videoData.createdAt)}</Typography>
                  </Box>
                  <Box>
                    <Chip label={videoData.category || 'Uncategorized'} color="primary" variant="outlined" />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {videoData.user?.name?.charAt(0) || videoData.user?.email?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography variant="subtitle1">
                    {videoData.user?.name || videoData.user?.email || 'Unknown Uploader'}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {videoData.description}
                </Typography>

                <Box sx={{ display: 'flex', mt: 3 }}>
                  <Button startIcon={<ThumbUp />} variant="outlined" sx={{ mr: 1 }}>
                    Like
                  </Button>
                  <Button startIcon={<ThumbDown />} variant="outlined" sx={{ mr: 1 }}>
                    Dislike
                  </Button>
                  <Button startIcon={<Comment />} variant="outlined">
                    Comment
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Related Videos
            </Typography>

            {relatedVideos.length > 0 ? (
              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {relatedVideos.map((video) => (
                  <Card
                    key={video.id}
                    sx={{ mb: 2, cursor: 'pointer' }}
                    onClick={() => handleVideoClick(video.id)}
                  >
                    <Box sx={{ display: 'flex' }}>
                      <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                        <Typography component="div" variant="subtitle1" noWrap>
                          {video.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="div"
                          sx={{ mt: 0.5 }}
                        >
                          {video.user?.name || video.user?.email || 'Unknown Uploader'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Visibility sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                            {video.views || 0}
                          </Typography>
                          <AccessTime sx={{ fontSize: '0.875rem', mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(video.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                      <Box
                        sx={{
                          width: 120,
                          height: 90,
                          backgroundImage: `url(${video.thumbnailUrl || '/default-thumbnail.jpg'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '2px 4px',
                            fontSize: '0.65rem',
                          }}
                        >
                          {formatTime(video.duration)}
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No related videos found
              </Typography>
            )}
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Video not found.
        </Typography>
      )}
    </Box>
  );
};

export default VideoPlayer;
