import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster, toast, useToasterStore } from "react-hot-toast";
import { useEffect } from "react";
import Register from "./Components/auth/Register";
import Login from "./Components/auth/Login";
import Test from "./Components/student/Test";
import Landing from "./pages/Home/Landing";
import Meeting from "./Components/student/Meeting";
import ConfirmBooking from "./Components/mentor/ConfirmBooking";
import Courses from "./Components/student/Course";
import CreateTest from "./Components/mentor/Createtest";
import Meetings from "./Components/mentor/Meetings";
import ProtectedRoute from "./Components/PrivateRoute";
import Mentortest from "./Components/mentor/mentor-test";
import Report from "./Components/student/Report";
import Discuss from "./Components/student/Discuss";
import Leaderboard from "./Components/student/Leaderboard";

import Profile from "./Components/student/Profile";
import Settings from "./Components/student/Settings";
import Protectedroute1 from "./Components/Protectedroute1";
import Dashboard from "./Components/Dashboard";
import Material from "./Components/materials/materials";
import MaterialSubject from "./Components/materials/MaterialSubject";
import CreateMaterial from "./Components/mentor/CreateMaterial";
import Sathi from "./Components/virtual-mentor/Sathi";
import Classroom from "./Components/mentor/Classroom";

import Newsfeed from "./Components/Newsfeed";
import Chatbot from "./Components/virtual-mentor/chatbot";
import About from "./Components/About";
import Meet from "./Components/videocall/Meeting";
import PersonalBookings from "./Components/student/PersonalBookings";
import Chat from "./Components/student/Chat";
import IndividualQuestions from "./Components/student/IndividualQuestions";
import IndividualTest from "./Components/mentor/IndividualTest";
import SubmissionDetails from "./Components/mentor/SubmissionDetails";
import MySubmissions from "./Components/student/MySubmissions";
import DigitalLibrary from "./Components/mentor/DigitalLibrary";
import StudentDigitalLibrary from "./Components/student/DigitalLibrary";
import BookChat from "./Components/student/BookChat";
import BookViewer from "./Components/student/BookViewer";
import DirectPdfViewer from "./Components/student/DirectPdfViewer";
import VideoLibrary from "./Components/student/VideoLibrary";
import VideoPlayer from "./Components/student/VideoPlayer";
import VideoUpload from "./Components/mentor/VideoUpload";

function App() {
  function isJWTValid() {
    const token = localStorage.getItem("token");
    if (token) {
      return true;
    }
    return false;
  }
  useEffect(() => {
    if (!isJWTValid()) {
      let val = localStorage.getItem("token");
      if (val !== null) {
        toast.error("Session expired! Please Login");
      }
      if (val === null) {
        toast.success("Please Login");
      }
    }
  }, []);

  const MAX_TOAST_LIMIT = 1;
  const { toasts } = useToasterStore();
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= MAX_TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <div className="App">
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{ duration: 5000 }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
        
          </Route>

          <Route path="/user" element={<Dashboard />}>
            <Route path="chatbot" element={<Chatbot />} />
              <Route path="chat" element={<Chat />} />
            <Route path="courses" element={<Courses />} />
                <Route path="test/:id" element={<IndividualQuestions />} />
             <Route path="meet" element={<Meet />} />
               
            <Route path="sathi" element={<Sathi />} />
             <Route path="my-submissions" element={<MySubmissions />} />
            <Route path="material/:id" element={<MaterialSubject />} />
            <Route path="test" element={<Test />} />
            <Route path="material" element={<Material />} />
            <Route path="book-meeting" element={<Meeting />} />
             <Route path="personal-meeting" element={<PersonalBookings />} />
            <Route path="discuss" element={<Discuss />} />
            <Route path="report" element={<Report />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="newsfeed" element={<Newsfeed />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="confirm-booking/:id" element={<ConfirmBooking />} />
            <Route path="book-chat/:bookId" element={<BookChat />} />
            <Route path="book-view/:bookId" element={<BookViewer />} />
            <Route path="pdf-view/:bookId" element={<DirectPdfViewer />} />
            <Route path="digital-library" element={<StudentDigitalLibrary />} />
            <Route path="video-library" element={<VideoLibrary />} />
            <Route path="video-player/:videoId" element={<VideoPlayer />} />
          </Route>
          <Route path="/mentor" element={<Dashboard />}>
            <Route path="my-Test" element={<Mentortest />} />
            <Route path="createtest" element={<CreateTest />} />
            <Route path="Meetings" element={<Meetings />} />
              <Route path="submission/:testId" element={<IndividualTest />} />
                <Route path="submission-details/:id" element={<SubmissionDetails />} />
            <Route path="createMaterial" element={<CreateMaterial />} />
            <Route path="material" element={<Material />} />
            <Route path="material/:id" element={<MaterialSubject />} />
            <Route path="classroom" element={<Classroom />} />
            <Route path="digital-library" element={<DigitalLibrary />} />
            <Route path="book-view/:bookId" element={<BookViewer />} />
            <Route path="pdf-view/:bookId" element={<DirectPdfViewer />} />
            <Route path="video-upload" element={<VideoUpload />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
