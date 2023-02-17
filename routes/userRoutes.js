const express = require("express");
const router = express.Router();

// import controller
const userController = require("../controllers/userController");

// import factory function middleware and model
const advancedResults = require("../middlewares/advancedResults");
const User = require("../models/userModel");

// auth middleware
const {
  protect,
  authorizePermissions,
} = require("../middlewares/authMiddleware");

// Authorization middleware for all the routes
router.use([protect, authorizePermissions("admin")]);

// Routes
router
  .route("/")
  .get(
    // advancedResults(User, { path: "user", select: "name description" }),
    advancedResults(User),
    userController.getAllUsers
  )
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getSingleUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

//---------------
// Export router
//-----------------
module.exports = router;
