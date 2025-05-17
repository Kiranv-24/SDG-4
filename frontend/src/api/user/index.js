import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const AuthAPI = () => {
  const baseURL = "http://localhost:4000";
  
  if (typeof window !== "undefined") {
    return axios.create({
      baseURL: `${baseURL}/v1`,
      headers: {
        authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  } else {
    return axios.create({
      baseURL: `${baseURL}/v1`,
      headers: {
        authorization: `Bearer }`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  }
};

const GetUser = async () => {
  const { data } = await AuthAPI().get("/user/user-details");
  return data;
};

const getAllUsers = async () => {
  const { data } = await AuthAPI().get("/user/get-all-users");
  return data;
};

const sendMessage = async (message, receiverId, conversationId = null) => {
  const { data } = await AuthAPI().post("/user/create-conversation", {
    message,
    receiverId,
    conversationId
  });
  return data;
};

const getMySubmissions = async () => {
  const { data } = await AuthAPI().get("/user/get-user-sub");
  return data;
};

const getUserById = async (userId) => {
  const { data } = await AuthAPI().get(`/user/getuserbyid/${userId}`);
  return data;
};

const getMyConvos = async () => {
  const { data } = await AuthAPI().get("/user/all-convo");
  return data;
};

const GetUserQuery = () =>
  useQuery({
    queryKey: ["user-details"],
    queryFn: () => GetUser(),
    select: (data) => {
      const res = data.message;
      return res;
    },
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

const getSubmissionQuery = () =>
  useQuery({
    queryKey: ["get-subs"],
    queryFn: () => getMySubmissions(),
    select: (data) => {
      const res = data.message;
      return res;
    },
  });

const GetAllUsersQuery = () =>
  useQuery({
    queryKey: ["all-users"],
    queryFn: () => getAllUsers(),
    select: (data) => {
      const res = data.message;
      return res;
    },
  });

const GetAllConvoQuery = () =>
  useQuery({
    queryKey: ["all-convo"],
    queryFn: () => getMyConvos(),
    select: (data) => {
      const res = data.message;
      console.log("Conversations loaded:", res);
      return res;
    },
  });

export { GetUserQuery, getSubmissionQuery, GetAllUsersQuery, GetAllConvoQuery, getUserById, sendMessage };
