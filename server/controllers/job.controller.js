import { Job } from "../models/job.model.js";
import mongoose from "mongoose";

// Admin posts a job
export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      experience,
      position,
      companyId,
    } = req.body;
    const userId = req.id;

    // Validate required fields with type checking
    if (
      !title ||
      !description ||
      !requirements ||
      !salary ||
      !location ||
      !jobType ||
      !experience ||
      !position ||
      !companyId
    ) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }

    // Validate that string fields are actually strings
    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof location !== "string" ||
      typeof position !== "string"
    ) {
      return res.status(400).json({
        message: "Title, description, location, and position must be strings.",
        success: false,
      });
    }

    // Validate companyId format
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID format.",
        success: false,
      });
    }

    // Validate salary is a positive number
    const salaryNum = Number(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      return res.status(400).json({
        message: "Salary must be a positive number.",
        success: false,
      });
    }

    // Process requirements - handle both string and array inputs
    let processedRequirements;
    if (typeof requirements === "string") {
      processedRequirements = requirements
        .split(",")
        .map((req) => req.trim())
        .filter((req) => req.length > 0);
    } else if (Array.isArray(requirements)) {
      processedRequirements = requirements
        .map((req) => String(req).trim())
        .filter((req) => req.length > 0);
    } else {
      return res.status(400).json({
        message: "Requirements must be a string or array.",
        success: false,
      });
    }

    // Create job with proper data types and safe string operations
    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      requirements: processedRequirements,
      salary: salaryNum,
      location: location.trim(),
      jobType,
      experienceLevel: experience,
      position: position.trim(), // Now safe because we validated it's a string
      company: companyId,
      created_by: userId,
    });

    return res.status(201).json({
      message: "New job created successfully.",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error in postJob:", error);
    return res.status(500).json({
      message: "Internal server error while creating job.",
      success: false,
    });
  }
};

// Get all jobs for students with filtering and pagination
export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};
    if (keyword.trim()) {
      query.$or = [
        { title: { $regex: keyword.trim(), $options: "i" } },
        { description: { $regex: keyword.trim(), $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(query);

    // Get jobs with pagination
    const jobs = await Job.find(query)
      .populate({
        path: "company",
        select: "name location logo", // Only select necessary fields
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    return res.status(200).json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
        hasNext: page < Math.ceil(totalJobs / limit),
        hasPrev: page > 1,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in getAllJobs:", error);
    return res.status(500).json({
      message: "Internal server error while fetching jobs.",
      success: false,
    });
  }
};

// Get job by ID for students
export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID format.",
        success: false,
      });
    }

    const job = await Job.findById(jobId)
      .populate({
        path: "company",
        select: "name location logo description website",
      })
      .populate({
        path: "applications",
        select: "status applicant createdAt",
        populate: {
          path: "applicant",
          select: "fullname email profile.profilePhoto",
        },
      });

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }

    return res.status(200).json({
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error in getJobById:", error);
    return res.status(500).json({
      message: "Internal server error while fetching job.",
      success: false,
    });
  }
};

// Get all jobs created by admin
export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const totalJobs = await Job.countDocuments({ created_by: adminId });

    const jobs = await Job.find({ created_by: adminId })
      .populate({
        path: "company",
        select: "name location logo",
      })
      .populate({
        path: "applications",
        select: "status",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add application count to each job
    const jobsWithStats = jobs.map((job) => ({
      ...job,
      applicationCount: job.applications ? job.applications.length : 0,
      applications: undefined, // Remove applications array from response for performance
    }));

    return res.status(200).json({
      jobs: jobsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
        hasNext: page < Math.ceil(totalJobs / limit),
        hasPrev: page > 1,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error in getAdminJobs:", error);
    return res.status(500).json({
      message: "Internal server error while fetching admin jobs.",
      success: false,
    });
  }
};
