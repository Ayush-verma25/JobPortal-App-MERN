import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Configure mongoose connection options
    const options = {
      // Connection timeout (30 seconds)
      serverSelectionTimeoutMS: 30000,
      // Socket timeout (0 = no timeout, but we'll set a reasonable limit)
      socketTimeoutMS: 45000,
      // Buffer timeout
      bufferMaxEntries: 0,
      // Max time to wait for connection
      connectTimeoutMS: 30000,
      // Heartbeat frequency
      heartbeatFrequencyMS: 10000,
      // Max pool size
      maxPoolSize: 10,
      // Min pool size
      minPoolSize: 5,
      // Max idle time
      maxIdleTimeMS: 30000,
    };

    // Connect with options
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log("MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    
    // Don't exit the process immediately, allow for retry logic
    // process.exit(1); // Uncomment if you want to exit on connection failure
    
    // Optional: Implement retry logic
    setTimeout(() => {
      console.log('Retrying MongoDB connection...');
      connectDB();
    }, 5000);
  }
};

// Alternative approach with retry mechanism
const connectDBWithRetry = async (maxRetries = 5, retryDelay = 5000) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const options = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        connectTimeout: 30000,
        heartbeatFrequencyMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log("MongoDB connected successfully");
      return; // Exit function on successful connection
      
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error.message);
      
      if (retries >= maxRetries) {
        console.error('Max retries reached. Could not connect to MongoDB');
        process.exit(1);
      }
      
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

export default connectDB;
