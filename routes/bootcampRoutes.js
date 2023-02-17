// express and router invoking
const express = require("express");

// Include other resource routers: to achieve ❗ NESTED Routing/RE-ROUTING
const courseRouter = require("./courseRoutes");
const reviewRouter = require("./reviewRoutes");

// Invoke the main router
const router = express.Router();

// import controller
const bootcampController = require("../controllers/bootcampController");

// import factory function middleware and model
const advancedResults = require("../middlewares/advancedResults");
const Bootcamp = require("../models/bootcampModel");

// auth middleware
const {
  protect,
  authorizePermissions,
} = require("../middlewares/authMiddleware");

//-----------------------------------------------------------
// ❗ NESTED Routing OR RE-ROUTE into other resource routers
//----------------------------------------------------------
router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewRouter);

//---------------------------------------------------------------------
// Dedicated Route for GeoSpatial Query: Get Bootcamps within a radius
//---------------------------------------------------------------------
router
  .route("/radius/:zipcode/:distance")
  .get(bootcampController.getBootcampsInRadius);

//---------------------------------------------------
// Dedicated Route for Uploading Image for a Bootcamp
//---------------------------------------------------
router
  .route("/:id/image")
  .put(
    [protect, authorizePermissions("admin", "publisher")],
    bootcampController.uploadImage
  );

//-------------------
// Rest Of the Routes
//-------------------
router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), bootcampController.getAllBootcamps)
  .post(
    [protect, authorizePermissions("admin", "publisher")],
    bootcampController.createBootcamp
  );

router
  .route("/:id")
  .get(bootcampController.getBootcamp)
  .put(
    [protect, authorizePermissions("admin", "publisher")],
    bootcampController.updateBootcamp
  )
  .delete(
    [protect, authorizePermissions("admin", "publisher")],
    bootcampController.deleteBootcamp
  );

// Export router
module.exports = router;
