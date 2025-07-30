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

// ---------- Register ----------
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({ message: "All fields are required", success: false });
    }

    if (!validateEmail(email)) return res.status(400).json({ message: "Invalid email", success: false });
    if (!validatePhoneNumber(phoneNumber)) return res.status(400).json({ message: "Invalid phone number", success: false });
    if (!validatePassword(password)) return res.status(400).json({
      message: "Password must be at least 8 characters and contain upper, lower, and numeric characters.",
      success: false
    });

    const validRoles = ['student', 'recruiter', 'admin'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role", success: false });

    const sanitizedData = {
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      role: role.trim(),
    };

    const userExists = await User.findOne({
      $or: [{ email: sanitizedData.email }, { phoneNumber: sanitizedData.phoneNumber }]
    });

    if (userExists) return res.status(409).json({ message: "Email or phone already registered", success: false });

    let profilePhotoUrl = null;
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const uploadRes = await cloudinary.uploader.upload(fileUri.content, {
        folder: "profile_photos",
        transformation: [{ width: 500, height: 500, crop: "fill" }, { quality: "auto" }],
      });
      profilePhotoUrl = uploadRes.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      ...sanitizedData,
      password: hashedPassword,
      profile: {
        profilePhoto: profilePhotoUrl,
        bio: "",
        skills: [],
      },
    });

    return res.status(201).json({
      message: "Account created successfully",
      success: true,
      user: sanitizeUser(newUser),
    });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ---------- Login ----------
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required", success: false });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials", success: false });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch || role.trim() !== user.role) {
      return res.status(401).json({ message: "Invalid credentials or role mismatch", success: false });
    }

    if (!process.env.SECRET_KEY) throw new Error("JWT secret missing in environment");

    const token = jwt.sign({
      userId: user._id,
      email: user.email,
      role: user.role,
    }, process.env.SECRET_KEY, {
      expiresIn: "24h",
      issuer: "your-app-name",
      audience: "your-app-users"
    });

    res.cookie("token", token, {
      maxAge: 86400000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });

    return res.status(200).json({
    message: `Welcome back ${user.fullname}`,
    success: true,
    user: sanitizeUser(user),
    token: token  // Add this line
});

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ---------- Logout ----------
export const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    return res.status(200).json({ message: "Logged out successfully", success: true });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ---------- Update Profile ----------
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const userId = req.id; // Assume from verified middleware

    if (!userId) return res.status(401).json({ message: "Not authenticated", success: false });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found", success: false });

    if (email && !validateEmail(email)) return res.status(400).json({ message: "Invalid email", success: false });
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) return res.status(400).json({ message: "Invalid phone number", success: false });

    // Check duplicates
    if (email || phoneNumber) {
      const duplicate = await User.findOne({
        _id: { $ne: userId },
        $or: [
          email ? { email: email.toLowerCase().trim() } : null,
          phoneNumber ? { phoneNumber: phoneNumber.trim() } : null,
        ].filter(Boolean)
      });

      if (duplicate) return res.status(409).json({ message: "Email or phone already used", success: false });
    }

    let resumeUrl = null;
    let resumeOriginalName = null;
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloudRes = await cloudinary.uploader.upload(fileUri.content, {
        folder: "resumes",
        resource_type: "auto"
      });
      resumeUrl = cloudRes.secure_url;
      resumeOriginalName = req.file.originalname;
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

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: sanitizeUser(updatedUser),
      token: token
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
