const express = require("express");
const router = express.Router({ mergeParams: true }); // Router w/ ❗ Nested Routing/ Re-Routing

// import controller
const reviewController = require("../controllers/reviewController");

// import factory function middleware and model
const advancedResults = require("../middlewares/advancedResults");
const Review = require("../models/reviewModel");

// auth middleware
const {
  protect,
  authorizePermissions,
} = require("../middlewares/authMiddleware");

// Routes
router
  .route("/")
  .get(
    advancedResults(Review, {
      path: "bootcamp",
      select: "name description",
    }),
    reviewController.getAllReviews
  )
  .post(
    [protect, authorizePermissions("admin", "user")],
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getSingleReview)
  .put(
    [protect, authorizePermissions("admin", "user")],
    reviewController.updateReview
  )
  .delete(
    [protect, authorizePermissions("admin", "user")],
    reviewController.deleteReview
  );

//---------------
// Export router
//-----------------
module.exports = router;
