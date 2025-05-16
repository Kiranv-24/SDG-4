// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  MeetingProvider,
} from "@videosdk.live/react-sdk";
import { getAuthToken, createMeeting, joinMeeting } from "../config/Api";
import { JoinScreen } from "./JoinScreen";
import { MeetingView } from "./MeetingView";
import { toast } from "react-hot-toast";

export function Meet() {
  const [meetingId, setMeetingId] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const initializeToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const userToken = localStorage.getItem('token');
      if (!userToken) {
        throw new Error('You must be logged in to access video calls');
      }

      const response = await getAuthToken();
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to initialize video service');
      }

      setToken(response.token);
      setUserRole(response.role || localStorage.getItem('role'));
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      console.error("Token initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeToken();
  }, []);

  const getMeetingAndToken = async (id) => {
    try {
      setError(null);
      if (id) {
        // Join existing meeting
        const response = await joinMeeting(id);
        if (!response?.success) {
          throw new Error(response?.error || 'Failed to join meeting');
        }
        setToken(response.token);
        setMeetingId(id);
        toast.success("Successfully joined the meeting!");
      } else {
        // Create new meeting
        if (userRole !== 'mentor') {
          toast.error("Only mentors can create new meetings");
          return;
        }
        const response = await createMeeting();
        if (!response?.success) {
          throw new Error(response?.error || 'Failed to create meeting');
        }
        setMeetingId(response.roomId);
        toast.success(`Meeting created! Room ID: ${response.roomId}`);
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      console.error("Error creating/joining meeting:", error);
    }
  };

  const onMeetingLeave = () => {
    setMeetingId(null);
    setError(null);
    initializeToken();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={initializeToken}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-red-500">Video service is not available. Please try again later.</div>
      </div>
    );
  }

  return meetingId ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: localStorage.getItem('name') || "User",
        mode: "CONFERENCE"
      }}
      token={token}
    >
      <MeetingView meetingId={meetingId} onMeetingLeave={onMeetingLeave} userRole={userRole} />
    </MeetingProvider>
  ) : (
    <JoinScreen getMeetingAndToken={getMeetingAndToken} userRole={userRole} />
  );
}

export default Meet;
