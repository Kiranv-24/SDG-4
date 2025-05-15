import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const AuthAPI = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found");
    }
    
    return axios.create({
      baseURL: `${import.meta.env.VITE_BASE_URL}/v1/`,
      headers: {
        authorization: `Bearer ${token || ""}`,
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

const createTest = async (testInfo) => {
  const { data } = await AuthAPI().post("/user/create-test", testInfo);
  return data;
};

const submitIndividual = async (testId, questionId, answer, testAttemptId = null) => {
  try {
    console.log("Submitting answer:", { 
      testId, 
      questionId, 
      attemptId: testAttemptId,
      answerLength: answer?.length || 0 
    });
    
    const payload = {
      testId,
      questionId,
      answer
    };
    
    // Include the attempt ID if available
    if (testAttemptId) {
      payload.attemptId = testAttemptId;
    }
    
    const { data } = await AuthAPI().post("/user/submit-answer", payload);
    console.log("Submit answer response:", data);
    return data;
  } catch (error) {
    console.error("Error submitting answer:", error);
    console.error("Error response data:", error.response?.data);
    throw error;
  }
};

const startTest = async (testId) => {
  try {
    console.log("Starting test with ID:", testId);
    const { data } = await AuthAPI().post("/user/start-test", {
      testId,
    });
    console.log("Start test response:", data);
    return data;
  } catch (error) {
    console.error("Error starting test:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

const finishTest = async (testId, testAttemptId = null) => {
  try {
    console.log("Finishing test with ID:", testId, "Attempt ID:", testAttemptId);
    
    // Add timestamp to help debug caching issues
    const timestamp = new Date().getTime();
    const payload = {
      testId,
      _timestamp: timestamp
    };
    
    // Include the attempt ID if available
    if (testAttemptId) {
      payload.attemptId = testAttemptId;
    }
    
    const { data } = await AuthAPI().post("/user/finish-test", payload);
    console.log("Finish test response:", data);
    return data;
  } catch (error) {
    console.error("Error finishing test:", error);
    console.error("Error response details:", error.response?.data);
    throw error;
  }
};

const getSubmissionsByTestId = async (testId) => {
  const { data } = await AuthAPI().get(`/user/get-sub/${testId}`);
  return data;
};

const getSubmissionDetails = async (attemptId) => {
  const { data } = await AuthAPI().get(`/user/get-sub-details/${attemptId}`);
  return data;
};

const scoreTestAttempt = async (attempt, score) => {
  const { data } = await AuthAPI().post(`/user/score`, {
    attemptId: attempt,
    score: parseInt(score),
  });
  return data;
};

const getQuestionByTestId = async (testId) => {
  const { data } = await AuthAPI().get(`/user/get-questions/${testId}`);
  return data;
};

const getMyTest = async () => {
  console.log("Fetching tests for student...");
  try {
    const { data } = await AuthAPI().get("/user/get-my-test");
    console.log("Student tests response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
};

const getMentorTest = async () => {
  try {
    const { data } = await AuthAPI().get("/user/get-test");
    return data;
  } catch (error) {
    console.error("Error fetching mentor tests:", error);
    throw error;
  }
};

const deleteTest = async (testId) => {
  const { data } = await AuthAPI().delete(`/user/delete-test?id=${testId}`);
  return data;
};

const getTestsQuery = () =>
  useQuery({
    queryKey: ["get-my-Tests"],
    queryFn: () => getMyTest(),
    retry: 2,
    refetchOnWindowFocus: false,
  });

const mentorTestQuery = () =>
  useQuery({
    queryKey: ["get-mentor-Tests"],
    queryFn: () => getMentorTest(),
    select: (data) => {
      const res = data.message;
      return res;
    },
  });

export {
  getSubmissionDetails,
  getSubmissionsByTestId,
  createTest,
  mentorTestQuery,
  deleteTest,
  finishTest,
  getTestsQuery,
  getQuestionByTestId,
  submitIndividual,
  startTest,
  scoreTestAttempt,
};
