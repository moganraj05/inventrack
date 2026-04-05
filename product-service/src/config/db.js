import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Product DB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Product DB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
