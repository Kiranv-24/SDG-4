import React from "react";
import { getSubmissionQuery } from "../../api/user";
import { CircularProgress, Chip } from "@mui/material";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

function MySubmissions() {
  const { data: submissionData, isLoading, refetch } = getSubmissionQuery();

  const formatter = (data) => {
    return new Date(data).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const getStatusChip = (submission) => {
    if (!submission.startedAt) {
      return (
        <Chip
          label="Not Started"
          color="default"
          size="small"
          icon={<AlertCircle size={14} />}
        />
      );
    }
    if (!submission.completedAt) {
      return (
        <Chip
          label="In Progress"
          color="warning"
          size="small"
          icon={<Clock size={14} />}
        />
      );
    }
    if (submission.completedAt && submission.score !== null && submission.score !== undefined) {
      return (
        <Chip
          label="Scored"
          color="success"
          size="small"
          icon={<CheckCheck size={14} />}
        />
      );
    }
    return (
      <Chip
        label="Completed"
        color="primary"
        size="small"
        icon={<Check size={14} />}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Your Test Submissions</h1>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {submissionData && submissionData.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 border-b border-gray-200">Test Name</th>
                <th className="px-6 py-3 border-b border-gray-200">Status</th>
                <th className="px-6 py-3 border-b border-gray-200">Started At</th>
                <th className="px-6 py-3 border-b border-gray-200">Completed At</th>
                <th className="px-6 py-3 border-b border-gray-200">Score</th>
              </tr>
            </thead>
            <tbody>
              {submissionData.map((submission) => (
                <tr
                  key={submission.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 border-b border-gray-200">
                    {submission.test?.title || "Untitled Test"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    {getStatusChip(submission)}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    {submission.startedAt ? formatter(submission.startedAt) : "Not started"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    {submission.completedAt ? formatter(submission.completedAt) : "In progress"}
                  </td>
                  <td className="px-6 py-4 border-b border-gray-200">
                    {submission.completedAt ? (
                      submission.score !== null && submission.score !== undefined ? (
                        <span className="font-semibold text-green-600">{submission.score}</span>
                      ) : (
                        <span className="text-orange-500">Pending Review</span>
                      )
                    ) : (
                      <span className="text-gray-500">Not completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't taken any tests yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default MySubmissions;
