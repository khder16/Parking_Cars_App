import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

// Configurations
import { connectDB } from "./db/db.js";
import { initializeI18n } from "./config/i18next.js";
import { authRole } from "./middleware/check-role.js";

// Routes
import userRouter from "./routes/user-route.js";
import parkRouter from "./routes/parkings-route.js";
import problemsRouter from "./routes/car-problems-route.js";
import orderRouter from "./routes/orders-route.js";
import manageOrderRouter from "./routes/manage-repair-orders-route.js";
import proRouter from "./routes/pro-subscribe-route.js";
import adminRouter from "./routes/admin-route.js";
import statsRouter from "./routes/statsics-route.js";

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const MONGO_URI = process.env.MONGO_URI;

// Initialize Express and HTTP server
const app = express();
const server = createServer(app);

// ==============================================
// SOCKET.IO CONFIGURATION
// ==============================================
const initializeSocketIO = () => {
  const io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });
  // Track connected users
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    socket.on("auth", async (username) => {
      try {
        if (!username) throw new Error("Username is required");

        connectedUsers.set(username, socket.id);

        const orders = await getParkingOrders(username);
        socket.emit("getall", orders || "No park orders yet");
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      for (const [username, id] of connectedUsers.entries()) {
        if (id === socket.id) {
          connectedUsers.delete(username);

          break;
        }
      }
    });
  });

  return io;
};

// Helper function for parking orders
const getParkingOrders = async (username) => {
  try {
    const admin = await Admin.findOne({ username }).select("_id");
    if (!admin) throw new Error("Admin not found");

    const orders = await ParkingOrder.find({})
      .populate("SelectedPark", "location.parkingName Admin")
      .populate("userId", "email firstName lastName bookedPark.bookingEndTime")
      .lean()
      .sort({ "userId.bookedPark.bookingEndTime": -1 });

    if (!orders.length) return null;

    return orders
      .map((order) => {
        if (order.userId?.bookedPark?.bookingEndTime) {
          order.orderFinishDate = order.userId.bookedPark.bookingEndTime;
        }
        return order;
      })
      .filter(
        (order) =>
          order.SelectedPark?.Admin?.toString() === admin._id.toString()
      )
      .map(({ userId, ...rest }) => ({ ...rest, user: userId }));
  } catch (error) {
    throw error;
  }
};

// ==============================================
// EXPRESS MIDDLEWARE CONFIGURATION
// ==============================================
const configureMiddleware = async () => {
  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    })
  );

  // Request processing
  app.use(morgan(NODE_ENV === "development" ? "dev" : "combined"));
  app.use(express.json());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: "Too many requests from this IP, please try again later",
    })
  );

  // Internationalization
  // const { i18next, i18nextMiddleware } = await initializeI18n();
  // / Initialize i18n
  const { middleware: i18nMiddleware } = await initializeI18n();

  // Use the middleware
  app.use(i18nMiddleware);

  app.use((req, res, next) => {
    console.log("Detected language:", req.language);
    console.log("Cookies:", req.cookies);
    console.log("Headers:", req.headers);
    next();
  });

  // Static files
  app.use(
    express.static("./public", {
      maxAge: "1d",
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      },
    })
  );
};

// ==============================================
// ROUTE CONFIGURATION
// ==============================================
const configureRoutes = () => {
  // API routes
  app.use("/api/user", userRouter);
  app.use("/api/parking", parkRouter);
  app.use("/api/problem", problemsRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/admin", authRole, manageOrderRouter);
  app.use("/api/pro", proRouter);
  app.use("/api/admins", adminRouter);
  app.use("/api/stats", statsRouter);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy" });
  });
};

// ==============================================
// SERVER MANAGEMENT
// ==============================================
const gracefulShutdown = () => {
  server.close(async () => {
    try {
      await mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000);
};

// ==============================================
// SERVER INITIALIZATION
// ==============================================
const startServer = async () => {
  try {
    // Initialize everything
    await configureMiddleware();
    configureRoutes();
    initializeSocketIO();

    // Connect to database
    await connectDB(MONGO_URI);

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server is Listen to ${PORT}...`);
    });

    // Handle shutdown signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    process.exit(1);
  }
};

// Start the application
startServer();
export const io = initializeSocketIO();
