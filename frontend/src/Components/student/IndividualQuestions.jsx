import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { finishTest, getQuestionByTestId, startTest, submitIndividual } from '../../api/test';
import { CgSpinner } from 'react-icons/cg';
import { TextField, Button, Alert, CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

function IndividualQuestions() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [start, setstart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testAttemptId, setTestAttemptId] = useState(null);
  const [error, setError] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Log whenever testAttemptId changes
  useEffect(() => {
    console.log("Test attempt ID updated:", testAttemptId);
  }, [testAttemptId]);

  const fetchTestInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestionByTestId(id);
      console.log("Fetched questions:", data);
      setQuestions(data.message);
      const initialAnswers = {};
      data.message.forEach(q => {
        initialAnswers[q.id] = '';
      });
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
          toast.success("Test started successfully");
        }
      } catch (err) {
        console.error("Error starting test:", err);
        setError(err.message || "Failed to start test");
        toast.error(err.message || "Failed to start test");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError(error.message || "Failed to load questions");
      toast.error(error.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestInfo();
  }, [id]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!testAttemptId || !start) return;

    const saveAnswers = async () => {
      try {
        setAutoSaveStatus('Saving...');
        for (const questionId in answers) {
          if (answers[questionId]) {
            await submitIndividual({
              testId: id,
              questionId,
              answer: answers[questionId],
              testAttemptId
            });
          }
        }
        setAutoSaveStatus('Saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('Save failed');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    };

    const intervalId = setInterval(saveAnswers, 30000);
    return () => clearInterval(intervalId);
  }, [testAttemptId, answers, id, start]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!testAttemptId) {
      toast.error("No active test attempt");
      return;
    }

    setSubmitting(true);
    try {
      // First save any pending answers
      for (const questionId in answers) {
        if (answers[questionId]) {
          await submitIndividual({
            testId: id,
            questionId,
            answer: answers[questionId],
            testAttemptId
          });
        }
      }

      // Then finish the test
      await finishTest(id, testAttemptId);
      
      // Invalidate relevant queries to trigger updates
      await queryClient.invalidateQueries(['get-tests']);
      await queryClient.invalidateQueries(['get-my-tests']);
      
      toast.success("Test submitted successfully!");
      navigate('/user/my-submissions');
    } catch (error) {
      console.error("Error submitting test:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to submit test";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="base-container py-[5vh] flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="base-container py-[5vh]">
        <Alert 
          severity="error" 
          className="mb-4"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchTestInfo}
              disabled={loading}
            >
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="base-container py-[5vh]">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-merri">Test Questions</h1>
        {autoSaveStatus && (
          <span className="text-sm text-gray-500">{autoSaveStatus}</span>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Question {index + 1}</h3>
              {answers[question.id] && (
                <span className="text-sm text-green-600">Answer saved</span>
              )}
            </div>
            <p className="mb-4">{question.question}</p>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Type your answer here..."
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              disabled={!start || submitting}
            />
          </div>
        ))}

        <div className="flex justify-end mt-8">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting || !start}
            className="px-6 py-2"
          >
            {submitting ? (
              <>
                <CgSpinner className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Test'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default IndividualQuestions;
