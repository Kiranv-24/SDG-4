import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { IconButton, CircularProgress, Button, Box, Typography } from '@mui/material';
import { ArrowBack, ArrowForward, ZoomIn, ZoomOut, Download, Refresh } from '@mui/icons-material';
import axiosInstance from '../../api/axios';

// Fix worker configuration with multiple fallback options
// Try specific CDN version first (most reliable)
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

// Alternative CDNs if the primary one fails
if (typeof window !== 'undefined') {
  window.pdfjsWorkerSrc = pdfjs.GlobalWorkerOptions.workerSrc;
  
  // Add error handler for the worker script
  window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('pdf.worker')) {
      console.warn('PDF.js worker failed to load, trying alternative CDN');
      // Try alternative CDN
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
    }
  }, true);
}

const BookViewer = () => {
  const { bookId } = useParams();
  const [bookDetails, setBookDetails] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerFailed, setViewerFailed] = useState(false);
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);

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
          console.log('Using Cloudinary URL:', response.data.filePath);
          pdfSource = response.data.filePath;
        } 
        // Secondary: Use proxy URL through our backend
        else {
          const proxyUrl = `${axiosInstance.defaults.baseURL}/api/books/pdf/${bookId}`;
          console.log('Using proxy URL:', proxyUrl);
          pdfSource = proxyUrl;
        }
        
        // Set the PDF URL
        setPdfUrl(pdfSource);
      } catch (error) {
        console.error('Error loading book details:', error);
        toast.error('Error loading book details');
        setError('Failed to load book details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setViewerFailed(false);
    setLoading(false);
    console.log('PDF loaded successfully with', numPages, 'pages');
  };

  const onDocumentLoadError = (err) => {
    console.error('Error loading PDF:', err);
    setViewerFailed(true);
    toast.error('PDF viewer had trouble loading. Switching to simple viewer...');
    setTimeout(() => switchToDirectViewer(), 2000);
  };

  const goToPrevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber(p => Math.min(p + 1, numPages || 1));
  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.6));
  const goBack = () => navigate(-1);

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = bookDetails?.fileName || `book_${bookId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const switchToDirectViewer = () => {
    const path = window.location.pathname;
    if (path.includes('/book-view/')) {
      navigate(path.replace('/book-view/', '/pdf-view/'));
    }
  };

  const retryLoading = () => {
    setLoading(true);
    setViewerFailed(false);
    // Force reload the PDF
    const currentUrl = pdfUrl;
    setPdfUrl(null);
    setTimeout(() => {
      setPdfUrl(currentUrl);
    }, 500);
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
        <Typography color="error" className="text-xl font-bold mb-4">
          {error}
        </Typography>
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
          <div>
            <Button startIcon={<Download />} variant="outlined" color="primary" onClick={downloadPdf} className="mr-2">
              Download PDF
            </Button>
            <Button variant="outlined" color="secondary" onClick={switchToDirectViewer} className="mr-2">
              Simple Viewer
            </Button>
            <Button startIcon={<ArrowBack />} variant="outlined" onClick={goBack}>
              Back
            </Button>
          </div>
        </div>
      )}

      {viewerFailed ? (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <Box className="bg-white p-6 rounded-lg shadow-lg max-w-lg text-center">
            <Typography variant="h5" className="text-red-600 mb-4">
              PDF Viewer Failed to Load
            </Typography>
            <Typography className="mb-4">
              Try using the simple viewer, refreshing, or downloading the PDF.
            </Typography>
            <div className="flex justify-center gap-4">
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Refresh />}
                onClick={retryLoading}
              >
                Retry
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={switchToDirectViewer}
              >
                Simple Viewer
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
      ) : (
        <div className="flex-1 flex flex-col items-center bg-gray-100 p-4 overflow-auto">
          <div className="flex justify-center mb-4 bg-white p-2 rounded shadow">
            <IconButton onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <ArrowBack />
            </IconButton>
            <Typography className="mx-4 flex items-center">
              Page {pageNumber} of {numPages || "?"}
            </Typography>
            <IconButton onClick={goToNextPage} disabled={pageNumber >= numPages}>
              <ArrowForward />
            </IconButton>
            <div className="border-l mx-2 h-6"></div>
            <IconButton onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut />
            </IconButton>
            <Typography className="mx-2 flex items-center">
              {Math.round(scale * 100)}%
            </Typography>
            <IconButton onClick={zoomIn} disabled={scale >= 3.0}>
              <ZoomIn />
            </IconButton>
          </div>
          
          {pdfUrl && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<CircularProgress size={50} />}
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
                disableStream: false,
                disableAutoFetch: false,
                isEvalSupported: true,
                useSystemFonts: true
              }}
            >
              {numPages > 0 && (
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg bg-white"
                  loading={<CircularProgress size={30} />}
                />
              )}
            </Document>
          )}
        </div>
      )}
    </div>
  );
};

export default BookViewer;
