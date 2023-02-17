const Bootcamp = require("../models/bootcampModel");
const ErrorResponseAPI = require("../utils/errorResponseAPI");
const asyncHandler = require("../middlewares/asyncHandler");
const geocoder = require("../utils/geocoder");
const path = require("path");

//---------------------------------------------------------------
// @desc     Get all bootcamps
// @route    GET /api/v1/bootcamps
// @access   Public
const getAllBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//-----------------------------------------------------------------
// @desc     Get single bootcamp
// @route    GET /api/v1/bootcamps/:id
// @access   Public
const getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponseAPI(
        `Bootcamp not found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

//-------------------------------------------------------------
// @desc     Create new bootcamp
// @route    POST /api/v1/bootcamps
// @access   Private
const createBootcamp = asyncHandler(async (req, res, next) => {
  // Add user to req.body: to add "user" field who created the bootcamp with His/Her "id" as the value
  req.body.user = req.user.id;

  // Check for published bootcamp: by user id on a single bootcamp
  // Business Logic 1: Making sure that "One publisher can create only one bootcamp"
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  // Business Logic 2: If the user is not an admin, they can only add one bootcamp
  // admin can add as many bootcamps as He/She wants
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `The user with the role | publisher | with ID ${req.user.id} has already published a bootcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({ success: true, data: bootcamp });
});

//--------------------------------------------------------------
// @desc     Update bootcamp
// @route    PUT /api/v1/bootcamps/:id
// @access   Private
const updateBootcamp = asyncHandler(async (req, res, next) => {
  // search for the bootcamp
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponseAPI(
        `Bootcamp not found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Check Permissions

  // Business Logic 1: Make sure that the Only the publisher(user) who is the owner of the bootcamp can update the bootcamp
  // No other publisher(user) can edit a bootcamp that does not belong to Him/Her
  // Business Logic 2: Also: "admin" can update whatever He/She wants to update: Admin has all the Rights
  // If the "user/publisher" is the owner and also NOT AN ADMIN, he can update the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }

  // If all checks out, go ahead and update
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Response
  res.status(200).json({ success: true, data: bootcamp });
});

//---------------------------------------------------------------
// @desc     Delete bootcamp
// @route    DELETE /api/v1/bootcamps/:id
// @access   Private
const deleteBootcamp = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

  // For cascade delete to work and to fire off the "pre remove" middleware
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponseAPI(
        `No Bootcamp found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Check Permissions

  // Business Logic 1: Make sure that the Only the publisher(user) who is the owner of the bootcamp can delete the bootcamp
  // No other publisher(user) can delete a bootcamp that does not belong to Him/Her
  // Business Logic 2: Also: "admin" can delete whatever He/She wants to delete: Admin has all the Rights
  // If the "user/publisher" is the owner and also NOT AN ADMIN, he can delete the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to delete this bootcamp`,
        401
      )
    );
  }

  // in-order for cascade delete to work: we need to fire off the "pre remove" middleware from the Model : to delete all the courses associated with that particular bootcamp
  // We need this code
  await bootcamp.remove();

  res.status(200).json({ success: true, data: {} });
});

//----------------------------------------------------------------------
// @desc     GeoSpatial Query: Get bootcamps within a radius
// @route    GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access   Private
const getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from the geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calculate radius using radians: MongoDB uses radians
  // Divide distance by Radius of the Earth
  // Earth Radius = 3963 mi / 6378 km
  const radius = distance / 3963.2;

  // MongoDB Docs: If you use longitude and latitude, specify longitude first.
  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

//-------------------------------------------------------------------
// @desc     Upload Image for bootcamp
// @route    PUT /api/v1/bootcamps/:id/image
// @access   Private
const uploadImage = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponseAPI(
        `No Bootcamp found with the ID of ${req.params.id}`,
        404
      )
    );
  }

  // Check Permissions

  // Business Logic 1: Make sure that the Only the publisher(user) who is the owner of the bootcamp can upoad an image for the bootcamp
  // No other publisher(user) can upload an image of the bootcamp that does not belong to Him/Her
  // Business Logic 2: Also: "admin" can upload whatever He/She wants to upload: Admin has all the Rights
  // If the "user/publisher" is the owner and also NOT AN ADMIN, he can upload the image for the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponseAPI(
        `User with the ID ${req.user.id} is not authorized to upload the image OR update this bootcamp`,
        401
      )
    );
  }

  // console.log(req.files);

  // 1) Check for req.files: Coming from "express-fileUpload":
  if (!req.files) {
    return next(new ErrorResponseAPI(`No image uploaded`, 400));
  }

  // 2) get the image property from the object and assign to a variable to be used
  const bootcampImage = req.files.image;

  // 3) Check for mimetype
  if (!bootcampImage.mimetype.startsWith("image")) {
    return next(new ErrorResponseAPI(`Please upload an image file`, 400));
  }

  // 4) Check for allowed file size
  if (bootcampImage.size > process.env.MAX_IMAGE_SIZE) {
    return next(
      new ErrorResponseAPI(`Please upload image smaller than 1MB`, 400)
    );
  }

  // 5) Create Custom File Name
  bootcampImage.name = `image_${bootcamp._id}${
    path.parse(bootcampImage.name).ext
  }`;

  // 6) Save Image to local folder
  const imagePath =
    `${process.env.FILE_UPLOAD_PATH}/` + `${bootcampImage.name}`;

  bootcampImage.mv(imagePath, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponseAPI(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, {
      photo: bootcampImage.name,
    });

    res.status(200).json({
      success: true,
      data: bootcampImage.name,
    });
  });
});

//---------
// Exports
//---------
module.exports = {
  getAllBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  uploadImage,
};

/*
// @desc     Get all bootcamps
// @route    GET /api/v1/bootcamps
// @access   Public
const getAllBootcamps = asyncHandler(async (req, res, next) => {
  // Advanced Filtering: Based on Fields
  let query;

  // making a copy of req.query using Spread
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ["select", "sort", "page", "limit"];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc) for filtering
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr)).populate("courses");

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    // default sort
    query = query.sort("-createdAt _id");
  }

  //------------------------------------- Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  // const skip = (page - 1) * limit;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const bootcamps = await query;

  //-- Pagination Result: PLEASE REVIEW THIS LOGIC LATER
  const pagination = {};

  // For getting the Next Page for Frontend
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  // For getting the Previous Page for Frontend
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // Send Response
  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination: pagination,
    data: bootcamps,
  });
});

*/
