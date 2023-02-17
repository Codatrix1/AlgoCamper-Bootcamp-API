const express = require("express");
const router = express.Router({ mergeParams: true }); // Router w/ ❗ Nested Routing/ Re-Routing

// import controller
const courseController = require("../controllers/courseController");

// import factory function middleware and model
const advancedResults = require("../middlewares/advancedResults");
const Course = require("../models/courseModel");

// auth middleware
const {
  protect,
  authorizePermissions,
} = require("../middlewares/authMiddleware");

// Routes
router
  .route("/")
  .get(
    advancedResults(Course, {
      path: "bootcamp",
      select: "name description",
    }),
    courseController.getAllCourses
  )
  .post(
    [protect, authorizePermissions("admin", "publisher")],
    courseController.addCourse
  );

router
  .route("/:id")
  .get(courseController.getSingleCourse)
  .put(
    [protect, authorizePermissions("admin", "publisher")],
    courseController.updateCourse
  )
  .delete(
    [protect, authorizePermissions("admin", "publisher")],
    courseController.deleteCourse
  );

//---------------
// Export router
//-----------------
module.exports = router;
