import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  GetAllConvoQuery,
  GetAllUsersQuery,
  GetUserQuery,
  sendMessage,
} from "../../api/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { Send, VerifiedUserRounded } from "@mui/icons-material";
import { BiUserCircle } from "react-icons/bi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../Components/ui/dialog";
import { Avatar } from "@mui/material";

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [wantTo, setWantto] = useState();
  const { data: mydetails } = GetUserQuery();
  const [onlineUsers, setOnlineUser] = useState([]);
  const {
    data: AllconvoData,
    isLoading: conversationsLoading,
    refetch,
  } = GetAllConvoQuery();
  const { data: allusers, isLoading: usersLoading } = GetAllUsersQuery();
  const [selectedConvo, setSelectedConvo] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const BACKEND_URL = `${import.meta.env.VITE_BASE_URL}`;

  useEffect(() => {
    if (!mydetails?.id) return;

    // Connect to socket server
    socketRef.current = io(BACKEND_URL, {
      query: {
        userId: mydetails?.id,
      },
    });

    // Handle incoming messages
    socketRef.current.on("new_message", (mess) => {
      console.log("New message received:", mess);
      setSelectedConvo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), { 
            message: mess, 
            senderId: prev?.participants?.[0]?.id || "",
            timestamp: Date.now()
          }],
        };
      });
    });

    socketRef.current.on("getOnlineUsers", (users) => {
      setOnlineUser(users);
      console.log("Online users:", users);
    });

    // Request online users list when connected
    socketRef.current.emit("get_online_users");

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [mydetails?.id, BACKEND_URL]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConvo?.messages]);

  const sendMessageHandler = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty!");
      return;
    }

    if (!selectedConvo || !mydetails?.id) {
      toast.error("Cannot send message right now");
      return;
    }

    // Check if participants array exists and has at least one element
    if (!selectedConvo.participants || selectedConvo.participants.length === 0) {
      toast.error("Invalid conversation recipient");
      return;
    }

    try {
      // Optimistically update the UI
      const newMessage = {
        message: message,
        senderId: mydetails?.id,
        timestamp: Date.now()
      };
      
      setSelectedConvo((prev) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          newMessage
        ],
      }));
      
      // Clear input
      setMessage("");
      
      // Send to server
      await sendMessage(
        message,
        selectedConvo.participants[0].id,
        selectedConvo.id
      );
      
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  const createConversation = async () => {
    if (!wantTo?.id || !mydetails?.id) {
      toast.error("Cannot create conversation");
      return;
    }
    
    try {
      await sendMessage("Hi, let's chat!", wantTo?.id);
      setWantto(null);
      setOpen(false);
      refetch();
      toast.success("Chat started successfully");
    } catch (err) {
      console.error("Error creating conversation:", err);
      toast.error("Failed to start conversation");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageHandler();
    }
  };

  if (usersLoading) return <div>Loading users...</div>;
  if (conversationsLoading) return <div>Loading conversations...</div>;

  return (
    <div className="flex h-screen">
      <div className="bg-gray-300 w-1/4 p-4 text-black">
        <DropdownMenu>
          <DropdownMenuTrigger className="bg-stone-500 hover:bg-stone-600 text-white py-2 px-4 rounded-lg w-full">
            Create Chat
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white">
            <DropdownMenuLabel className="font-bold">
              Select User
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allusers?.map((x) => (
              <DropdownMenuItem
                key={x.id}
                onClick={() => {
                  setOpen(true);
                  setWantto(x);
                }}
                className="cursor-pointer hover:bg-gray-200 px-4 py-2"
              >
                {x.name}
                {onlineUsers.includes(x.id) && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-green-500" title="Online"></span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="mt-6 h-[90%] p-2 overflow-auto">
          {AllconvoData?.map((convo) => (
            <div
              key={convo.id}
              className={`cursor-pointer py-2 px-3 bg-white rounded-lg mb-2 hover:bg-green-200 ${
                selectedConvo?.id === convo.id ? "bg-lime-300" : ""
              }`}
              onClick={() => setSelectedConvo(convo)}
            >
              <div className="flex gap-2 p-2 rounded-md">
                <div className="flex">
                  <Avatar />
                </div>
                <div className="flex flex-col">
                  <div className="font-medium">
                    {convo.participants && convo.participants[0] 
                      ? convo.participants[0].name 
                      : "Unknown User"}
                  </div>
                  {convo.messages && convo.messages.length > 0 && (
                    <div className="text-sm text-gray-500 truncate max-w-[180px]">
                      {convo.messages[convo.messages.length - 1].message}
                    </div>
                  )}
                </div>
                {convo.participants && convo.participants[0] && onlineUsers.includes(convo.participants[0].id) && (
                  <span className="h-2 w-2 rounded-full bg-green-500 ml-auto" title="Online"></span>
                )}
              </div>
            </div>
          ))}
          {AllconvoData?.length === 0 && (
            <div className="text-center text-gray-500 mt-4">
              No conversations yet. Start a new chat!
            </div>
          )}
        </div>
      </div>

      {selectedConvo ? (
        <div className="bg-gray-100 w-3/4 flex flex-col">
          <div className="bg-stone-500 text-white p-4 flex items-center gap-2">
            <BiUserCircle className="text-2xl" />
            <span>
              {selectedConvo.participants && selectedConvo.participants[0] 
                ? selectedConvo.participants[0].name 
                : "Unknown User"}
            </span>
            {selectedConvo.participants && selectedConvo.participants[0] && 
              onlineUsers.includes(selectedConvo.participants[0].id) && (
                <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">Online</span>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {!selectedConvo?.messages?.length && (
              <div className="text-center text-gray-500 mt-4">
                No messages yet. Start the conversation!
              </div>
            )}
            {selectedConvo?.messages?.map((msg, index) => (
              <div
                key={index}
                className={`max-w-md p-3 rounded-lg mb-2 text-white ${
                  mydetails.id === msg.senderId
                    ? "bg-blue-500 ml-auto"
                    : "bg-green-500"
                }`}
              >
                <div className="flex flex-col">
                  <div>{msg.message}</div>
                  <div className="text-xs text-right mt-1 text-white/80">
                    {new Date(msg?.timestamp || Date.now()).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white shadow-lg">
            <div className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border rounded-lg p-2 mr-2 focus:outline-none"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessageHandler}
                disabled={!message.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
              >
                <Send />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center font-semibold text-3xl w-3/4 flex h-screen justify-center items-center">
          Select a conversation or start a new chat
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a chat with {wantTo?.name}</DialogTitle>
            <DialogDescription>
              <button
                onClick={createConversation}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg mt-4"
              >
                Start Chat
              </button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
