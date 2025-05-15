import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { IoMdSend } from 'react-icons/io';
import axiosInstance from '../../api/axios';

const BookChat = () => {
  const { bookId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchBookDetails = async () => {
    try {
      const response = await axiosInstance.get(`/api/books/${bookId}`);
      setBookDetails(response.data);
    } catch (error) {
      toast.error('Error fetching book details');
      console.error('Error:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/chat/book', {
        bookId,
        message: inputMessage,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.reply,
        },
      ]);
    } catch (error) {
      toast.error('Error getting response');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen p-6">
      {/* Book Details Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h1 className="text-2xl font-bold">{bookDetails?.title}</h1>
        <p className="text-gray-600">{bookDetails?.description}</p>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-4 mb-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-gray-800">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask anything about the book..."
          className="flex-1 rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <IoMdSend size={24} />
        </button>
      </form>
    </div>
  );
};

export default BookChat; 