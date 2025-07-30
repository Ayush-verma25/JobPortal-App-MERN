import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// ---------- Validation Utilities ----------
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhoneNumber = (phoneNumber) => /^\+?[\d\s\-()]{10,}$/.test(phoneNumber);
const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w@$!%*?&]{8,}$/.test(password);

// ---------- Response Sanitization ----------
const sanitizeUser = (user) => ({
  _id: user._id,
  fullname: user.fullname,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  profile: user.profile,
});

// ---------- Database Connection Check ----------
const checkDatabaseConnection = async () => {
  try {
    // Simple database ping to check connection
    await User.findOne().limit(1);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
};

// ---------- Register ----------
export const register = async (req, res) => {
  try {
    // Check database connection first
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({ 
        message: "Database connection unavailable. Please try again later.", 
        success: false 
      });
    }

    const { fullname, email, phoneNumber, password, role } = req?.body || {};

    // Enhanced validation with better error messages
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({ 
        message: "All fields are required (fullname, email, phoneNumber, password, role)", 
        success: false 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        message: "Invalid email format", 
        success: false 
      });
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        message: "Invalid phone number format", 
        success: false 
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and contain uppercase, lowercase, and numeric characters.",
        success: false
      });
    }

    const validRoles = ['student', 'recruiter', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Must be one of: student, recruiter, admin", 
        success: false 
      });
    }

    const sanitizedData = {
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      role: role.trim(),
    };

    // Add timeout to database queries
    const userExists = await Promise.race([
      User.findOne({
        $or: [{ email: sanitizedData.email }, { phoneNumber: sanitizedData.phoneNumber }]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);

    if (userExists) {
      return res.status(409).json({ 
        message: "Email or phone number already registered", 
        success: false 
      });
    }

    let profilePhotoUrl = null;
    
    // Enhanced Cloudinary error handling
    if (req.file) {
      try {
        // Check if cloudinary is configured
        if (!cloudinary?.config()?.cloud_name) {
          console.error("Cloudinary not properly configured");
          return res.status(500).json({ 
            message: "File upload service unavailable", 
            success: false 
          });
        }

        const fileUri = getDataUri(req.file);
        
        // Add timeout to cloudinary upload
        const uploadRes = await Promise.race([
          cloudinary.uploader.upload(fileUri.content, {
            folder: "profile_photos",
            transformation: [
              { width: 500, height: 500, crop: "fill" }, 
              { quality: "auto" }
            ],
            timeout: 30000, // 30 second timeout
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cloudinary upload timeout')), 35000)
          )
        ]);
        
        profilePhotoUrl = uploadRes.secure_url;
        
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Continue without profile photo instead of failing entire registration
        console.warn("Profile photo upload failed, continuing registration without photo");
      }
    }

    // Enhanced password hashing with error handling
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return res.status(500).json({ 
        message: "Password processing failed", 
        success: false 
      });
    }

    // Create user with timeout
    const newUser = await Promise.race([
      User.create({
        ...sanitizedData,
        password: hashedPassword,
        profile: {
          profilePhoto: profilePhotoUrl,
          bio: "",
          skills: [],
        },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User creation timeout')), 10000)
      )
    ]);

    return res.status(201).json({
      message: "Account created successfully",
      success: true,
      user: sanitizeUser(newUser),
    });

  } catch (err) {
    console.error("Register Error:", err);
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid data provided", 
        success: false,
        details: err.message 
      });
    }
    
    if (err.message.includes('timeout')) {
      return res.status(408).json({ 
        message: "Request timeout. Please try again.", 
        success: false 
      });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "Email or phone number already exists", 
        success: false 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error", 
      success: false 
    });
  }
};

// ---------- Login ----------
export const login = async (req, res) => {
  try {
    // Check database connection first
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({ 
        message: "Database connection unavailable. Please try again later.", 
        success: false 
      });
    }

    const { email, password, role } = req?.body || {};

    if (!email || !password || !role) {
      return res.status(400).json({ 
        message: "Email, password, and role are required", 
        success: false 
      });
    }

    // Validate JWT secret early
    if (!process.env.SECRET_KEY) {
      console.error("JWT SECRET_KEY missing in environment variables");
      return res.status(500).json({ 
        message: "Authentication service unavailable", 
        success: false 
      });
    }

    // Add timeout to user query
    const user = await Promise.race([
      User.findOne({ email: email.toLowerCase().trim() }).select("+password"),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);

    if (!user) {
      return res.status(401).json({ 
        message: "Invalid credentials", 
        success: false 
      });
    }

    // Enhanced password comparison with error handling
    let passwordMatch;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (compareError) {
      console.error("Password comparison error:", compareError);
      return res.status(500).json({ 
        message: "Authentication processing failed", 
        success: false 
      });
    }

    if (!passwordMatch || role.trim() !== user.role) {
      return res.status(401).json({ 
        message: "Invalid credentials or role mismatch", 
        success: false 
      });
    }

    // Enhanced JWT token creation with error handling
    let token;
    try {
      token = jwt.sign({
        userId: user._id,
        email: user.email,
        role: user.role,
      }, process.env.SECRET_KEY, {
        expiresIn: "24h",
        issuer: "your-app-name",
        audience: "your-app-users"
      });
    } catch (tokenError) {
      console.error("JWT token creation error:", tokenError);
      return res.status(500).json({ 
        message: "Authentication token creation failed", 
        success: false 
      });
    }

    // Enhanced cookie setting
    try {
      res.cookie("token", token, {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Important for cross-origin
        path: "/"
      });
    } catch (cookieError) {
      console.error("Cookie setting error:", cookieError);
      // Continue without setting cookie, return token in response
    }

    return res.status(200).json({
      message: `Welcome back ${user.fullname}`,
      success: true,
      user: sanitizeUser(user),
      token: token
    });

  } catch (err) {
    console.error("Login Error:", err);
    
    if (err.message.includes('timeout')) {
      return res.status(408).json({ 
        message: "Request timeout. Please try again.", 
        success: false 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error", 
      success: false 
    });
  }
};

// ---------- Logout ----------
export const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/"
    });
    
    return res.status(200).json({ 
      message: "Logged out successfully", 
      success: true 
    });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ 
      message: "Logout failed", 
      success: false 
    });
  }
};

// ---------- Update Profile ----------
export const updateProfile = async (req, res) => {
  try {
    // Check database connection first
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({ 
        message: "Database connection unavailable. Please try again later.", 
        success: false 
      });
    }

    const { fullname, email, phoneNumber, bio, skills } = req?.body || {};
    const userId = req.id; // Assume from verified middleware

    if (!userId) {
      return res.status(401).json({ 
        message: "Not authenticated", 
        success: false 
      });
    }

    // Add timeout to user query
    const user = await Promise.race([
      User.findById(userId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);

    if (!user) {
      return res.status(404).json({ 
        message: "User not found", 
        success: false 
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ 
        message: "Invalid email format", 
        success: false 
      });
    }
    
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        message: "Invalid phone number format", 
        success: false 
      });
    }

    // Check duplicates with timeout
    if (email || phoneNumber) {
      const duplicate = await Promise.race([
        User.findOne({
          _id: { $ne: userId },
          $or: [
            email ? { email: email.toLowerCase().trim() } : null,
            phoneNumber ? { phoneNumber: phoneNumber.trim() } : null,
          ].filter(Boolean)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ]);

      if (duplicate) {
        return res.status(409).json({ 
          message: "Email or phone number already in use", 
          success: false 
        });
      }
    }

    let resumeUrl = null;
    let resumeOriginalName = null;
    
    // Enhanced file upload handling
    if (req.file) {
      try {
        // Check if cloudinary is configured
        if (!cloudinary?.config()?.cloud_name) {
          console.error("Cloudinary not properly configured");
          return res.status(500).json({ 
            message: "File upload service unavailable", 
            success: false 
          });
        }

        const fileUri = getDataUri(req.file);
        
        // Add timeout to cloudinary upload
        const cloudRes = await Promise.race([
          cloudinary.uploader.upload(fileUri.content, {
            folder: "resumes",
            resource_type: "auto",
            timeout: 30000,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cloudinary upload timeout')), 35000)
          )
        ]);
        
        resumeUrl = cloudRes.secure_url;
        resumeOriginalName = req.file.originalname;
        
      } catch (uploadError) {
        console.error("Resume upload error:", uploadError);
        return res.status(500).json({ 
          message: "File upload failed", 
          success: false 
        });
      }
    }

    const updatedSkills = skills
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : user.profile.skills;

    const updateFields = {
      ...(fullname && { fullname: fullname.trim() }),
      ...(email && { email: email.toLowerCase().trim() }),
      ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
      ...(bio !== undefined && { "profile.bio": bio.trim() }),
      ...(skills !== undefined && { "profile.skills": updatedSkills }),
      ...(resumeUrl && {
        "profile.resume": resumeUrl,
        "profile.resumeOriginalName": resumeOriginalName
      })
    };

    // Add timeout to update query
    const updatedUser = await Promise.race([
      User.findByIdAndUpdate(userId, updateFields, {
        new: true,
        runValidators: true
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database update timeout')), 10000)
      )
    ]);

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: sanitizeUser(updatedUser),
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    
    if (err.message.includes('timeout')) {
      return res.status(408).json({ 
        message: "Request timeout. Please try again.", 
        success: false 
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid data provided", 
        success: false 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error", 
      success: false 
    });
  }
};
