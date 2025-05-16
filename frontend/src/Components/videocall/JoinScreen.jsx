import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { VideoCall, PersonAdd } from "@mui/icons-material";

export function JoinScreen({ getMeetingAndToken, userRole }) {
  const [meetingId, setMeetingId] = useState("");

  const joinMeeting = async () => {
    if (!meetingId.trim()) {
      toast.error("Please enter a meeting ID");
      return;
    }
    await getMeetingAndToken(meetingId.trim());
  };

  const createMeeting = async () => {
    await getMeetingAndToken(null);
  };

  return (
    <div className="flex justify-center h-screen items-center bg-gradient-to-br from-blue-100 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-6">
        <div className="text-center">
          <VideoCall className="text-blue-500 text-5xl mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">Video Meeting</h2>
          <p className="text-gray-600 text-sm mt-1">Connect with your mentor or students</p>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 outline-none"
              placeholder="Enter Meeting ID"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1 ml-1">Enter a meeting ID to join an existing meeting</p>
          </div>

          <button
            onClick={joinMeeting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <PersonAdd />
            <span>Join Meeting</span>
          </button>

          {userRole === 'mentor' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={createMeeting}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg shadow-md font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <VideoCall />
                <span>Create New Meeting</span>
              </button>
            </>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          {userRole === 'mentor' 
            ? "You can create a new meeting or join an existing one" 
            : "Enter a meeting ID provided by your mentor"}
        </div>
      </div>
    </div>
  );
}
