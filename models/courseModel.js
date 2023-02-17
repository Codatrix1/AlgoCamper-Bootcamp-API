const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"],
  },

  description: {
    type: String,
    required: [true, "Please add the course description"],
  },

  weeks: {
    type: String,
    required: [true, "Please add the number of weeks"],
  },

  tuition: {
    type: Number,
    required: [true, "Please add the tuition cost"],
  },

  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"],
  },

  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Parent Referencing: NOT written as an Array like Child Ref, but as an Object itself like other fields in Schema
  // Bootcamp Model is the Parent here: Course Model is the Child
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },

  // Parent Referencing: NOT written as an Array like Child Ref, but as an Object itself like other fields in Schema
  // User Model is the Parent here: Course Model is the Child
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

//-------------------------------------------------------------------------------------------------------
// Adding an Aggregation Pipeline || to Calculate Average Cost: Business Logic and Persist to Database
// Statics are called on the Model itself Vs Instance methods are called on the current document being queried
//-------------------------------------------------------------------------------------------------------
// Static method to get the avearge of course tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  // console.log("Calculating average cost...".blue);

  // define the various stages of aggregation pipeline: here "this" points to the Model
  const statsObject = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);

  // console.log(statsObject);

  // Save to the DB
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(statsObject[0].averageCost / 10) * 10,
    });
  } catch (error) {
    console.error(error);
  }
};

// Call the Above created static method after the getAverageCost has been saved to the Database
CourseSchema.post("save", function () {
  // "this" points to current course that have been saved: "post" middleware does not get access to next()
  // "this.constructor" points to the Model itself
  // bootcampId comes from here when we pass in the bootcamp document using the "this.bootcamp"
  this.constructor.getAverageCost(this.bootcamp);
});

// Call getAverageCost before remove
CourseSchema.pre("remove", function () {
  this.constructor.getAverageCost(this.bootcamp);
});

//----------------------------------------------
// Creating a model and exporting it as default
const Course = mongoose.model("Course", CourseSchema);
module.exports = Course;
