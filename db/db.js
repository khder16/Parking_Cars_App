import pkg from "mongoose";
const { connect, connection, disconnect } = pkg;
// Connection configuration with pooling
const DEFAULT_POOL_SIZE = 10;
export const connectDB = async (url) => {
  try {
    await connect(url, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: DEFAULT_POOL_SIZE,
      minPoolSize: 2, // Maintain at least 2 connections in the pool
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip IPv6
    });

    connection.on("connected", () => {
      console.log(`MongoDB connected with pool size: ${DEFAULT_POOL_SIZE}`);
    });

    connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    // Close the connection when Node process ends
    process.on("SIGINT", async () => {
      await disconnect();
      process.exit(0);
    });
  } catch (err) {
    console.error("MongoDB initial connection error:", err);
    throw err;
  }
};
