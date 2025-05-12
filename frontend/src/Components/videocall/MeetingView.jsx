// @ts-nocheck
import { useState } from "react";
import { Controls } from "./Controls";
import { ParticipantView } from "./ParticipantView";
import { useMeeting } from "@videosdk.live/react-sdk";
import { toast } from "react-hot-toast";

export function MeetingView(props) {
  const [joined, setJoined] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const { join, participants } = useMeeting({
    onMeetingJoined: () => {
      setJoined("JOINED");
      toast.success("Successfully joined the meeting!");
    },
    onMeetingLeft: () => {
      toast.success("Left the meeting");
      props.onMeetingLeave();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      console.error("Meeting Error:", error);
    }
  });

  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Dynamic grid layout based on participant count
  const getGridLayout = () => {
    const count = participants.size;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-1 md:grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div className={`container mx-auto p-4 ${isFullScreen ? 'fixed inset-0 bg-black' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Meeting ID: {props.meetingId}</h3>
        <button
          onClick={toggleFullScreen}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          {isFullScreen ? (
            <span>Exit Fullscreen</span>
          ) : (
            <span>Enter Fullscreen</span>
          )}
        </button>
      </div>
      
      {joined === "JOINED" ? (
        <div className={`grid ${getGridLayout()} gap-4 h-full`}>
          {[...participants.keys()].map((participantId) => (
            <ParticipantView
              participantId={participantId}
              key={participantId}
              isFullScreen={isFullScreen}
            />
          ))}
        </div>
      ) : joined === "JOINING" ? (
        <div className="flex items-center justify-center">
          <p className="text-lg">Joining the meeting...</p>
        </div>
      ) : (
        <button 
          onClick={joinMeeting}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Join Meeting
        </button>
      )}
    </div>
  );
}
