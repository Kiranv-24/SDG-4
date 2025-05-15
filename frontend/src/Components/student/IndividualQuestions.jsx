import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { finishTest, getQuestionByTestId, startTest, submitIndividual } from '../../api/test';
import { CgSpinner } from 'react-icons/cg';
import { TextField, Button } from '@mui/material';
import toast from 'react-hot-toast';

function IndividualQuestions() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [start, setstart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testAttemptId, setTestAttemptId] = useState(null);
  const { id } = useParams();

  // Log whenever testAttemptId changes
  useEffect(() => {
    console.log("Test attempt ID updated:", testAttemptId);
  }, [testAttemptId]);

  const fetchTestInfo = async () => {
    setLoading(true);
    try {
      const data = await getQuestionByTestId(id);
      console.log("Fetched questions:", data);
      setQuestions(data.message);
      const initialAnswers = {};
      setAnswers(initialAnswers);

      // Check if there's an existing test attempt
      try {
        // Starting a test will either create a new attempt or return an existing one
        const response = await startTest(id);
        console.log("Test attempt check:", response);
        
        if (response.success && response.attemptId) {
          setTestAttemptId(response.attemptId);
          console.log("Setting test attempt ID:", response.attemptId);
          setstart(true);
          toast.success("Resuming existing test");
        }
      } catch (err) {
        console.log("No existing test attempt found");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestInfo();
  }, []);

  // Update the answers state for a specific question ID
  const changeAnswerValue = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };
  
  // Start the test
  const handleStartTest = async () => {
    try {
      console.log("Starting test with ID:", id);
      const response = await startTest(id);
      console.log("Test started:", response);
      
      if (response.success) {
        console.log("Setting test attempt ID:", response.attemptId);
        setTestAttemptId(response.attemptId);
        localStorage.setItem(`testAttempt_${id}`, response.attemptId);
        setstart(true);
        toast.success("Test started successfully");
      } else {
        toast.error(response.message || "Failed to start test");
      }
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Failed to start test: " + (error.message || "Unknown error"));
    }
  };
  
  // Save individual answer
  const saveIndiAnswer = async (questionId, answer) => {
    if (!answer || answer.trim() === '') {
      toast.error("Please enter an answer before saving");
      return;
    }
    
    const currentAttemptId = testAttemptId || localStorage.getItem(`testAttempt_${id}`);
    
    if (!currentAttemptId) {
      toast.error("Test session not found. Please restart the test.");
      return;
    }
    
    try {    
        console.log("Saving answer:", { testId: id, questionId, answer, attemptId: currentAttemptId });
        const data = await submitIndividual(id, questionId, answer, currentAttemptId);
        console.log("Answer submitted:", data);
        
        if (data && data.success) {
          // Update the test attempt ID if it changed
          if (data.attemptId && data.attemptId !== currentAttemptId) {
            console.log("Updating attempt ID from response:", data.attemptId);
            setTestAttemptId(data.attemptId);
            localStorage.setItem(`testAttempt_${id}`, data.attemptId);
          }
          
          toast.success("Your answer has been saved");
        } else {
          toast.error(data.message || "Failed to save answer");
          
          // If the test attempt wasn't found, we might need to restart
          if (data?.message?.includes("Test attempt not found")) {
            toast.error("Test session expired. Please refresh and start again.");
          }
        }
    } catch (err) {
        console.error("Error saving answer:", err);
        const errorMessage = err.response?.data?.message || err.message || "Unknown error";
        toast.error("Failed to save answer: " + errorMessage);
        
        // If we got a 404, the test session might have expired
        if (err.response?.status === 404) {
          toast.error("Test session expired. Please refresh and start again.");
        }
    }
  };
  
  // Handle the submission of all answers
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (!testAttemptId) {
        const savedAttemptId = localStorage.getItem(`testAttempt_${id}`);
        if (savedAttemptId) {
          console.log("Retrieved saved attempt ID from localStorage:", savedAttemptId);
          setTestAttemptId(savedAttemptId);
        } else {
          toast.error("Cannot submit test - no active test attempt found");
          setSubmitting(false);
          return;
        }
      }
      
      console.log("Submitting test with ID:", id, "Attempt ID:", testAttemptId || localStorage.getItem(`testAttempt_${id}`));
      const res = await finishTest(id, testAttemptId || localStorage.getItem(`testAttempt_${id}`));
      console.log("Test submission response:", res);
      
      if (res.success) {
        toast.success("Test submitted successfully!");
        // Disable further submissions
        setstart(false);
        // Clear the saved attempt ID
        localStorage.removeItem(`testAttempt_${id}`);
      } else {
        toast.error(res.message || "Failed to submit test");
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      toast.error("Failed to submit test: " + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="base-container py-[5vh]">
      <h1 className="text-3xl font-merri">Answer Questions</h1>
      {testAttemptId && (
        <div className="text-xs text-gray-500 mb-4">Test Session ID: {testAttemptId}</div>
      )}
      {!start && (
         <div className='bg-blue-600 w-[200px] text-center p-2 hover:bg-blue-800 cursor-pointer text-white rounded-lg m-4' onClick={handleStartTest}>
           Start Test
         </div>
      )}
      {start ? (
        <div className="questions-container py-[5vh] w-3/4">
        {!loading ? (
          questions.length > 0 ? (
            questions.map((x, idx) => (
              <div key={x.id || x._id} className="question-item mb-4">
                <div className='flex gap-4'>
                  <div>Q{idx+1}. </div>  
                  <div className="question-text mb-2">{x.question}</div>
                </div>
                <textarea
                  label="Your Answer"
                  value={answers[x.id] || ""}
                  onChange={(e) => changeAnswerValue(x.id, e.target.value)}
                  className="
                    w-full 
                    min-h-[150px] 
                    p-4 
                    text-base 
                    rounded-lg 
                    border 
                    border-gray-300 
                    shadow-md 
                    resize-y 
                    outline-none 
                    transition 
                    focus:border-blue-600 
                    focus:ring-0
                  "
                  placeholder="Type your answer here..."
                />
                <button 
                  className='bg-gray-500 hover:bg-gray-600 w-[150px] text-white p-2 mt-2 rounded' 
                  onClick={() => saveIndiAnswer(x.id, answers[x.id])}
                  disabled={!answers[x.id]}
                >
                  Save Answer
                </button>
              </div>
            ))
          ) : (
            <div>No questions found</div>
          )
        ) : (
          <div className="flex justify-center items-center">
            <CgSpinner className="text-3xl animate-spin" />
          </div>
        )}
        {questions.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || submitting}
            className="mt-4"
          >
            {submitting ? (
              <>
                <CgSpinner className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit All Answers"
            )}
          </Button>
        )}
      </div>
      ) : (
        <div className="text-gray-600 mt-4">
          Questions will be visible once you start the test.
        </div>
      )}
    </div>
  );
}

export default IndividualQuestions;
