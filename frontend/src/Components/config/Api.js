import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_BASE_URL = 'https://api.videosdk.live/v2';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Get the auth token from our backend
export const getAuthToken = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/v1/user/create-video-token`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get video token');
    }
    
    return response.data.token;
  } catch (error) {
    console.error('Error getting video token:', error);
    throw error;
  }
};

// Create a meeting using our backend
export const createMeeting = async ({ token }) => {
  try {
    // Create the meeting in our backend
    const backendResponse = await axios.post(
      `${BASE_URL}/v1/video/meetings`,
      {
        title: 'New Meeting',
        description: '',
        participants: []
      },
      {
        headers: getAuthHeaders(),
      }
    );

    if (!backendResponse.data.success) {
      throw new Error(backendResponse.data.error || 'Failed to create meeting');
    }

    // Return the roomId from the backend response
    return backendResponse.data.roomId;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

// Get all meetings for the current user
export const getMeetings = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/v1/video/meetings`, {
      headers: getAuthHeaders(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch meetings');
    }

    return response.data.meetings;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
};
