import React, { useEffect, useState } from "react";
import { getSubmissionsByTestId } from "../../api/test"; // Assuming the function is exported from this path
import { useParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Check, CheckCheck, Clock } from "lucide-react";
import Loading from "../Loading";
import toast from "react-hot-toast";

function IndividualTest() {
  const { testId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setloading] = useState(false);
  const getSubmissions = async () => {
    try {
      setloading(true);
      const data = await getSubmissionsByTestId(testId);
      console.log("Test submissions:", data);
      setSubmissions(data.message);
      setloading(false);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load test submissions");
      setloading(false);
    }
  };

  useEffect(() => {
    getSubmissions();
  }, []);

  // Helper function to determine test status
  const getStatus = (submission) => {
    if (submission.completedAt) {
      return "Completed";
    } else {
      return "In Progress";
    }
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPpp");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString || "N/A";
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-merri mb-5">Test Submissions</h1>
      {!loading ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Name</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Completed At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.user.name}</TableCell>
                    <TableCell>
                      {formatDate(submission.startedAt)}
                    </TableCell>
                    <TableCell>
                      {formatDate(submission.completedAt)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatus(submission)}
                        color={submission.completedAt ? "success" : "warning"}
                        size="small"
                        icon={submission.completedAt ? <Check size={14} /> : <Clock size={14} />}
                      />
                    </TableCell>
                    <TableCell>
                      {submission.score !== null && submission.score !== undefined 
                        ? submission.score 
                        : "Not Scored"}
                    </TableCell>
                    <TableCell>
                      {submission.completedAt && (!submission.score && submission.score !== 0) ? (
                        <Link
                          to={`/mentor/submission-details/${submission.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Score Test
                        </Link>
                      ) : submission.completedAt ? (
                        <div className="flex items-center text-green-600">
                          <CheckCheck size={16} className="mr-1" />
                          Scored
                        </div>
                      ) : (
                        <div className="text-amber-600">In Progress</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No submissions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Loading />
      )}
    </div>
  );
}

export default IndividualTest;
