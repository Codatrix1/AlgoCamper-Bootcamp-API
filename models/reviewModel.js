const mongoose = require("mongoose");

//--------------------
// Defining a Schema
//--------------------
const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review"],
    maxlength: 100,
  },

  text: {
    type: String,
    required: [true, "Please add some text"],
  },

  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1 and 10"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Parent Referencing: NOT written as an Array like Child Ref, but as an Object itself like other fields in Schema
  // Bootcamp Model is the Parent here: Review Model is the Child
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },

  // Parent Referencing: NOT written as an Array like Child Ref, but as an Object itself like other fields in Schema
  // User Model is the Parent here: Review Model is the Child
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

//--------------------------------------------------------------------------------------------
// Compound Indexing: Making sure that a single "user" can add "only one review per bootcamp"
//--------------------------------------------------------------------------------------------
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

//-------------------------------------------------------------------------------------------------------
// Adding an Aggregation Pipeline || to Calculate Average Rating: Business Logic and Persist to Database
// Statics are called on the Model itself Vs Instance methods are called on the current document being queried
//-------------------------------------------------------------------------------------------------------
// Static method to get the average of rating
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  // console.log("Calculating average rating...".blue);

  // define the various stages of aggregation pipeline: here "this" points to the Model
  const statsObject = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  // console.log(statsObject);

  // Save to the DB
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: statsObject[0].averageRating,
    });
  } catch (error) {
    console.error(error);
  }
};

// Call the Above created static method after the getAverageRating has been saved to the Database
ReviewSchema.post("save", function () {
  // "this" points to current course that have been saved: "post" middleware does not get access to next()
  // "this.constructor" points to the Model itself
  // bootcampId comes from here when we pass in the bootcamp document using the "this.bootcamp"
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove
ReviewSchema.pre("remove", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

//----------------------------------------------
// Creating a model and exporting it as default
//----------------------------------------------
const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;
