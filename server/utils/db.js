import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Set mongoose connection options for better stability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      bufferMaxEntries: 0,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
    };

    // Check if MongoDB URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      console.log('MongoDB connection in progress, waiting...');
      return new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
      });
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB connected successfully');

  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    // Exit process with failure if in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Handle application termination gracefully
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Retry connection with exponential backoff
const connectWithRetry = async (retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB();
      return;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('All connection attempts failed');
        throw error;
      }
      
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
};

export default connectDB;
export { connectWithRetry };
