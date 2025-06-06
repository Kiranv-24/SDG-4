import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const AuthAPI = () => {
  if (typeof window !== "undefined") {
    return axios.create({
      baseURL: `${import.meta.env.VITE_BASE_URL}/v1/`,
      headers: {
        authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  } else {
    return axios.create({
      baseURL: `${import.meta.env.VITE_BASE_URL}/v1/`,
      headers: {
        authorization: `Bearer }`,
        "Content-Type": "application/json",
      },
    });
  }
};
const updateMeetingMentor = async (meetingId) => {
  await AuthAPI().post("/user/confirm-meeting", { meetingId });
};

const getMeetingsMentor = async () => {
  const { data } = await AuthAPI().get("/user/get-meetings");
  return data;
};
const bookMeeting = async (meetinginfo) => {
  try {
    console.log("Booking meeting with data:", meetinginfo);
    const { data } = await AuthAPI().post("/user/book-meeting", meetinginfo);
    return data;
  } catch (error) {
    console.error("Error booking meeting:", error.response?.data || error.message);
    throw error;
  }
};
const getMyRequestedMeetings = async () => {
  const { data } = await AuthAPI().get("/user/my-meetings");

  return data;
};
const GetMentors = async () => {
  const { data } = await AuthAPI().get("/user/mentors");
  return data;
};
const getMentorsQuery = () =>
  useQuery({
    queryKey: ["mentors"],
    queryFn: () => GetMentors(),
    select: (data) => {
      const res = data.message;
      return res;
    },
  });
const myRequestedMeetingsQuery = () =>
  useQuery({
    queryKey: ["meetings"],
    queryFn: () => getMyRequestedMeetings(),
    select: (data) => {
      const res = data.message;
      return res;
    },
  });
const getMentorMeetingsQuery = () =>
  useQuery({
    queryKey: ["mentor-meetings"],
    queryFn: () => getMeetingsMentor(),
    select: (data) => {
      const res = data.message;
      return res;
    },
  });
export {
  getMentorsQuery,
  bookMeeting,
  myRequestedMeetingsQuery,
  getMentorMeetingsQuery,
  updateMeetingMentor,
};
