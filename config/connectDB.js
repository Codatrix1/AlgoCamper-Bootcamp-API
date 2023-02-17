const mongoose = require("mongoose");

const connectDB = async () => {
  // For getting rid of Deprecaation warnings in Mongoose V5 or previous versions
  // const conn = await mongoose.connect(process.env.MONGO_URI, {
  //   useNewUrlParser: true,
  //   useCreateIndex: true,
  //   useFindAndModify: false,
  //   useUnifiedTopology: true,
  // });

  // For Mongoose V6: Latest as of today
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
};

module.exports = connectDB;
