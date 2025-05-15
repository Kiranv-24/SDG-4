import React, { useEffect, useState } from "react";
import { getTestsQuery } from "../../api/test";
import Error from "../Error";
import Loading from "../Loading";
import { AiFillEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { GetUserQuery } from "../../api/user";
import { Check, ChecklistOutlined, Error as ErrorIcon, Info } from "@mui/icons-material";

const Test = () => {
  const { data, isLoading, isError, error, refetch } = getTestsQuery();
  const { data: userdata } = GetUserQuery();
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    console.log("Test component data:", data);
    
    if (data) {
      setTests(data.message || []);
      
      // Store any info message if present
      if (data.info) {
        setErrorMessage(data.info);
      } else {
        setErrorMessage("");
      }
    } else {
      setTests([]);
    }
  }, [data]);

  const filteredTests = tests?.filter((item) =>
    item.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatter = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  // Function to handle retry/refresh
  const handleRetry = () => {
    console.log("Retrying test fetch...");
    refetch();
  };

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error loading tests</p>
          <p>{error?.message || "An unknown error occurred"}</p>
          <button 
            onClick={handleRetry}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {isLoading ? (
        <div className="text-center py-4">
          <Loading />
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-semibold">Tests Available for You</h1>
            <div className="flex space-x-2">
              <button 
                onClick={handleRetry} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Refresh
              </button>
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <Info className="w-4 h-4 mr-1" /> {showDebug ? "Hide Debug" : "Debug Info"}
              </button>
            </div>
          </div>
          
          {showDebug && (
            <div className="bg-gray-100 p-3 mb-4 rounded text-xs font-mono overflow-auto">
              <details open>
                <summary className="cursor-pointer font-bold mb-2">Debug Information</summary>
                <div>
                  <p><strong>User:</strong> {userdata?.name} (Class: {userdata?.classname})</p>
                  <p><strong>Tests Count:</strong> {tests?.length || 0}</p>
                  {data?.classInfo && (
                    <p><strong>Class Info:</strong> ID: {data.classInfo.id}, Name: {data.classInfo.name}</p>
                  )}
                  <div className="mt-2">
                    <strong>Raw Response:</strong>
                    <pre className="bg-gray-200 p-2 mt-1 max-h-40 overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}
          
          {/* Search bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by subject name..."
              className="w-full p-2 border border-gray-300 rounded"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {errorMessage && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          {filteredTests && filteredTests.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-center">
                  <th className="p-2 border border-gray-300">Subject</th>
                  <th className="p-2 border border-gray-300">Title/Description</th>
                  <th className="p-2 border border-gray-300">Questions</th>
                  <th className="p-2 border border-gray-300">Date</th>
                  <th className="p-2 border border-gray-300">Created By</th>
                  <th className="p-2 border border-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((item) => (
                  <tr
                    key={item.id}
                    className="even:bg-gray-50 odd:bg-white hover:bg-gray-100 transition duration-200"
                  >
                    <td className="p-2 border border-gray-300">
                      {item.subject?.name || "Unknown Subject"}
                    </td>
                    <td className="p-2 border border-gray-300 text-left">
                      {item.title || item.description || "No description available"}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {item.questionCount || "N/A"}
                    </td>
                    <td className="p-2 border border-gray-300">
                      {formatter(item.createdAt)}
                    </td>
                    <td className="p-2 border border-gray-300">
                      {item.owner?.name || "Unknown"}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {item.completed ? (
                        <span className="text-green-600 font-semibold flex items-center justify-center">
                          <Check /> Completed
                        </span>
                      ) : item.attempts ? (
                        <span className="text-orange-600 font-semibold flex items-center justify-center">
                          In Progress
                        </span>
                      ) : (
                        <Link 
                          to={`/user/test/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                        >
                          <AiFillEye className="mr-1" /> Start Test
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-gray-100 text-center p-5 rounded">
              <p className="text-lg text-gray-700">No tests found for your class</p>
              <p className="text-sm text-gray-500 mt-2">Tests will appear here when your mentors create them</p>
              {userdata?.classname && (
                <p className="text-sm bg-blue-50 p-2 mt-3 rounded inline-block">
                  Your class is set to: <strong>{userdata.classname}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Test;
