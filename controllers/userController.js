const User = require("../models/userModel");
const ErrorResponseAPI = require("../utils/errorResponseAPI");
const asyncHandler = require("../middlewares/asyncHandler");

//-------------------------------------------------------------
// @desc     Get All Users
// @route    GET /api/v1/auth/users
// @access   Private [ Admin Only]
const getAllUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//-------------------------------------------------------------
// @desc     Get Single User
// @route    GET /api/v1/auth/users/:id
// @access   Private [ Admin Only]
const getSingleUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponseAPI(
        `User not found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

//-------------------------------------------------------------
// @desc     Create User
// @route    POST /api/v1/auth/users
// @access   Private [ Admin Only]
const createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

//-------------------------------------------------------------
// @desc     Update User
// @route    PUT /api/v1/auth/users/:id
// @access   Private [ Admin Only]
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//-------------------------------------------------------------
// @desc     Delete User
// @route    DELETE /api/v1/auth/users/:id
// @access   Private [ Admin Only]
const deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

//---------
// Exports
//---------
module.exports = {
  getAllUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
};
