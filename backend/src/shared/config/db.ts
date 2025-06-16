// src/config/db.ts
import mongoose from 'mongoose';

let isConnectedBefore = false;

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI as string;

  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    throw new Error('MONGO_URI not found in .env');
  }

  try {
    await mongoose.connect(mongoUri, {
      // Optional tuning
      maxPoolSize: 50, // High performance pool
      serverSelectionTimeoutMS: 30000, // Fail fast if can't connect
    });

    console.log('✅ MongoDB connected');
    isConnectedBefore = true;

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      if (!isConnectedBefore) {
        console.error('❌ Initial MongoDB connection lost');
        throw new Error('MongoDB initial connection lost');
      } else {
        console.warn('⚠️ MongoDB disconnected');
      }
    });
  } catch (error: unknown) {
    console.error('❌ MongoDB initial connection failed');
    console.error(error);
    throw new Error('MongoDB initial connection failed');
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error while closing MongoDB:', error);
  }
};
