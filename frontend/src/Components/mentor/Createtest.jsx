import React, { useState } from "react";
import { createTest } from "../../api/test";
import { Button, TextField, IconButton, Alert } from "@mui/material";
import toast from "react-hot-toast";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

function CreateTest() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [testInfo, setTestInfo] = useState({
    title: "",
    description: "",
    subjectname: "",
    classname: "",
  });

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setTestInfo((prevTestInfo) => ({
      ...prevTestInfo,
      [name]: value,
    }));
    setError(null); // Clear error when user makes changes
  };

  const handleQuestionChange = (event) => {
    setNewQuestion(event.target.value);
    setError(null);
  };

  const addQuestion = () => {
    if (newQuestion.trim() !== "") {
      setQuestions([...questions, { question: newQuestion }]);
      setNewQuestion("");
      setError(null);
    }
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!testInfo.title?.trim()) {
      setError("Test name is required");
      return false;
    }
    if (!testInfo.subjectname?.trim()) {
      setError("Subject name is required");
      return false;
    }
    if (!testInfo.classname?.trim()) {
      setError("Class name is required");
      return false;
    }
    if (questions.length === 0) {
      setError("Please add at least one question");
      return false;
    }
    return true;
  };

  const createTestHandler = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Submitting test data:", { ...testInfo, questions });
      const response = await createTest({ ...testInfo, questions });
      console.log("Server response:", response);

      if (response.success) {
        toast.success("Test created successfully");

        // Invalidate and refetch all relevant queries
        console.log("Invalidating and refetching queries...");
        await Promise.all([
          queryClient.invalidateQueries(["get-mentor-Tests"]),
          queryClient.invalidateQueries(["get-my-Tests"]),
          queryClient.refetchQueries(["get-mentor-Tests"], { active: true }),
          queryClient.refetchQueries(["get-my-Tests"], { active: true })
        ]);

        // Reset form
        setTestInfo({
          title: "",
          description: "",
          subjectname: "",
          classname: "",
        });
        setQuestions([]);

        // Small delay to ensure cache is invalidated before navigation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to the correct path for mentor tests
        navigate("/mentor/my-Test");
      } else {
        setError(response.message || "Failed to create test. Please try again.");
        toast.error(response.message || "Failed to create test");
      }
    } catch (error) {
      console.error("Error creating test:", error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while creating the test";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="base-container py-[5vh]">
      <h1 className="text-3xl font-merri">Create a Test</h1>
      <div className="base-container py-[5vh] w-3/4">
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        <form className="font-comf" onSubmit={createTestHandler}>
          <TextField
            name="title"
            label="Test Name"
            value={testInfo.title}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!testInfo.title}
            helperText={!testInfo.title ? "Test name is required" : ""}
          />
          <TextField
            name="description"
            label="Description"
            value={testInfo.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={4}
            margin="normal"
          />
          <TextField
            name="subjectname"
            label="Subject"
            value={testInfo.subjectname}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!testInfo.subjectname}
            helperText={!testInfo.subjectname ? "Subject is required" : ""}
          />
          <TextField
            name="classname"
            label="Class"
            value={testInfo.classname}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
            error={!testInfo.classname}
            helperText={!testInfo.classname ? "Class is required" : ""}
          />

          <div className="questions-section my-4">
            <h3 className="text-xl mb-2">Questions</h3>
            {questions.map((q, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="w-full bg-gray-100 p-2 rounded">{q.question}</div>
                <IconButton
                  onClick={() => deleteQuestion(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            ))}

            <div className="flex items-center mt-4">
              <TextField
                name="newQuestion"
                label="New Question"
                value={newQuestion}
                onChange={handleQuestionChange}
                fullWidth
                margin="normal"
              />
              <Button
                onClick={addQuestion}
                variant="contained"
                color="primary"
                className="ml-4 h-[40px]"
                disabled={!newQuestion.trim() || isSubmitting}
              >
                Add Question
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            className="mt-4"
          >
            {isSubmitting ? "Creating Test..." : "Create Test"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CreateTest;
