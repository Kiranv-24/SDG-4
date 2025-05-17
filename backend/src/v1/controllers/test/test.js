import { PrismaClient } from "@prisma/client";
import { customResponse } from "../../../utils/Response";

const prisma = new PrismaClient();

const testController = {

  async giveScoreTest(req,res){
  try{
    const { attemptId, score } = req.body;
    
    console.log("Scoring test attempt:", { attemptId, score });
    
    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "attemptId is required"
      });
    }
    
    // Validate that the score is a number
    const scoreNumber = parseInt(score);
    if (isNaN(scoreNumber)) {
      return res.status(400).json({
        success: false,
        message: "Score must be a number"
      });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found"
      });
    }

    // Update the test attempt with the score
    const updatedAttempt = await prisma.testAttempt.update({
      where: {
        id: attemptId
      },
      data: {
        score: scoreNumber
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`Successfully scored test attempt ${attemptId} with score ${scoreNumber}`);
    
    // Emit socket event to notify the student
    try {
      const io = req.app.get("io");
      if (io) {
        const eventData = {
          userId: attempt.userId,
          testId: attempt.testId,
          attemptId: attempt.id,
          score: scoreNumber,
          testTitle: attempt.test.title
        };
        
        console.log("Emitting testScored event:", eventData);
        io.to(attempt.userId).emit("testScored", eventData);
        console.log(`Emitted testScored event to user ${attempt.userId}`);
      } else {
        console.warn("Socket.io instance not available");
      }
    } catch (socketError) {
      console.error("Error emitting socket event:", socketError);
      // Continue with the response even if socket emission fails
    }
    
    res.status(200).json({
      success: true,
      message: "Score submitted successfully",
      data: {
        attemptId: updatedAttempt.id,
        score: updatedAttempt.score,
        testId: updatedAttempt.testId,
        userId: updatedAttempt.userId,
        test: updatedAttempt.test,
        user: updatedAttempt.user,
        startedAt: updatedAttempt.startedAt,
        completedAt: updatedAttempt.completedAt
      }
    });
  } catch(err) {
    console.error("Error scoring test:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit score: " + err.message
    });
  } finally {
    await prisma.$disconnect();
  }
},
async getMySubmissions(req,res){
  try{
    const userId = req.user.id;
    const findSub = await prisma.testAttempt.findMany({
      where: {
        userId: userId
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        submissions: {
          select: {
            id: true,
            submittedAt: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Format the response to include submission status
    const formattedSubmissions = findSub.map(sub => ({
      id: sub.id,
      testId: sub.testId,
      startedAt: sub.startedAt,
      completedAt: sub.completedAt,
      score: sub.score,
      test: sub.test,
      submissionCount: sub.submissions.length,
      submissions: undefined // Remove the submissions array from response
    }));

    res.status(200).json({
      success: true,
      message: formattedSubmissions
    });
  } catch(err) {
    console.error("Error getting user submissions:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving submissions"
    });
  } finally {
    await prisma.$disconnect();
  }
},
  async getSubmissionsByTestId(req, res) {
    try {
      const { id } = req.params;
      console.log(`Fetching all submissions for test ID: ${id}`);
      
      // First, check if the test exists
      const test = await prisma.test.findUnique({
        where: {
          id: id
        }
      });
      
      if (!test) {
        console.log(`Test with ID ${id} not found`);
        return res.status(404).json({
          success: false,
          message: "Test not found"
        });
      }
      
      // Find all attempts for this test
      const submissions = await prisma.testAttempt.findMany({
        where: {
          testId: id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          test: {
            select: {
              id: true,
              title: true
            }
          },
          submissions: true
        },
        orderBy: {
          startedAt: 'desc'
        }
      });
      
      console.log(`Found ${submissions.length} test attempts for test ID ${id}`);
      
      // Format the submissions to include answer count
      const formattedSubmissions = submissions.map(sub => ({
        ...sub,
        answerCount: sub.submissions.length,
        submissions: undefined // Remove the submissions array from response
      }));
      
      res.status(200).json({
        success: true,
        message: formattedSubmissions,
        test: test
      });
    } catch (err) {
      console.error("Error fetching test submissions:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Error fetching test submissions"
      });
    } finally {
      await prisma.$disconnect();
    }
  },
 async getSubmissionDetails(req, res) {
  try {
    const { id } = req.params;
    console.log(`Fetching submission details for attempt ID: ${id}`);
    
    // First verify that the test attempt exists
    const attempt = await prisma.testAttempt.findUnique({
      where: {
        id: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            questions: {
              select: {
                id: true,
                question: true
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      console.log(`Test attempt with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Test attempt not found"
      });
    }
    
    console.log(`Found test attempt: ${attempt.id}, user: ${attempt.user.name}, test: ${attempt.test.title}`);
    
    // Now get all submissions for this attempt
    const submissions = await prisma.testSubmission.findMany({
      where: {
        attemptId: id
      },
      include: {
        question: {
          select: {
            id: true,
            question: true
          }
        }
      },
      orderBy: {
        submittedAt: 'asc'
      }
    });
    
    console.log(`Found ${submissions.length} submissions for test attempt ${id}`);
    
    // Even if no submissions are found, we still want to return the attempt info
    res.status(200).json({
      success: true,
      message: submissions,
      attemptInfo: attempt
    });
    
  } catch (err) {
    console.error("Error getting submission details:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving submission details"
    });
  } finally {
    await prisma.$disconnect();
  }
},
  async getQuestions(req,res){
    try{
        const { id } =req.params;
        const questions= await prisma.testQuestion.findMany({
          where:{
            testId:id
          }
        })
        res.status(200).json({
          success:true,
          message:questions
        })
    }catch(err){
  res.status(400).json({
          success:false,
          message:err
        })
    }
  },
   async createTest(req, res) {
    try {
      const { subjectname, classname, description, title, questions } = req.body;

      // Log test creation details
      console.log("Creating test:", { 
        mentorId: req.user.id, 
        title, 
        classname, 
        subjectname 
      });

      // Normalize the class name (trim, lowercase)
      const normalizedClassName = classname.trim();
      
      let classRecord = await prisma.class.findFirst({
        where: { 
          name: normalizedClassName
        },
      });

      console.log("Existing class record:", classRecord);

      if (!classRecord) {
        // Class doesn't exist, create it
        classRecord = await prisma.class.create({
          data: { name: normalizedClassName },
        });
        console.log("Created new class:", classRecord);
      }

      // Find or create subject
      let subjectRecord = await prisma.subject.findFirst({
        where: {
          name: subjectname,
          classId: classRecord.id,
        },
      });

      if (!subjectRecord) {
        subjectRecord = await prisma.subject.create({
          data: { 
            name: subjectname, 
            classId: classRecord.id 
          },
        });
        console.log("Created new subject:", subjectRecord);
      }

      // Create the test with explicit mentorId
      const newTest = await prisma.test.create({
        data: {
          description,
          title,
          mentorId: req.user.id,
          classId: classRecord.id,
          subjectId: subjectRecord.id,
        },
        include: {
          class: true,
          subject: true,
        }
      });

      console.log("Created new test:", { 
        id: newTest.id, 
        title: newTest.title, 
        class: newTest.class.name,
        subject: newTest.subject.name  
      });
      
      // Add questions if provided
      if (questions && questions.length > 0) {
        for (const question of questions) {
          await prisma.testQuestion.create({
            data: {
              question: question.question,
              testId: newTest.id,
            },
          });
        }
        console.log(`Added ${questions.length} questions to test`);
      }

      res.json({ 
        success: true, 
        message: "Test created successfully", 
        data: {
          id: newTest.id,
          title: newTest.title,
          className: newTest.class.name,
          subjectName: newTest.subject.name,
          questionCount: questions?.length || 0
        }
      });
    } catch (error) {
      console.error("Error creating test:", error);
      res.status(500).json({ success: false, message: error.message });
    } finally {
      await prisma.$disconnect();
    }
  },
   async startTestAttempt(req, res) {
    try {
      const { testId } = req.body;
      console.log("Starting test attempt for:", { 
        testId, 
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });

      // Check if test exists with detailed validation
      const test = await prisma.test.findUnique({
        where: { 
          id: testId
        },
        include: { 
          questions: true,
          class: true,
          subject: true
        }, 
      });

      if (!test) {
        console.log("Test not found:", testId);
        return res.status(404).json({ success: false, message: "Test not found" });
      }
      
      console.log(`Found test: ${test.id} (${test.title}) with ${test.questions.length} questions`);

      // Check if user already has an incomplete attempt
      const existingAttempt = await prisma.testAttempt.findFirst({
        where: {
          testId: testId,
          userId: req.user.id,
          completedAt: null
        },
        include: {
          submissions: true
        }
      });

      if (existingAttempt) {
        console.log("Found existing incomplete attempt:", {
          id: existingAttempt.id,
          startedAt: existingAttempt.startedAt,
          answersSubmitted: existingAttempt.submissions.length
        });
        
        return res.json({
          success: true,
          message: "Continuing existing test attempt",
          test: {
            id: test.id,
            title: test.title,
            description: test.description,
            questions: test.questions.map(q => ({
              id: q.id,
              question: q.question,
            })),
          },
          attemptId: existingAttempt.id,
        });
      }

      // Create a new attempt
      const newAttempt = await prisma.testAttempt.create({
        data: {
          userId: req.user.id,
          testId: testId,
          // startedAt is set to now() by default in the schema
        },
      });

      console.log("Created new test attempt:", {
        id: newAttempt.id,
        testId: newAttempt.testId,
        userId: newAttempt.userId,
        startedAt: newAttempt.startedAt
      });

      res.json({
        success: true,
        message: "Test attempt started",
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          questions: test.questions.map(q => ({
            id: q.id,
            question: q.question,
          })),
        },
        attemptId: newAttempt.id,
      });
    } catch (error) {
      console.error("Error starting test attempt:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Error starting test attempt" 
      });
    } finally {
      await prisma.$disconnect();
    }
  },
  async submitAnswer(req, res, next) {
    try {
      const { testId, questionId, answer, attemptId } = req.body;
      console.log("Submitting answer:", { 
        testId, 
        questionId, 
        attemptId,
        userId: req.user.id, 
        answerLength: answer?.length || 0,
        timestamp: new Date().toISOString()
      });

      // Validate the test exists
      const test = await prisma.test.findUnique({
        where: { id: testId }
      });
      
      if (!test) {
        console.log(`Test with ID ${testId} not found`);
        return res.status(404).json({
          success: false,
          message: "Test not found"
        });
      }
      
      // Validate the question exists
      const question = await prisma.testQuestion.findFirst({
        where: {
          id: questionId,
          testId: testId
        }
      });
      
      if (!question) {
        console.log(`Question with ID ${questionId} not found in test ${testId}`);
        return res.status(404).json({
          success: false,
          message: "Question not found in this test"
        });
      }

      // Find test attempt - prefer specific attempt if ID is provided
      let attempt;
      
      if (attemptId) {
        console.log(`Looking for specific attempt with ID: ${attemptId}`);
        attempt = await prisma.testAttempt.findUnique({
          where: {
            id: attemptId,
            testId: testId,
            userId: req.user.id
          }
        });
        
        if (attempt) {
          console.log(`Found attempt: ${attempt.id}, completedAt:`, attempt.completedAt);
          
          // If attempt is already completed, don't allow submission
          if (attempt.completedAt) {
            return res.status(400).json({
              success: false,
              message: "Cannot submit answer to a completed test"
            });
          }
        } else {
          console.log(`Attempt with ID ${attemptId} not found`);
        }
      }
      
      // If no specific attempt found, look for any in-progress attempt
      if (!attempt) {
        console.log("Looking for any in-progress attempt");
        attempt = await prisma.testAttempt.findFirst({
          where: {
            testId: testId,
            userId: req.user.id,
            completedAt: null, // Test is still in progress
          },
        });
      }

      if (!attempt) {
        console.log("No in-progress test attempt found");
        return res.status(404).json({ 
          success: false,
          message: "Test attempt not found or already completed. Please start the test again." 
        });
      }

      console.log("Found test attempt:", attempt.id);

      // Check for existing submission
      const existingSubmission = await prisma.testSubmission.findFirst({
        where: {
          attemptId: attempt.id,
          questionId: questionId,
        },
      });

      let submission;

      if (existingSubmission) {
        console.log("Updating existing answer for question:", questionId);
        submission = await prisma.testSubmission.update({
          where: {
            id: existingSubmission.id,
          },
          data: {
            answer,
            submittedAt: new Date(),
          },
        });

        return res.json({
          success: true,
          message: "Answer updated successfully",
          submission,
          attemptId: attempt.id // Return the attempt ID with the response
        });
      } else {
        console.log("Creating new answer for question:", questionId);
        submission = await prisma.testSubmission.create({
          data: {
            attemptId: attempt.id,
            questionId: questionId,
            answer,
            submittedAt: new Date(),
          },
        });

        return res.json({
          success: true,
          message: "Answer submitted successfully",
          submission,
          attemptId: attempt.id // Return the attempt ID with the response
        });
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error submitting answer",
      });
    } finally {
      await prisma.$disconnect();
    }
  },

  async finishTestAttempt(req, res, next) {
    try {
       const { testId, attemptId } = req.body;
       
       console.log("Finishing test attempt for:", { 
         testId, 
         attemptId,
         userId: req.user.id,
         timestamp: new Date().toISOString()
       });
       
       // First, check if the test exists
       const test = await prisma.test.findUnique({
         where: { id: testId }
       });
       
       if (!test) {
         console.log(`Test with ID ${testId} not found`);
         return res.status(404).json({ 
           success: false,
           message: "Test not found" 
         });
       }
       
       // If attemptId is provided, try to find that specific attempt
       let attempt;
       
       if (attemptId) {
         console.log(`Looking for specific attempt ID: ${attemptId}`);
         attempt = await prisma.testAttempt.findUnique({
           where: {
             id: attemptId,
             testId: testId,
             userId: req.user.id,
           },
           include: {
             test: {
               include: {
                 questions: true,
               },
             },
             submissions: true,
           },
         });
         
         if (!attempt) {
           console.log(`Attempt with ID ${attemptId} not found`);
         } else {
           console.log(`Found attempt ${attemptId}, completedAt:`, attempt.completedAt);
           
           // If already completed, just return success
           if (attempt.completedAt) {
             return res.json({
               success: true,
               message: "Test already completed",
               attempt,
             });
           }
         }
       }
       
       // If specific attempt wasn't found or wasn't provided, look for any in-progress attempt
       if (!attempt) {
         console.log("Looking for any in-progress attempt");
         attempt = await prisma.testAttempt.findFirst({
           where: {
             testId: testId,
             userId: req.user.id,
             completedAt: null, // This means the test is still in progress
           },
           include: {
             test: {
               include: {
                 questions: true,
               },
             },
             submissions: true,
           },
         });
       }

      if (!attempt) {
        // Check if there's a completed attempt already
        const completedAttempt = await prisma.testAttempt.findFirst({
          where: {
            testId: testId,
            userId: req.user.id,
            completedAt: { not: null }
          }
        });
        
        if (completedAttempt) {
          console.log(`Test already completed at ${completedAttempt.completedAt}`);
          return res.status(200).json({ 
            success: true,
            message: "Test already completed",
            attempt: completedAttempt
          });
        }
        
        console.log("No in-progress test attempt found");
        return res.status(404).json({ 
          success: false,
          message: "Test attempt not found or already completed" 
        });
      }
      
      console.log(`Found test attempt: ${attempt.id}, marking as completed`);
    
      const updatedAttempt = await prisma.testAttempt.update({
        where: { id: attempt.id },
        data: {
          completedAt: new Date(),
        },
      });

      console.log(`Successfully marked attempt ${updatedAttempt.id} as completed`);

      return res.json({
        success: true,
        message: "Test attempt completed successfully",
        attempt: updatedAttempt,
      });
    } catch (error) {
      console.error("Error finishing test attempt:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error finishing test attempt",
      });
    } finally {
      await prisma.$disconnect();
    }
  },
  // alows to get mentor all the test he/she has created til yet
  async getAllTestsCreatedByUser(req, res, next) {
    try {
      const userId = req.user?.id;
      
      console.log("getAllTestsCreatedByUser called with:", {
        userId,
        userRole: req.user?.role,
        userObject: req.user,
        headers: req.headers
      });

      if (!userId || !req.user) {
        console.log("Missing user or userId in request");
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // Verify user is a mentor
      if (req.user.role !== 'mentor') {
        console.log("Non-mentor user attempted to access mentor tests:", req.user.role);
        return res.status(403).json({
          success: false,
          message: "Access denied. Only mentors can access this endpoint."
        });
      }

      // Log the query we're about to make
      console.log("Attempting Prisma query with:", {
        mentorId: userId,
        queryType: "findMany",
        model: "test"
      });

      // First get all test IDs for this mentor
      const testIds = await prisma.test.findMany({
        where: {
          mentorId: userId
        },
        select: {
          id: true
        }
      });

      console.log(`Found ${testIds.length} test IDs for mentor ${userId}`);

      // Then fetch full details for each test individually to handle null relations
      const tests = await Promise.all(
        testIds.map(async ({ id }) => {
          try {
            return await prisma.test.findUnique({
              where: { id },
              include: {
                class: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                subject: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                questions: {
                  select: {
                    id: true,
                    question: true
                  }
                },
                _count: {
                  select: {
                    questions: true,
                    attempts: true
                  }
                }
              }
            }).then(test => {
              if (!test) return null;
              
              // Handle potentially null subject
              const subject = test.subject || {
                id: "",
                name: "Unknown Subject"
              };
              
              return {
                ...test,
                subject
              };
            }).catch(err => {
              console.warn(`Error fetching test ${id}:`, err);
              return null;
            });
          } catch (err) {
            console.warn(`Error fetching test ${id}:`, err);
            return null;
          }
        })
      );

      // Filter out any null results and transform the data
      const validTests = tests
        .filter(test => test !== null)
        .map(test => ({
          id: test.id || "",
          title: test.title || "Untitled Test",
          description: test.description || "",
          createdAt: test.createdAt || new Date(),
          class: test.class ? {
            id: test.class.id || "",
            name: test.class.name || "Unknown Class"
          } : { id: "", name: "Unknown Class" },
          subject: test.subject ? {
            id: test.subject.id || "",
            name: test.subject.name || "Unknown Subject"
          } : { id: "", name: "Unknown Subject" },
          submissionCount: test._count?.attempts || 0,
          questionCount: test._count?.questions || 0,
          questions: (test.questions || []).map(q => ({
            id: q.id || "",
            question: q.question || ""
          }))
        }));

      console.log(`Successfully processed ${validTests.length} valid tests`);

      return res.status(200).json({
        success: true,
        message: validTests
      });

    } catch (error) {
      console.error("Error in getAllTestsCreatedByUser:", {
        error: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta
      });

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: "Database constraint violation",
          error: error.meta?.target?.join(', ')
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "Record not found",
          error: error.meta?.cause
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to fetch tests: " + error.message
      });
    } finally {
      await prisma.$disconnect();
    }
  },

  async deleteTest(req, res, next) {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: "Test ID is required." });
      }

      const test = await prisma.test.findUnique({
        where: {
          id,
        },
      });

      if (!test) {
        return res.status(404).json({ message: "Test not found." });
      }

      if (req.user.role !== "mentor") {
        return res.status(403).json({
          message: "Access denied. You must be a mentor to delete a test.",
        });
      }

      if (test.mentorId !== req.user.id) {
        return res.status(403).json({
          message:
            "Access denied. You must be the creator of the test to delete it.",
        });
      }

      await prisma.test.delete({
        where: {
          id,
        },
      });

      res.json(customResponse(200, "Test deleted successfully"));
    } catch (err) {
      res.json(customResponse(400, err));
      console.error(err);
    }
  },
  async getUserTestByClass(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!req.user.classname) {
        return res.status(400).json({
          success: false,
          message: "User does not have a classname assigned",
        });
      }

      // Normalize and log the student's class name
      const studentClassname = req.user.classname.trim();
      console.log("Student requesting tests:", {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        classname: studentClassname
      });
      
      // Find the class ID for the user's class - case insensitive
      let userClass = await prisma.class.findFirst({
        where: {
          name: {
            equals: studentClassname,
            mode: 'insensitive'
          }
        },
      });
      
      console.log("Found class for student (exact match):", userClass);
      
      // If exact match not found, try a contains match
      if (!userClass) {
        userClass = await prisma.class.findFirst({
          where: {
            name: {
              contains: studentClassname,
              mode: 'insensitive'
            }
          },
        });
        console.log("Found class for student (contains match):", userClass);
      }
      
      // If still not found, create the class
      if (!userClass) {
        console.log("Class not found, creating:", studentClassname);
        userClass = await prisma.class.create({
          data: {
            name: studentClassname,
          },
        });
        console.log("Created new class:", userClass);
      }
      
      // Get all tests for the user's class
      const tests = await prisma.test.findMany({
        where: {
          classId: userClass.id,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          questions: {
            select: {
              id: true,
              question: true
            }
          },
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`Found ${tests.length} tests for class ${userClass.name}`);
      
      // Get the user's test attempts to show completion status
      const userAttempts = await prisma.testAttempt.findMany({
        where: {
          userId: req.user.id,
        },
        select: {
          id: true,
          testId: true,
          completedAt: true,
          score: true
        }
      });
      
      // Format tests with attempt information
      const formattedTests = tests.map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        createdAt: test.createdAt,
        subject: test.subject,
        class: test.class,
        owner: test.owner,
        questionCount: test._count.questions,
        submissionCount: test._count.attempts,
        attempts: userAttempts.filter(a => a.testId === test.id).length > 0,
        completed: userAttempts.some(a => a.testId === test.id && a.completedAt !== null),
        score: userAttempts.find(a => a.testId === test.id)?.score
      }));

      return res.json({
        success: true,
        message: formattedTests,
        classInfo: {
          id: userClass.id,
          name: userClass.name
        }
      });
    } catch (err) {
      console.error("Error in getUserTestByClass:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An error occurred",
        error: err.stack
      });
    } finally {
      await prisma.$disconnect();
    }
  },
};

export default testController;
