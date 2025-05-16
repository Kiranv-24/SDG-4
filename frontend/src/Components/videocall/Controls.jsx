import { 
  Logout, 
  Mic, 
  MicOff, 
  Videocam, 
  VideocamOff, 
  ScreenShare,
  StopScreenShare,
  Close
} from "@mui/icons-material";
import { useMeeting } from "@videosdk.live/react-sdk";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

export function Controls({ userRole }) {
  const { leave, toggleMic, toggleWebcam, toggleScreenShare, end } = useMeeting();
  const [mic, setMic] = useState(true);
  const [video, setVideo] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const handleLeave = () => {
    leave();
    toast.success("You left the meeting");
  };

  const handleEnd = () => {
    if (userRole === 'mentor') {
      end();
      toast.success("Meeting ended for all participants");
    } else {
      toast.error("Only mentors can end the meeting");
    }
  };

  const handleScreenShare = () => {
    toggleScreenShare();
    setIsScreenSharing(!isScreenSharing);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl p-3 flex items-center space-x-4">
      {userRole === 'mentor' && (
        <button
          onClick={handleEnd}
          className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="End meeting for all"
        >
          <Close />
        </button>
      )}
      
      <button
        onClick={handleLeave}
        className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        title="Leave meeting"
      >
        <Logout />
      </button>

      <div className="h-8 w-px bg-gray-300"></div>

      <button
        onClick={() => {
          toggleMic();
          setMic(!mic);
        }}
        className={`p-3 rounded-xl transition-colors ${
          mic 
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
            : 'bg-red-100 hover:bg-red-200 text-red-600'
        }`}
        title={mic ? "Mute microphone" : "Unmute microphone"}
      >
        {mic ? <Mic /> : <MicOff />}
      </button>

      <button
        onClick={() => {
          toggleWebcam();
          setVideo(!video);
        }}
        className={`p-3 rounded-xl transition-colors ${
          video 
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
            : 'bg-red-100 hover:bg-red-200 text-red-600'
        }`}
        title={video ? "Turn off camera" : "Turn on camera"}
      >
        {video ? <Videocam /> : <VideocamOff />}
      </button>

      <button
        onClick={handleScreenShare}
        className={`p-3 rounded-xl transition-colors ${
          isScreenSharing 
            ? 'bg-green-100 hover:bg-green-200 text-green-600' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
      >
        {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
      </button>
    </div>
  );
}
