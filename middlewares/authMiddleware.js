//-----------------
//  Authentication
//-----------------

// imports
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const ErrorResponseAPI = require("../utils/errorResponseAPI");

//-------------------------------------------------------------------
// Script 1) : Get token from model, create cookie and send response
//-------------------------------------------------------------------
const createTokenAndAttachCookiesToResponse = (user, statusCode, res) => {
  // Create Token: method called on the current document
  const token = user.getSignedJwtToken();

  // cookie options
  const options = {
    // To prevent Cross-Site Scripting Attacks: to ensure that the Browser cannot modify the cookie in any condition
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_LIFETIME * 24 * 60 * 60 * 1000
    ),
  };

  if (process.env.NODE_ENV === "production") {
    // this code ensures, the cookie will be sent only through https:// while in production
    // thus, we can still send cookies in development with http:// for testing
    options.secure = true;
  }

  // Sending Cookie with response
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

//-----------------------------------------------------------------------
// Level 1 Security: Authenticate User: Protect Routes w/ verified token
//-----------------------------------------------------------------------
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from bearer token in headers
    token = req.headers.authorization.split(" ")[1];
  }
  // // Set token from Cookie
  // else if (req.cookies.token) {
  //   // else part to send the authorization header via cookie:
  //   // Make sure to remove the copy/pasted Auth Headers from POSTMAN
  //   // otherwise the "id" would be returned as "null" when you try to authorize user via Cookie token
  //   token = req.cookies.token;
  // }

  // Check for token
  if (!token) {
    return next(
      new ErrorResponseAPI("Not Authorized to access this route ", 401)
    );
  }

  try {
    // Verify signed token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    return next(new ErrorResponseAPI("Unauthorized to access this route", 401));
  }
});

//--------------------------------------------------------------------------------------------
// Level 2 Security : Authenticate user as an admin, publisher or whatever args passed in the userRoutes
//--------------------------------------------------------------------------------------------
// Grant Access to specific Roles
const authorizePermissions = (...roles) => {
  // console.log(roles); // Passed as args in the userRoutes
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponseAPI(
          `ACCESS DENIED: User role | ${req.user.role} | is unauthorized to perform this action `,
          403
        )
      );
    }
    next();
  };
};

//-----------
// Export
//-----------
module.exports = {
  createTokenAndAttachCookiesToResponse,
  protect,
  authorizePermissions,
};
