// middleware/isAuthenticated.js
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

        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if (!decode) {
            return res.status(401).json({
                message: "Invalid token",
                success: false
            });
        }

        const user = await User.findById(decode.userId);
        if (!user) {
            return res.status(401).json({
                message: "User not found",
                success: false
            });
        }

        req.id = decode.userId;
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        });
    }
}

export default isAuthenticated;
