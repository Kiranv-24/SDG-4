import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
const configurePdfWorker = () => {
  // For Vite/Webpack projects, we need to provide a more reliable URL
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  
  // Fallback if the CDN fails
  if (typeof window !== 'undefined') {
    window.pdfjsWorker = pdfjs.GlobalWorkerOptions.workerSrc;
  }
};

// Initialize worker
configurePdfWorker();

export { configurePdfWorker }; 