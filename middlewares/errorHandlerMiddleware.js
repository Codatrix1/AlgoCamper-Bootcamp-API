const ErrorResponseAPI = require("../utils/errorResponseAPI");

const errorHandlerMiddleware = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log to console for dev
  console.log(err);
  // console.log(err.stack.red);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    // const message = `No resource found with the ID : ${err.value}`;
    const message = `Resource not found`;
    error = new ErrorResponseAPI(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    error = new ErrorResponseAPI(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ErrorResponseAPI(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandlerMiddleware;
