// @ts-nocheck
import { useState } from "react";
import { Controls } from "./Controls";
import { ParticipantView } from "./ParticipantView";
import { useMeeting } from "@videosdk.live/react-sdk";
import { toast } from "react-hot-toast";
import { Fullscreen, FullscreenExit, ContentCopy } from "@mui/icons-material";

export function MeetingView(props) {
  const [joined, setJoined] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const { join, participants, end } = useMeeting({
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

  const copyMeetingId = () => {
    navigator.clipboard.writeText(props.meetingId);
    toast.success("Meeting ID copied to clipboard!");
  };

  const endMeeting = () => {
    if (props.userRole === 'mentor') {
      end();
      toast.success("Meeting ended by mentor");
    } else {
      toast.error("Only mentors can end the meeting");
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
    <div className={`min-h-screen bg-gray-100 p-4 ${isFullScreen ? 'fixed inset-0 bg-black' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-semibold text-gray-800">Meeting Room</h3>
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-lg">
                <span className="text-gray-600 text-sm">{props.meetingId}</span>
                <button
                  onClick={copyMeetingId}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <ContentCopy fontSize="small" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {props.userRole === 'mentor' && (
                <button
                  onClick={endMeeting}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  End Meeting
                </button>
              )}
              <button
                onClick={toggleFullScreen}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
              >
                {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
              </button>
            </div>
          </div>
        </div>
        
        {joined === "JOINED" ? (
          <div className={`grid ${getGridLayout()} gap-4`}>
            {[...participants.keys()].map((participantId) => (
              <div key={participantId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <ParticipantView
                  participantId={participantId}
                  isFullScreen={isFullScreen}
                  userRole={props.userRole}
                />
              </div>
            ))}
          </div>
        ) : joined === "JOINING" ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Joining the meeting...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-lg">
            <button 
              onClick={joinMeeting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Join Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
