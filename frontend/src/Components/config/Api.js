import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

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
    const response = await axios.get(`${BASE_URL}/v1/video/token`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error getting video token:', error);
    throw new Error(error.response?.data?.error || 'Failed to get video token');
  }
};

// Create a meeting using our backend
export const createMeeting = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/video/meetings`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw new Error(error.response?.data?.error || 'Failed to create meeting');
  }
};

// Join a meeting
export const joinMeeting = async (meetingId) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/video/meetings/${meetingId}/join`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error joining meeting:', error);
    throw new Error(error.response?.data?.error || 'Failed to join meeting');
  }
};

// Get all meetings for the current user
export const getMeetings = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/v1/video/meetings`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch meetings');
  }
};
