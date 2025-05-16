import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import { ArrowBack, Download, Refresh, OpenInNew } from '@mui/icons-material';
import axiosInstance from '../../api/axios';

const DirectPdfViewer = () => {
  const { bookId } = useParams();
  const [bookDetails, setBookDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const navigate = useNavigate();
  const [showIframeError, setShowIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now()); // Add key for iframe refresh

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/books/${bookId}`);
        setBookDetails(response.data);
        
        // Create multiple URL options for better reliability
        let pdfSource = null;
        
        // Primary: Try Cloudinary URL if available (most reliable)
        if (response.data.filePath && response.data.filePath.startsWith('https://res.cloudinary.com')) {
          console.log('Using Cloudinary URL directly for simple viewer:', response.data.filePath);
          pdfSource = response.data.filePath;
        } 
        // Secondary: Use proxy URL through our backend
        else {
          const proxyUrl = `${axiosInstance.defaults.baseURL}/api/books/pdf/${bookId}`;
          console.log('Using proxy URL for simple viewer:', proxyUrl);
          pdfSource = proxyUrl;
        }
        
        // Set the PDF URL
        setPdfUrl(pdfSource);
      } catch (error) {
        console.error('Error fetching book details:', error);
        toast.error('Error loading book');
        setError('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const goBack = () => navigate(-1);

  const downloadPdf = () => {
    if (pdfUrl) {
      // Create a direct download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = bookDetails?.title || `book_${bookId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleIframeError = () => {
    console.error('PDF failed to load in iframe');
    setShowIframeError(true);
    toast.error('PDF failed to load. Try downloading it directly.');
  };

  // Add an event listener to catch object tag errors
  useEffect(() => {
    const handleObjectError = () => {
      console.error('PDF failed to load in object tag');
      setShowIframeError(true);
    };

    window.addEventListener('error', (e) => {
      if (e.target.tagName === 'OBJECT' && e.target.data === pdfUrl) {
        handleObjectError();
      }
    }, true);

    return () => {
      window.removeEventListener('error', handleObjectError);
    };
  }, [pdfUrl]);

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };
  
  const retryLoading = () => {
    setShowIframeError(false);
    setIframeKey(Date.now()); // Force iframe refresh
  };

  const switchToAdvancedViewer = () => {
    const path = window.location.pathname;
    if (path.includes('/pdf-view/')) {
      navigate(path.replace('/pdf-view/', '/book-view/'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <CircularProgress />
        <p className="mt-4">Loading book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-xl font-bold mb-4">{error}</div>
        <Button variant="contained" color="primary" onClick={goBack}>
          GO BACK
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {bookDetails && (
        <div className="bg-white p-4 shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{bookDetails.title}</h1>
            <p className="text-gray-600">{bookDetails.description}</p>
          </div>
          <div className="flex">
            <Button startIcon={<Download />} variant="outlined" color="primary" onClick={downloadPdf}>
              Download
            </Button>
            <Button variant="outlined" color="secondary" onClick={openInNewTab} className="mx-2">
              Open in New Tab
            </Button>
            <Button variant="outlined" color="info" onClick={switchToAdvancedViewer} className="mr-2">
              Advanced Viewer
            </Button>
            <Button startIcon={<ArrowBack />} variant="outlined" onClick={goBack}>
              Back
            </Button>
          </div>
        </div>
      )}

      {showIframeError ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100">
          <Box className="bg-white p-6 rounded-lg shadow-lg max-w-lg text-center">
            <Typography variant="h5" className="text-red-600 mb-4">
              PDF Viewer Failed to Load
            </Typography>
            <Typography className="mb-4">
              Try refreshing, downloading the PDF or opening it in a new tab.
            </Typography>
            <div className="flex justify-center gap-4">
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Refresh />}
                onClick={retryLoading}
              >
                Retry Loading
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<OpenInNew />}
                onClick={openInNewTab}
              >
                Open in New Tab
              </Button>
              <Button 
                variant="outlined"
                startIcon={<Download />}
                onClick={downloadPdf}
              >
                Download
              </Button>
            </div>
          </Box>
        </div>
      ) : pdfUrl ? (
        <div className="flex-1 h-full">
          {/* Primary viewer using object tag for better PDF compatibility */}
          <object
            data={pdfUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            className="w-full h-full"
            aria-label={bookDetails?.title || 'PDF Document'}
            title={bookDetails?.title || 'PDF Document'}
          >
            <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg text-center">
                <Typography variant="h5" className="mb-4">
                  Your browser cannot display the PDF directly
                </Typography>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={openInNewTab}
                  >
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={downloadPdf}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </object>
        </div>
      ) : (
        <Box className="flex-1 flex items-center justify-center">
          <Typography variant="h5" color="error">
            Unable to load PDF viewer
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default DirectPdfViewer;
