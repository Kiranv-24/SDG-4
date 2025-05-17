import { useQuery } from "@tanstack/react-query";
import AuthAPI from "../virtual-mentor";
import { toast } from "react-hot-toast";

const createTest = async (testInfo) => {
  try {
    console.log("Creating test with info:", testInfo);
    const { data } = await AuthAPI().post("/user/create-test", testInfo);
    console.log("Create test response:", data);
    return data;
  } catch (error) {
    console.error("Error creating test:", error);
    throw error;
  }
};

const submitIndividual = async ({ testId, questionId, answer, testAttemptId }) => {
  try {
    console.log("Submitting answer:", { testId, questionId, answer, testAttemptId });
    const { data } = await AuthAPI().post("/user/submit-answer", {
      testId,
      questionId,
      answer,
      attemptId: testAttemptId
    });
    console.log("Submit answer response:", data);
    return data;
  } catch (error) {
    console.error("Error submitting answer:", error);
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
    
    const payload = {
      testId: testId,
      attemptId: testAttemptId
    };
    
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
    console.log("Fetching mentor tests...");
    
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      throw new Error("Authentication required");
    }

    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await AuthAPI().get(`/user/get-test?_t=${timestamp}`);
    
    console.log("Raw mentor tests response:", response);
    
    if (!response || !response.data) {
      console.error("Invalid response format:", response);
      throw new Error("Invalid response from server");
    }

    const { data } = response;
    console.log("Processed mentor tests response:", data);
    
    if (!data.success) {
      console.error("Server returned error:", data.message);
      throw new Error(data.message || "Failed to fetch tests");
    }

    // Handle the response data
    const testsData = data.message;
    if (!Array.isArray(testsData)) {
      console.warn("Invalid tests data format, expected array but got:", typeof testsData);
      return [];
    }

    // Validate and clean the data
    const validTests = testsData.filter(test => {
      if (!test || typeof test !== 'object') {
        console.warn("Invalid test object:", test);
        return false;
      }
      return true;
    }).map(test => ({
      id: test.id || "",
      title: test.title || "Untitled Test",
      description: test.description || "",
      createdAt: test.createdAt || new Date(),
      class: test.class || { id: "", name: "Unknown Class" },
      subject: test.subject || { id: "", name: "Unknown Subject" },
      submissionCount: test.submissionCount || 0,
      questionCount: test.questionCount || 0,
      questions: Array.isArray(test.questions) ? test.questions : []
    }));

    console.log(`Returning ${validTests.length} valid tests`);
    return validTests;
  } catch (error) {
    console.error("Error fetching mentor tests:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Authentication expired - please log in again");
    }
    
    if (error.response?.status === 403) {
      throw new Error("Access denied. Only mentors can access this feature.");
    }
    
    if (error.response?.status === 500) {
      throw new Error("Server error - please try again later. If the problem persists, contact support.");
    }
    
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
    retry: (failureCount, error) => {
      if (error?.response?.status === 500 || !error.response) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10000,
    onError: (error) => {
      console.error("Error in student test query:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    },
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
  });

const mentorTestQuery = () =>
  useQuery({
    queryKey: ["get-mentor-Tests"],
    queryFn: getMentorTest,
    select: (data) => {
      console.log("Processing mentor test data:", data);
      return Array.isArray(data) ? data : [];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000,
    retry: (failureCount, error) => {
      // Don't retry on authentication or permission errors
      if (error.message.includes("Authentication") || 
          error.message.includes("Access denied")) {
        return false;
      }
      
      // Only retry server errors up to 3 times
      if (error.message.includes("Server error")) {
        return failureCount < 3;
      }
      
      // Don't retry other errors
      return false;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log(`Retrying in ${delay}ms`);
      return delay;
    },
    onError: (error) => {
      console.error("Error in mentor test query:", {
        message: error.message,
        stack: error.stack
      });
      
      // Show user-friendly error message
      toast.error(error.message || "Failed to fetch tests");
    },
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
    refetchOnReconnect: true,
    suspense: false
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
