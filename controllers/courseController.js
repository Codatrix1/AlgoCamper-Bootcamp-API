const Course = require("../models/courseModel");
const Bootcamp = require("../models/bootcampModel");
const ErrorResponseAPI = require("../utils/errorResponseAPI");
const asyncHandler = require("../middlewares/asyncHandler");

//----------------------------------------------------------------------
// @desc     Get all courses
// @route    GET /api/v1/courses
// @route    GET /api/v1/bootcamps/:bootcampId/courses
// @access   Public
const getAllCourses = asyncHandler(async (req, res, next) => {
  // check for params
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    // Response For getting all the courses in a single bootcamp
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    // For getiing filtered response coming from the advancedResults middleware
    res.status(200).json(res.advancedResults);
  }
});

//-----------------------------------------------------------------------------------
// @desc     Get Single course
// @route    GET /api/v1/courses/:id
// @access   Public
const getSingleCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  // Check for course
  if (!course) {
    return next(
      new ErrorResponseAPI(
        `No course found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Response
  res.status(200).json({ success: true, data: course });
});

//-----------------------------------------------------------------------------------
// @desc     Create/Add a course to the bootcamp
// @route    POST /api/v1/bootcamps/:bootcampId/courses
// @access   Private
const addCourse = asyncHandler(async (req, res, next) => {
  // Manually assign the following
  // Add bootcamp to req.body: to add the bootcamp with "id" as the value: for the course to have the bootcamp to which it is associated with
  req.body.bootcamp = req.params.bootcampId;
  // Add user to req.body: to add "user" field who created the course with His/Her "id" as the value
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  // Check for the bootcamp
  if (!bootcamp) {
    return next(
      new ErrorResponseAPI(
        `No bootcamp found with the ID of ${req.params.bootcampId}`,
        404
      )
    );
  }

  // Check Permissions

  // Business Logic 1: Make sure that the Only the publisher(user) who is the owner of the bootcamp can add a course to the bootcamp
  // No other publisher(user) can add a course to the bootcamp that does not belong to Him/Her
  // Business Logic 2: Also: "admin" can add whatever He/She wants to add: Admin has all the Rights
  // If the "user/publisher" is the owner and also NOT AN ADMIN, he can add a course to the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to add a course to the bootcamp with the ID ${bootcamp._id}`,
        401
      )
    );
  }

  // Create course
  const course = await Course.create(req.body);

  // Response
  res.status(201).json({ success: true, data: course });
});

//-----------------------------------------------------------------------------------
// @desc     Update a course
// @route    PUT /api/v1/courses/:id
// @access   Private
const updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  // Check for the course
  if (!course) {
    return next(
      new ErrorResponseAPI(
        `No course found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Check Permissions

  // Business Logic 1: Make sure that the Only the publisher(user) who is the owner of the bootcamp can update a course to the bootcamp
  // No other publisher(user) can update a course to the bootcamp that does not belong to Him/Her
  // Business Logic 2: Also: "admin" can update whatever He/She wants to add: Admin has all the Rights
  // If the "user/publisher" is the owner and also NOT AN ADMIN, he can update a course to the bootcamp
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to update a course to the bootcamp with the ID ${course._id}`,
        401
      )
    );
  }

  // Update course
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Response
  res.status(200).json({ success: true, data: course });
});

//-----------------------------------------------------------------------------------
// @desc     Delete a course
// @route    DELETE /api/v1/courses/:id
// @access   Private
const deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  // Check for the course
  if (!course) {
    return next(
      new ErrorResponseAPI(
        `No course found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Check Permissions

  // Business Logic 1: Make sure that the Only the publisher(user) who is the owner of the bootcamp can delete a course to the bootcamp
  // No other publisher(user) can delete a course to the bootcamp that does not belong to Him/Her
  // Business Logic 2: Also: "admin" can delete whatever He/She wants to add: Admin has all the Rights
  // If the "user/publisher" is the owner and also NOT AN ADMIN, he can delete a course to the bootcamp
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to delete a course to the bootcamp with the ID ${course._id}`,
        401
      )
    );
  }

  // Delete course: We will be using a middleware to perform this action
  await course.remove();

  // Response
  res.status(200).json({ success: true, data: {} });
});

//-----------
// Exports
//----------
module.exports = {
  getAllCourses,
  getSingleCourse,
  addCourse,
  updateCourse,
  deleteCourse,
};

/*
//----------------------------------------------------------------------
// @desc     Get all courses
// @route    GET /api/v1/courses
// @route    GET /api/v1/bootcamps/:bootcampId/courses
// @access   Public
const getAllCourses = asyncHandler(async (req, res, next) => {
  // initialize a query
  let query;

  // check for params and build the queries
  if (req.params.bootcampId) {
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    query = Course.find().populate({
      path: "bootcamp",
      select: "name description",
    });
  }

  // Execute the query
  const courses = await query;

  // Response
  res.status(200).json({ success: true, count: courses.length, data: courses });
});

*/
