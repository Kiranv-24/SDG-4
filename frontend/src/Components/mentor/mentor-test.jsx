import React, { useEffect, useState } from "react";
import { mentorTestQuery } from "../../api/test";
import Loading from "../Loading";
import Error from "../Error";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Alert,
} from "@mui/material";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import { Search, Refresh } from "@mui/icons-material";
import toast from "react-hot-toast";

function Mentortest() {
  const { data, isLoading, isError, error, refetch } = mentorTestQuery();
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  useEffect(() => {
    console.log("Raw data received in Mentortest:", data);
    try {
      if (Array.isArray(data)) {
        setTests(data);
        setLoadError(null);
        setLastRefreshTime(new Date());
      } else {
        console.warn("Invalid data format received:", data);
        setTests([]);
        setLoadError("No tests available");
      }
    } catch (err) {
      console.error("Error processing test data:", err);
      setLoadError(err.message);
      setTests([]);
    }
  }, [data]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setLoadError(null);
    try {
      console.log("Manually refreshing tests...");
      await refetch();
      setLastRefreshTime(new Date());
      toast.success("Tests refreshed successfully");
    } catch (err) {
      console.error("Error refreshing tests:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to refresh tests";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    console.log("Initial load - fetching tests...");
    handleRefresh();
  }, []);

  // Auto-refresh every 5 seconds if no error
  useEffect(() => {
    if (loadError) {
      console.log("Skipping auto-refresh due to error:", loadError);
      return;
    }
    
    console.log("Setting up auto-refresh...");
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing tests...");
      handleRefresh();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [loadError]);

  const filteredTests = tests?.filter((item) =>
    (item?.subject?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (item?.title?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  ) || [];

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("en-US", options);
    } catch (error) {
      return "Invalid Date";
    }
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
        <h1 className="text-3xl font-merri">Your Created Tests</h1>
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
              Last updated: {formatDate(lastRefreshTime)}
            </span>
          )}
        </div>
      </div>

      {loadError && (
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
          {loadError}
        </Alert>
      )}

      {!tests?.length ? (
        <Alert severity="info" className="mb-4">
          {loadError ? (
            "Unable to load tests. Please try refreshing."
          ) : (
            <>
              No tests found. You can create your first test using the button below.
              <div className="mt-2">
                <Link 
                  to="/mentor/createtest"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Create your first test
                </Link>
              </div>
            </>
          )}
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Date Created</TableCell>
                <TableCell>Class</TableCell>
                <TableCell align="center">Questions</TableCell>
                <TableCell align="center">Submissions</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTests.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {item?.subject?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {item?.title || "Untitled Test"}
                  </TableCell>
                  <TableCell>
                    {formatDate(item?.createdAt)}
                  </TableCell>
                  <TableCell>
                    {item?.class?.name || "N/A"}
                  </TableCell>
                  <TableCell align="center">
                    {item.questionCount || 0}
                  </TableCell>
                  <TableCell align="center">
                    {item.submissionCount || 0}
                  </TableCell>
                  <TableCell align="center">
                    <Link 
                      to={`/mentor/submission/${item.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <EyeOpenIcon />
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default Mentortest;
