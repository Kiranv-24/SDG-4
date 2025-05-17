import React, { useEffect, useState } from "react";
import { getTestsQuery } from "../../api/test";
import Error from "../Error";
import Loading from "../Loading";
import { AiFillEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { GetUserQuery } from "../../api/user";
import { Check, ChecklistOutlined, Error as ErrorIcon, Info, Refresh, Search } from "@mui/icons-material";
import { Alert, Button, IconButton, TextField, InputAdornment } from "@mui/material";
import toast from "react-hot-toast";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

const Test = () => {
  const { data, isLoading, isError, error, refetch } = getTestsQuery();
  const { data: userdata } = GetUserQuery();
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [socket, setSocket] = useState(null);

  // Socket connection setup
  useEffect(() => {
    let newSocket;
    try {
      console.log("Connecting to socket at:", SOCKET_URL);
      newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
        auth: {
          token: localStorage.getItem("token")
        }
      });
      
      newSocket.on("connect", () => {
        console.log("Socket connected successfully");
        if (userdata?.id) {
          newSocket.emit("join", { userId: userdata.id });
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        toast.error("Lost connection to server. Scores may not update in real-time.");
      });

      newSocket.on("testScored", (data) => {
        console.log("Test scored event received:", data);
        if (data.userId === userdata?.id) {
          handleRefresh();
          toast.success(`Test "${data.testTitle}" scored: ${data.score}%`);
        }
      });

      newSocket.on("testSubmitted", (data) => {
        console.log("Test submission event received:", data);
        if (data.userId === userdata?.id) {
          handleRefresh();
          toast.success(`Test "${data.testTitle}" submitted successfully`);
        }
      });

      newSocket.on("testStarted", (data) => {
        console.log("Test started event received:", data);
        if (data.userId === userdata?.id) {
          handleRefresh();
          toast.success(`Test "${data.testTitle}" started`);
        }
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          console.log("Disconnecting socket");
          newSocket.disconnect();
        }
      };
    } catch (err) {
      console.error("Error setting up socket:", err);
      toast.error("Failed to establish real-time connection");
    }
  }, [userdata?.id]);

  useEffect(() => {
    console.log("Test component data:", data);
    
    if (data) {
      setTests(data.message || []);
      setLastRefreshTime(new Date());
      
      if (data.info) {
        setErrorMessage(data.info);
      } else {
        setErrorMessage("");
      }
    } else {
      setTests([]);
    }
  }, [data]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setErrorMessage("");
    try {
      await refetch();
      setLastRefreshTime(new Date());
      toast.success("Tests refreshed successfully");
    } catch (err) {
      console.error("Error refreshing tests:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to refresh tests";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleRefresh();
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const intervalId = setInterval(handleRefresh, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredTests = tests?.filter((item) =>
    item.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatter = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (isLoading && !lastRefreshTime) {
    return (
      <div className="base-container py-[5vh] flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="base-container py-[5vh]">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-merri">Available Tests</h1>
        <div className="flex gap-4 items-center">
          <TextField
            size="small"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <IconButton 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            color="primary"
            title="Refresh tests"
          >
            <Refresh className={isRefreshing ? "animate-spin" : ""} />
          </IconButton>
          {lastRefreshTime && (
            <span className="text-sm text-gray-500">
              Last updated: {formatter(lastRefreshTime)}
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <Alert 
          severity="error" 
          className="mb-4"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              RETRY
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {!tests?.length ? (
        <Alert severity="info">
          No tests available at the moment. Please check back later.
        </Alert>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border border-gray-300 font-semibold text-left">Subject</th>
                <th className="p-3 border border-gray-300 font-semibold text-left">Title/Description</th>
                <th className="p-3 border border-gray-300 font-semibold text-center">Questions</th>
                <th className="p-3 border border-gray-300 font-semibold text-left">Created On</th>
                <th className="p-3 border border-gray-300 font-semibold text-left">Created By</th>
                <th className="p-3 border border-gray-300 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border border-gray-300">
                    {item.subject?.name || "Unknown Subject"}
                  </td>
                  <td className="p-3 border border-gray-300 text-left">
                    {item.title || item.description || "No description available"}
                  </td>
                  <td className="p-3 border border-gray-300 text-center">
                    {item.questionCount || "N/A"}
                  </td>
                  <td className="p-3 border border-gray-300">
                    {formatter(item.createdAt)}
                  </td>
                  <td className="p-3 border border-gray-300">
                    {item.owner?.name || "Unknown"}
                  </td>
                  <td className="p-3 border border-gray-300 text-center">
                    {item.completed ? (
                      <div className="text-green-600 font-semibold flex items-center justify-center gap-1">
                        <Check fontSize="small" />
                        <span>Completed</span>
                        {item.score !== undefined && (
                          <span className="ml-1">({item.score}%)</span>
                        )}
                      </div>
                    ) : item.attempts ? (
                      <div className="text-orange-600 font-semibold flex items-center justify-center gap-1">
                        <ChecklistOutlined fontSize="small" />
                        <span>In Progress</span>
                      </div>
                    ) : (
                      <Link 
                        to={`/user/test/${item.id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                      >
                        <AiFillEye />
                        <span>Start Test</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Test;
