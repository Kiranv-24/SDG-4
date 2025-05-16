import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axios';
import { Button, CircularProgress, Menu, MenuItem } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';

const DigitalLibrary = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [viewerMenu, setViewerMenu] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/books');
      setBooks(response.data);
    } catch (error) {
      toast.error('Error fetching books');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
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
      navigate(`/user/book-view/${selectedBookId}`);
    }
    handleCloseViewerMenu();
  };

  const openInSimpleViewer = () => {
    if (selectedBookId) {
      navigate(`/user/pdf-view/${selectedBookId}`);
    }
    handleCloseViewerMenu();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Digital Library</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <CircularProgress />
        </div>
      ) : books.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          <p>No books available in the library yet. Check back later!</p>
        </div>
      ) : (
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
      )}

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