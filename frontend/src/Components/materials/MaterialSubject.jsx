import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import Leftbar from "../Leftbar";
import { getmaterial } from "../../api/material";
import { toast } from "react-hot-toast";
import Loading from "../Loading";

function MaterialSubject() {
  const [material, setMaterial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const { id } = useParams();

  const fetchMaterial = async () => {
    try {
      console.log("Fetching materials for subject:", id);
      const response = await getmaterial(id);
      console.log("API response:", response);

      // Store debug info
      setDebugInfo({
        subjectName: id,
        responseStatus: response?.success,
        errorMessage: response?.message,
        timestamp: new Date().toISOString()
      });

      if (!response) {
        console.error("No response received from API");
        setError("No response received from API");
        setMaterial([]);
      } else if (!response.success) {
        console.error("API error:", response.message);
        setError(typeof response.message === 'string' ? response.message : "Failed to fetch materials");
        setMaterial([]);
        toast.error(typeof response.message === 'string' ? response.message : "Failed to fetch materials");
      } else {
        setMaterial(response.message);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      setDebugInfo(prev => ({
        ...prev,
        catchError: error.message,
        stack: error.stack
      }));
      setError(error.message || "An unexpected error occurred");
      setMaterial([]);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterial();
  }, [id]);

  return (
    <div className="max-w-screen max-h-screen ">
      <div className="p-4  ">
        <h2 className="text-2xl font-semibold mb-4">Material for {id}</h2>
        <div className="">
          {loading ? (
            <>
              <Loading />
            </>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
              <button 
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                onClick={fetchMaterial}
              >
                Try Again
              </button>
              
              {/* Debug section for troubleshooting */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-700">
                <details>
                  <summary className="cursor-pointer font-semibold">Debug Information</summary>
                  <pre className="mt-2 overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ) : material?.length > 0 ? (
            material?.map((mat) => (
              <div
                key={mat.id}
                className="border rounded-lg shadow-lg bg-white p-4 hover:bg-gray-100 mb-4"
              >
                <h3 className="text-xl font-semibold">{mat.title}</h3>
                <p className="mt-2 text-gray-600">{mat.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded">
              <h1 className="text-xl text-gray-600">No materials found for this subject</h1>
              
              {/* Debug section for empty results */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-700">
                <details>
                  <summary className="cursor-pointer font-semibold">Debug Information</summary>
                  <pre className="mt-2 overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialSubject;
