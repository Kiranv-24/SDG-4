// @ts-nocheck
import React, { useEffect, useState } from "react";
import { getMentorsQuery, myRequestedMeetingsQuery } from "../../api/meetings";
import Loading from "../Loading";
import Error from "../Error";
import { Badge } from "../../Components/ui/badge";
import toast from "react-hot-toast";

function PersonalBookings() {
  const { data: mentorsData } = getMentorsQuery();
  const {
    data: myRequestedMeetings,
    isLoading,
    isError,
    error,
    refetch
  } = myRequestedMeetingsQuery();
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    if (myRequestedMeetings) {
      console.log("Meetings data:", myRequestedMeetings);
      setMeetings(myRequestedMeetings);
    }
  }, [myRequestedMeetings]);

  useEffect(() => {
    if (isError) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load your meetings. Please try again.");
    }
  }, [isError, error]);

  const handleRetry = () => {
    refetch();
    toast.success("Retrying to fetch your meetings...");
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Error />
        <button 
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  const formatDate = (date) => {
    try {
      if (!date) return "Invalid date";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid date";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="text-3xl font-semibold mb-5">
        Booked <span className="text-theme">Calls</span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="p-2 border border-gray-300">Date</th>
            <th className="p-2 border border-gray-300">Status</th>
            <th className="p-2 border border-gray-300">Guest Name</th>
            <th className="p-2 border border-gray-300">Notes</th>
          </tr>
        </thead>
        <tbody>
          {meetings?.length > 0 ? (
            meetings.map((meeting) => (
              <tr
                key={meeting?.id || Math.random().toString()}
                className="even:bg-gray-50 odd:bg-white hover:bg-gray-100 transition duration-200"
              >
                <td className="p-2 border border-gray-300 text-center">
                  {meeting?.dates && Array.isArray(meeting.dates) && meeting.dates.length > 0 ? (
                    meeting.dates.map((x) => (
                      <Badge
                        key={x?.date || Math.random().toString()}
                        variant="outline"
                        className="bg-gray-600 text-white mb-1 inline-block"
                      >
                        {formatDate(x?.date)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No dates available</span>
                  )}
                </td>
                <td className="p-2 border border-gray-300 text-center">
                  {meeting?.status ? (
                    <Badge
                      variant="outline"
                      className={`p-2 text-white ${
                        meeting.status === "requested" ? "bg-red-600" : "bg-green-600"
                      }`}
                    >
                      {meeting.status}
                    </Badge>
                  ) : (
                    <span className="text-gray-500">Unknown</span>
                  )}
                </td>
                <td className="p-2 border border-gray-300 text-center">
                  {meeting?.guest?.name || "Unknown Mentor"}
                </td>
                <td className="p-2 border border-gray-300">
                  {meeting?.notes || "No notes"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="bg-green-100 text-center p-5 text-lg">
                No booked meetings found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PersonalBookings;
