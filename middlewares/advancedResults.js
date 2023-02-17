//------------------------------------------------------------------------
// Generic Factory Function to achieve advanced results in multiple models
//------------------------------------------------------------------------

const advancedResults = (Model, fieldsToPopulate) => async (req, res, next) => {
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
  //   query = Model.find(JSON.parse(queryStr)).populate("courses");
  query = Model.find(JSON.parse(queryStr));

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

  const total = await Model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Dynamic populate
  if (fieldsToPopulate) {
    query = query.populate(fieldsToPopulate);
  }

  // Executing query
  const documents = await query;

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

  // Create a new Object on the response object that we can use within any Routes that uses this middleware
  res.advancedResults = {
    success: true,
    count: documents.length,
    pagination,
    data: documents,
  };

  next();
};

//---------
// Export
//--------
module.exports = advancedResults;
