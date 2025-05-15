import React, { useState, useEffect } from "react";
import Leftbar from "../Leftbar";
import DateTime from "../DateTime";
import { useNavigate, useParams } from "react-router";
import { bookMeeting, getMentorsQuery } from "../../api/meetings";
import { Button, TextField, TextareaAutosize } from "@mui/material";
import toast from "react-hot-toast";

function ConfirmBooking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedDates, setSelectedDates] = useState([]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const { data: mentorsData } = getMentorsQuery();
  const [mentorName, setMentorName] = useState("");
  
  // Set default title when mentor data is loaded
  useEffect(() => {
    if (mentorsData) {
      const mentor = mentorsData.find(m => m.id === id);
      if (mentor) {
        setMentorName(mentor.name);
        setTitle(`Meeting with ${mentor.name}`);
      }
    }
  }, [mentorsData, id]);

  const bookMeetingHandler = async () => {
    const meetingInfo = {
      dates: selectedDates,
      guestId: id,
      notes: notes,
      title: title || `Meeting with Mentor - ${new Date().toLocaleDateString()}`
    };

    if (notes.length < 10) {
      toast.error("Please enter more than 10 words in the notes.");
    } else if (selectedDates.length === 0) {
      toast.error("Please select at least one date.");
    } else if (!title) {
      toast.error("Please provide a title for the meeting.");
    } else {
      try {
        const res = await bookMeeting(meetingInfo);
        if (res.success) {
          toast.success("Meeting request sent successfully.");
          navigate("/user/book-meeting");
        } else {
          toast.error(res.message || "Failed to book meeting");
        }
      } catch (err) {
        console.error("Error booking meeting:", err);
        toast.error("Error booking meeting. Please try again.");
      }
    }
  };

  const handleChildData = (dateTimeArray) => {
    setSelectedDates(dateTimeArray);
  };

  return (
    <div className="flex">
      <div className="p-5 w-full max-w-2xl">
        <h1 className="text-2xl font-bold my-5">
          Book a Meeting {mentorName ? `with ${mentorName}` : ""}
        </h1>
        
        <div className="mb-6">
          <h2 className="font-bold mb-2">Meeting Title</h2>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter meeting title"
            className="mb-4"
          />
        </div>
        
        <h2 className="text-xl font-bold my-4">Select Available Dates</h2>
        <DateTime onData={handleChildData} />
        
        <div className="my-6">
          <h2 className="font-bold mb-2">Tell us more about your needs</h2>
          <textarea
            className="w-full h-32 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            placeholder="Enter details here"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        <Button
          onClick={bookMeetingHandler}
          variant="contained"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Confirm Meeting
        </Button>
      </div>
    </div>
  );
}

export default ConfirmBooking;
