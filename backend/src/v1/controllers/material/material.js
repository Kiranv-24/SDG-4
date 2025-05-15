import { PrismaClient } from "@prisma/client";
import { customResponse } from "../../../utils/Response";

const prisma = new PrismaClient();

const materialController = {
  async deleteSubject(req, res, next) {
    try {
      const subjectId = req.params.id;
      console.log(subjectId, "subj");

      // Delete the subject
      await prisma.subject.delete({
        where: {
          id: subjectId,
        },
      });

      res.json({ success: true, message: "Subject deleted successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async getmaterials(req, res, next) {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Unauthorized. Please log in." });
      }

      const { classId, subjectId } = req.body;

      if (!classId || !subjectId) {
        return res
          .status(400)
          .json({ message: "both class and subject is required." });
      }

      const materials = await prisma.material.findMany({
        where: {
          classId,
          subjectId,
        },
      });

      if (!materials || materials.length === 0) {
        return res
          .status(404)
          .json({ message: "No materials found for the specified criteria." });
      }

      res.json(customResponse(200, materials));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  async createMaterialsMentor(req, res, next) {
    try {
      const { title, content, classname, subjectname } = req.body;

      let classRecord = await prisma.class.findFirst({
        where: {
          name: classname,
        },
      });

      if (!classRecord) {
        classRecord = await prisma.class.create({
          data: {
            name: classname,
          },
        });
      }

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
            classId: classRecord.id,
            // Add any other subject-related fields here
          },
        });
      }
      let newMaterial = null;

      if (subjectRecord && classRecord) {
        newMaterial = await prisma.material.create({
          data: {
            userId: req.user.id,
            subjectId: subjectRecord.id,
            classId: classRecord.id,
            content: content,
            title: title,
          },
        });
      } else {
        // Handle the case where either subjectRecord or classRecord is not found.
        res.json({
          success: false,
          message: "Subject or class not found",
        });
        return;
      }

      res.json({
        success: true,
        message: newMaterial,
      });

      console.log("Material created:", newMaterial);
    } catch (err) {
      console.error("Error creating material:", err);
      res.json({
        success: false,
        message: err,
      });
    }
  },
  async getMaterialByClass(req, res, next) {
    try {
      const { subjectName } = req.query;
      
      if (!subjectName) {
        return res.json({
          success: false,
          message: "Subject name is required",
        });
      }

      if (!req.user) {
        return res.json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!req.user.classname) {
        return res.json({
          success: false,
          message: "User does not have a classname assigned",
        });
      }

      console.log("User:", req.user.id, "classname:", req.user.classname, "subjectName:", subjectName);
      
      const findclassId = await prisma.class.findFirst({
        where: {
          name: req.user.classname,
        },
      });

      console.log(findclassId, "class ID");
      
      if (!findclassId) {
        // If class not found, create it for this user
        const newClass = await prisma.class.create({
          data: {
            name: req.user.classname,
          }
        });
        
        console.log("Created new class:", newClass);
        
        return res.json({
          success: false,
          message: `Class '${req.user.classname}' was not found in the database. It has been created, but has no subjects yet.`,
        });
      }
      
      // Get the subject ID first
      const subject = await prisma.subject.findFirst({
        where: {
          name: subjectName,
          classId: findclassId.id,
        },
      });

      if (!subject) {
        return res.json({
          success: false,
          message: `Subject '${subjectName}' not found for class '${req.user.classname}'`,
        });
      }

      // Then query materials using the subject ID
      const materials = await prisma.material.findMany({
        where: {
          classId: findclassId.id,
          subjectId: subject.id,
        },
        include: {
          subject: true,
          owner: true,
        },
      });
      
      console.log("Materials found:", materials.length);

      if (materials && materials.length > 0) {
        return res.json({
          success: true,
          message: materials,
        });
      } else {
        return res.json({
          success: false,
          message: `No materials found for subject '${subjectName}' in class '${req.user.classname}'`,
        });
      }
    } catch (err) {
      console.error("Error in getMaterialByClass:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An error occurred",
        error: err.toString()
      });
    }
  },
  async getallSubjects(req, res, next) {
    try {
      if (!req.user) {
        return res.json({
          success: false,
          message: "User not authenticated",
        });
      }

      const classname = req.user.classname;

      if (!classname) {
        return res.json({
          success: false,
          message: "User does not have a classname assigned",
        });
      }

      console.log("Looking for subjects for class:", classname);

      // Find the class ID for the user's class
      let findclassId = await prisma.class.findFirst({
        where: {
          name: classname,
        },
      });

      // If class doesn't exist, create it
      if (!findclassId) {
        console.log("Class not found, creating:", classname);
        findclassId = await prisma.class.create({
          data: {
            name: classname,
          },
        });
        
        // Return with a message but empty subjects array since it's a new class
        return res.json({
          success: true,
          message: [],
          info: `Class '${classname}' was created as it didn't exist before`
        });
      }

      // Find subjects for the class
      const subjects = await prisma.subject.findMany({
        where: {
          classId: findclassId.id,
        },
      });

      console.log(`Found ${subjects.length} subjects for class ${classname}`);

      // If no subjects found, create default subjects for class 11
      if (subjects.length === 0 && classname === "11") {
        console.log("Creating default subjects for class 11");
        
        const defaultSubjects = ["Physics", "Chemistry", "Mathematics", "Biology", "English"];
        const createdSubjects = [];
        
        for (const subjectName of defaultSubjects) {
          const subject = await prisma.subject.create({
            data: {
              name: subjectName,
              classId: findclassId.id,
            },
          });
          createdSubjects.push(subject);
        }
        
        return res.json({
          success: true,
          message: createdSubjects,
          info: "Default subjects were created for Class 11"
        });
      }

      return res.json({
        success: true,
        message: subjects,
      });
    } catch (err) {
      console.error("Error in getallSubjects:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An error occurred",
        error: err.toString()
      });
    }
  },
};

export default materialController;
