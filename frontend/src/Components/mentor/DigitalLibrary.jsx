import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axios';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';

const DigitalLibrary = () => {
  const [books, setBooks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const navigate = useNavigate();
  const [viewerMenu, setViewerMenu] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axiosInstance.get('/api/books');
      setBooks(response.data);
    } catch (error) {
      toast.error('Error fetching books');
      console.error('Fetch error:', error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !bookTitle || !bookDescription) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', bookTitle);
    formData.append('description', bookDescription);

    try {
      const response = await axiosInstance.post('/api/books/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Book uploaded successfully!');
      setBooks([...books, response.data]);
      setSelectedFile(null);
      setBookTitle('');
      setBookDescription('');
    } catch (error) {
      toast.error('Error uploading book');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleChatWithBook = (bookId) => {
    navigate(`/user/book-chat/${bookId}`);
  };

  const handleOpenViewerMenu = (event, bookId) => {
    setViewerMenu(event.currentTarget);
    setSelectedBookId(bookId);
  };

  const handleCloseViewerMenu = () => {
    setViewerMenu(null);
  };

  const openInAdvancedViewer = () => {
    if (selectedBookId) {
      navigate(`/mentor/book-view/${selectedBookId}`);
    }
    handleCloseViewerMenu();
  };

  const openInSimpleViewer = () => {
    if (selectedBookId) {
      navigate(`/mentor/pdf-view/${selectedBookId}`);
    }
    handleCloseViewerMenu();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Digital Library</h1>
      
      {/* Upload Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Book</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Book Title</label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Enter book title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              rows="3"
              placeholder="Enter book description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">PDF File</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Book'}
          </button>
        </form>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book._id || book.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{book.title}</h3>
              <p className="text-gray-600 mb-4">{book.description}</p>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleChatWithBook(book._id || book.id)}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Chat with Book
                </button>
                <Button
                  variant="outlined"
                  color="primary"
                  endIcon={<ArrowDropDown />}
                  onClick={(e) => handleOpenViewerMenu(e, book._id || book.id)}
                >
                  View Book
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Menu
        anchorEl={viewerMenu}
        open={Boolean(viewerMenu)}
        onClose={handleCloseViewerMenu}
      >
        <MenuItem onClick={openInAdvancedViewer}>Advanced Viewer</MenuItem>
        <MenuItem onClick={openInSimpleViewer}>Simple Viewer</MenuItem>
      </Menu>
    </div>
  );
};

export default DigitalLibrary; 