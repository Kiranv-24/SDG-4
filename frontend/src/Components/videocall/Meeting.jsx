// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  MeetingProvider,
  useMeeting,
} from "@videosdk.live/react-sdk";
import { getAuthToken, createMeeting } from "../config/Api";
import { JoinScreen } from "./JoinScreen";
import { MeetingView } from "./MeetingView";
import { toast } from "react-hot-toast";

export function Meet() {
  const [meetingId, setMeetingId] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const authToken = await getAuthToken();
        setToken(authToken);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || "Failed to initialize video call";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Token initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeToken();
  }, []);

  const getMeetingAndToken = async (id) => {
    try {
      setError(null);
      if (id) {
        // If we have an ID, we're joining an existing meeting
        setMeetingId(id);
      } else {
        // Create a new meeting
        const roomId = await createMeeting({ token });
        setMeetingId(roomId);
        // Show the room ID so it can be shared
        toast.success(`Meeting created! Room ID: ${roomId}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to create/join meeting";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error creating/joining meeting:", error);
    }
  };

  const onMeetingLeave = () => {
    setMeetingId(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen">
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
        name: "User",
        mode: "CONFERENCE"
      }}
      token={token}
    >
      <MeetingView meetingId={meetingId} onMeetingLeave={onMeetingLeave} />
    </MeetingProvider>
  ) : (
    <JoinScreen getMeetingAndToken={getMeetingAndToken} />
  );
}

export default Meet;
