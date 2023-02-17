// import core modules
const path = require("path");

// Import and Load env Vars
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

// import and connect to DB
const connectDB = require("./config/connectDB");
connectDB();

// express setup
const express = require("express");
const app = express();

// Rest of the packages
const morgan = require("morgan");
const colors = require("colors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

// imports routers
const bootcampRouter = require("./routes/bootcampRoutes");
const courseRouter = require("./routes/courseRoutes");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

// import middlewares
// const loggerMiddleware = require("./middlewares/logger");
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");

//-------------------
// MIDDLEWARE STACK
//------------------
// Custom Logger middleware
// app.use(loggerMiddleware);

// Set Security HTTP Headers
app.use(helmet());

// Enable CORS: Permission granted
app.use(cors());

// Trust proxy to use in other applications
app.set("trust proxy", 1);

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from the same IP Address:
// a) against DDoS and Brute Force Attacks
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000, // 10 mins
  message: "Too many requests from this IP, please try again after 15 minutes!",
});
app.use(limiter);

// Body parser: limiting data reading from body into req.body
app.use(express.json({ limit: "10kb" }));

// invoke express-fileUpload
app.use(fileUpload());

// Data Sanitization: Cleaning all the data that is coming from some Malacious code
// a) against NoSQL query Injections: MongoDB Operators that return "true" in all queries
app.use(mongoSanitize());
// b) against XSS: Cross-Site Scripting Attacks: Injecting Malacious HTML + JavaScript Code
app.use(xss());

// Prevent HTTP Parameter Pollution: Must be used at the end as it clears up the query string
app.use(hpp());

// to access cookie data from req.cookies
app.use(cookieParser());

// Set Static folder
app.use(express.static(path.join(__dirname, "public")));

//--------------------------
// Mounting the Routers
//--------------------------
app.use("/api/v1/bootcamps", bootcampRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Invoking error handler middlewares
app.use(errorHandlerMiddleware);

//--------------------------
// Setting up the Server
//--------------------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, (req, res) => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}....`.yellow
      .bold
  );
});

//--------------------------------------
// Handling Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 🔥 Shutting Down ");
  console.log(`${err.name}, ${err.message}`.red.bold);
  // Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});
