const Review = require("../models/reviewModel");
const Bootcamp = require("../models/bootcampModel");
const ErrorResponseAPI = require("../utils/errorResponseAPI");
const asyncHandler = require("../middlewares/asyncHandler");

//----------------------------------------------------------------------
// @desc     Get all reviews
// @route    GET /api/v1/reviews
// @route    GET /api/v1/bootcamps/:bootcampId/reviews
// @access   Public
const getAllReviews = asyncHandler(async (req, res, next) => {
  // check for params
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    // Response For getting all the reviews in a single bootcamp
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    // For getiing filtered response coming from the advancedResults middleware
    res.status(200).json(res.advancedResults);
  }
});

//----------------------------------------------------------------------
// @desc     Get Single Review
// @route    GET /api/v1/reviews/:id
// @access   Public
const getSingleReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  // check for review in the DB
  if (!review) {
    return next(
      new ErrorResponseAPI(
        `No review found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Send Response
  res.status(200).json({ success: true, data: review });
});

//----------------------------------------------------------------------
// @desc     Create Review
// @route    POST /api/v1/bootcamp/:bootcampId/reviews
// @access   Private
const createReview = asyncHandler(async (req, res, next) => {
  // Re-Assign the following by getting the values from req.body
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  // Find the bootcamp by id
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  // check for the same in the DB
  if (!bootcamp) {
    return next(
      new ErrorResponseAPI(
        `No bootcamp found with the ID of ${req.params.bootcampId}`,
        404
      )
    );
  }

  // if it does exist, create a new review
  const review = await Review.create(req.body);

  // Send Response
  res.status(201).json({ success: true, data: review });
});

//----------------------------------------------------------------------
// @desc     Update Review
// @route    PUT /api/v1/reviews/:id
// @access   Private
const updateReview = asyncHandler(async (req, res, next) => {
  // Find the review by id
  let review = await Review.findById(req.params.id);

  // check for the same in the DB
  if (!review) {
    return next(
      new ErrorResponseAPI(
        `Review not found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Make sure that the review belongs to "user" or "user" is an "admin"

  // Check Permissions

  // Business Logic 1: Make sure that the Only the user who has posted the review can update the review
  // No other user or publisher can edit that review
  // Business Logic 2: Also: "admin" can update whatever He/She wants to update: Admin has all the Rights
  // If the "user" is the owner and also NOT AN ADMIN, he can update the review
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to update this review`,
        401
      )
    );
  }

  // If all checks out, go ahead and update
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Response
  res.status(200).json({ success: true, data: review });
});

//----------------------------------------------------------------------
// @desc     Delete Review
// @route    DELETE /api/v1/reviews/:id
// @access   Private
const deleteReview = asyncHandler(async (req, res, next) => {
  // Find the review by id
  const review = await Review.findById(req.params.id);

  // check for the same in the DB
  if (!review) {
    return next(
      new ErrorResponseAPI(
        `Review not found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Make sure that the review belongs to "user" or "user" is an "admin"

  // Check Permissions

  // Business Logic 1: Make sure that the Only the user who has posted the review can delete the review
  // No other user or publisher can delete that review
  // Business Logic 2: Also: "admin" can update whatever He/She wants to delete: Admin has all the Rights
  // If the "user" is the owner and also NOT AN ADMIN, he can delete the review
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to delete this review`,
        401
      )
    );
  }

  // If all checks out, go ahead and delete the review
  await review.remove();

  // Response
  res.status(200).json({ success: true, data: {} });
});

//---------
// Exports
//---------
module.exports = {
  getAllReviews,
  getSingleReview,
  createReview,
  updateReview,
  deleteReview,
};
