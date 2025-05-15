import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { ZodError, z } from "zod";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import ms from "ms";
import { customResponse } from "../../../utils/Response";

const prisma = new PrismaClient();

const meetController = {
  // student to book their meeting with the mentor he wants
  async bookMeeting(req, res, next) {
    try {
      const { guestId, notes, dates, title } = req.body;
      const hostId = req.user.id;
      console.log(req.body);
      
      if (!guestId || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Guest ID and at least one date are required"
        });
      }

      const host = await prisma.user.findUnique({
        where: {
          id: hostId,
        },
      });

      if (!host) {
        return res.status(404).json({
          success: false,
          message: "Host user not found"
        });
      }

      const guest = await prisma.user.findUnique({
        where: {
          id: guestId,
        },
      });

      if (!guest) {
        return res.status(404).json({
          success: false,
          message: "Guest (mentor) not found"
        });
      }

      if (host.role !== "student") {
        return res.status(403).json({
          success: false, 
          message: "Only students can book meetings"
        });
      }

      if (guest.role !== "mentor") {
        return res.status(403).json({
          success: false, 
          message: "You can only book meetings with mentors"
        });
      }

      // Generate a random room ID for the meeting
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Generate a default title if not provided
      const meetingTitle = title || `Meeting with ${guest.name} - ${new Date().toLocaleDateString()}`;

      // Create the meeting without guestId
      const meeting = await prisma.meeting.create({
        data: {
          hostId: hostId,
          status: "requested",
          // notes: notes || "",
          roomId: roomId,
          title: meetingTitle,
          dates: {
            create: dates.map((date) => ({
              date: date,
            })),
          },
          // Add the guest as a participant
          participants: {
            create: [
              {
                userId: guestId,
                // role: "guest"
              }
            ]
          }
        },
        include: {
          dates: true,
          participants: {
            include: {
              user: true
            }
          }
        },
      });
      
      // Format the response with guest info
      const guestParticipant = meeting.participants.find(p => p.userId === guestId);
      const meetingWithGuest = {
        ...meeting,
        guest: guestParticipant ? {
          id: guestId,
          name: guest.name,
          email: guest.email,
        } : null
      };
      
      return res.status(201).json({
        success: true,
        message: meetingWithGuest,
      });
    } catch (err) {
      console.error("Error in bookMeeting:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while booking the meeting",
        error: err.message
      });
    }
  },

  // meeting creation
  // only the student can book a meeting and not the other way around
  // guest -> mentor
  // host -> student

  async confirmMeeting(req, res, next) {
    try {
      const { meetingId } = req.body;
      const mentorId = req.user.id;
      
      if (!meetingId) {
        return res.status(400).json({
          success: false,
          message: "Meeting ID is required"
        });
      }

      const mentor = await prisma.user.findUnique({
        where: {
          id: mentorId
        }
      });

      if (!mentor || mentor.role !== "mentor") {
        return res.status(403).json({
          success: false,
          message: "Only mentors can confirm meetings"
        });
      }

      const meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          participants: {
            some: {
              userId: mentorId
            }
          }
        },
        include: {
          dates: true,
          participants: {
            include: {
              user: true
            }
          }
        }
      });
      
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found or you don't have permission to confirm it"
        });
      }

      if (meeting.status === "confirmed") {
        return res.status(400).json({
          success: false,
          message: "This meeting is already confirmed"
        });
      }

      // Get host information separately
      let hostInfo = { id: null, name: "Unknown", email: null };
      
      if (meeting.hostId) {
        try {
          const hostUser = await prisma.user.findUnique({
            where: {
              id: meeting.hostId
            },
            select: {
              id: true,
              name: true,
              email: true
            }
          });
          
          if (hostUser) {
            hostInfo = hostUser;
          }
        } catch (error) {
          console.error("Error fetching host info:", error);
          // Continue with default host info
        }
      }

      // Update the meeting status to "confirmed"
      // Only update the status field, don't touch other fields
      const updatedMeeting = await prisma.meeting.update({
        where: {
          id: meetingId,
        },
        data: {
          status: "confirmed",
        },
        include: {
          dates: true,
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      // Combine meeting data with host data
      const meetingWithHost = {
        ...updatedMeeting,
        host: hostInfo
      };

      return res.status(200).json({
        success: true,
        message: meetingWithHost
      });
    } catch (err) {
      console.error("Error in confirmMeeting:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while confirming the meeting",
        error: err.message
      });
    }
  },
  // for mentor to see the meetings he need to attend
  async getMeetings(req, res, next) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }
      
      const mentor = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      
      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      if (mentor.role !== "mentor") {
        return res.status(403).json({
          success: false,
          message: "Only mentors can access this endpoint"
        });
      }
      
      // Find meetings where the mentor is a participant
      const meetings = await prisma.meeting.findMany({
        where: {
          participants: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          dates: true,
          participants: {
            include: {
              user: true
            }
          },
          host: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
      });
      
      // Format the response
      const formattedMeetings = meetings.map(meeting => {
        return {
          ...meeting,
          host: {
            id: meeting.host.id,
            name: meeting.host.name,
            email: meeting.host.email
          }
        };
      });
      
      return res.status(200).json({
        success: true,
        message: formattedMeetings,
      });
    } catch (err) {
      console.error("Error in getMeetings:", err);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred while fetching meetings",
        error: err.message 
      });
    }
  },
  // for the student to see the booked meeting only one at a time with only a single mentor

  async showbookedMeetings(req, res, next) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Get meetings for the user
      const meetings = await prisma.meeting.findMany({
        where: {
          hostId: userId,
        },
        include: {
          dates: true,
          participants: {
            include: {
              user: true
            }
          }
        },
      });

      // Format meetings with guest info
      const meetingsWithGuests = meetings.map(meeting => {
        // Find the first participant that isn't the host
        const guestParticipant = meeting.participants.find(p => p.userId !== userId);
        
        let guestInfo = { id: null, name: "Unknown", email: null };
        
        if (guestParticipant) {
          guestInfo = {
            id: guestParticipant.userId,
            name: guestParticipant.user.name,
            email: guestParticipant.user.email
          };
        }
        
        return {
          ...meeting,
          guest: guestInfo,
        };
      });

      return res.status(200).json({
        success: true,
        message: meetingsWithGuests,
      });
    } catch (err) {
      console.error("Error in showbookedMeetings:", err);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred while fetching meetings",
        error: err.message 
      });
    }
  },
  // get all the mentors
  async getmentorsinfo(req, res, next) {
    try {
      const mentors = await prisma.user.findMany({
        where: {
          role: "mentor",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phonenumber: true,
          role: true
        }
      });
      
      return res.status(200).json({
        success: true,
        message: mentors
      });
    } catch (err) {
      console.error("Error in getmentorsinfo:", err);
      return res.status(500).json({
        success: false, 
        message: "An error occurred while fetching mentors",
        error: err.message
      });
    }
  },
};
export default meetController;
