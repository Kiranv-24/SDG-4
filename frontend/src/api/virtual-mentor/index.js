import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// sending the access token (jwt token) to the authenticated urls to validate if the user is logged in

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

const AskSathiChatBot = async (prompt) => {
  const { data } = await AuthAPI().post(
    `/find-complexity`,
    { prompt }
  );
  return data;
};

export { AskSathiChatBot };

export default AuthAPI;
