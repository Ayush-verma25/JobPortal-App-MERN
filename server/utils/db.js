import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Enhanced connection options
    const options = {
      // Timeout configurations
      serverSelectionTimeoutMS: 30000, // 30 seconds to select a server
      socketTimeoutMS: 45000, // 45 seconds for socket timeout
      connectTimeoutMS: 30000, // 30 seconds for initial connection
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering for this connection
      
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 5, // Minimum number of connections
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Heartbeat settings
      heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
      
      // Other important options
      directConnection: false, // Let MongoDB driver handle connection routing
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    };

    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log("Attempting to connect to MongoDB...");
    
    // Connect with enhanced options
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log("MongoDB connected successfully");
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    
    // Retry connection after delay
    console.log("Retrying connection in 5 seconds...");
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

export default connectDB;
