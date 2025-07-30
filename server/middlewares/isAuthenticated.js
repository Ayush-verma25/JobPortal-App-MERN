import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const isAuthenticated = async (req, res, next) => {
    try {
        let token;
        
        // Try to get token from cookies first
        token = req.cookies.token;
        
        // If no token in cookies, try Authorization header
        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                message: "Authentication required. Please log in again.",
                success: false
            });
        }

        // Add proper error handling for JWT verification
        let decode;
        try {
            decode = jwt.verify(token, process.env.SECRET_KEY);
        } catch (jwtError) {
            console.log('JWT verification error:', jwtError.message);
            
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Token has expired. Please log in again.",
                    success: false
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: "Invalid token format.",
                    success: false
                });
            } else {
                return res.status(401).json({
                    message: "Token verification failed.",
                    success: false
                });
            }
        }

        if (!decode || !decode.userId) {
            return res.status(401).json({
                message: "Invalid token payload",
                success: false
            });
        }

        // Check if user exists in database
        const user = await User.findById(decode.userId);
        if (!user) {
            return res.status(401).json({
                message: "User not found. Please log in again.",
                success: false
            });
        }

        // Attach user info to request object
        req.id = decode.userId;
        req.user = user;
        
        next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            message: "Internal server error during authentication",
            success: false
        });
    }
}

export default isAuthenticated;
