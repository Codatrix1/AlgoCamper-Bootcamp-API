const User = require("../models/userModel");
const ErrorResponseAPI = require("../utils/errorResponseAPI");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const asyncHandler = require("../middlewares/asyncHandler");
const {
  createTokenAndAttachCookiesToResponse,
} = require("../middlewares/authMiddleware");

//-------------------------------------------------------------
// @desc     Register user
// @route    POST /api/v1/auth/register
// @access   Public

const register = asyncHandler(async (req, res, next) => {
  // Destructure & Pull out the fields from req.body
  const { name, email, password, role } = req.body;

  // Create user: Validation via Mongoose Schema/Model
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  // Create user token and send in response via cookie:
  createTokenAndAttachCookiesToResponse(user, 200, res);
});

//----------------------------------------------------------------
// @desc     Login user
// @route    POST /api/v1/auth/login
// @access   Public

const login = asyncHandler(async (req, res, next) => {
  // Destructure & Pull out the fields from req.body
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(
      new ErrorResponseAPI("Please provide an email and password", 400)
    );
  }

  // Check for user in the DB: also select the "password" field
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponseAPI("Invalid credentials", 401));
  }

  // If email found in DB, check the entered "password" with compare method defined in the user model
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new ErrorResponseAPI("Invalid credentials", 401));
  }

  // If everything checks out correctly, Create user token and send in response via cookie
  createTokenAndAttachCookiesToResponse(user, 200, res);
});

//-------------------------------------------------------------
// @desc     Logout user/ Clear Cookie
// @route    GET /api/v1/auth/logout
// @access   Private

const logoutUserAndClearCookie = asyncHandler(async (req, res, next) => {
  // to logout user: Remove the cookie from the request
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
    // expires: new Date(Date.now() + 5 * 60 * 1000),
  });

  // while in production
  // res.send();

  // json response for DEV Purposes Only
  res.status(200).json({ success: true, data: {} });
});

//-------------------------------------------------------------
// @desc     Get current logged in user
// @route    GET /api/v1/auth/me
// @access   Private

const showMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // const user = req.user;
  // console.log(user);

  res.status(200).json({
    success: true,
    data: user,
  });
});

//-------------------------------------------------------------
// @desc     Forgot password
// @route    POST /api/v1/auth/forgotpassword
// @access   Public

const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  // console.log(user);

  if (!user) {
    return next(new ErrorResponseAPI("There is no user with that email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  // console.log(resetToken);

  // Save to DB
  await user.save({ validateBeforeSave: false });

  // Send it to User's Email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}`;

  const message = `Forgot Your Password? Submit a PUT request with your new password to: ${resetURL}.\nIf you didn't forget your password, Please Ignore this Email!`;

  try {
    await sendEmail({
      // email: req.body.email,
      email: user.email,
      subject: "Your password reset token (Valid for 10 mins)",
      message: message,
    });

    res.status(200).json({
      success: true,
      data: "Token sent to email",
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new ErrorResponseAPI(
        "Oops! There was an error sending the email. Please try again later.",
        500
      )
    );
  }
});

//-------------------------------------------------------------
// @desc     Reset password
// @route    PUT /api/v1/auth/resetpassword/:token
// @access   Public

const resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(
      new ErrorResponseAPI("Bad Request! Token is invalid or has expired", 400)
    );
  }

  // 3) Set new password for the user
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // 4) Save to DB: [After running through the "pre save" middleware, which encrypts the password before saving to DB ]
  await user.save();

  // If everything checks out correctly, Create user token and send in response via cookie
  createTokenAndAttachCookiesToResponse(user, 200, res);
});

//-------------------------------------------------------------
// @desc     Update name and email for the current logged in user
// @route    PUT /api/v1/auth/updateDetails
// @access   Private

const updateDetails = asyncHandler(async (req, res, next) => {
  // Check for Only name and email: Since we want to update these two fields
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  if (!req.body.name || !req.body.email) {
    return next(new ErrorResponseAPI("Please provide name and email", 400));
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//-------------------------------------------------------------
// @desc     Update user password
// @route    PUT /api/v1/auth/updatePassword
// @access   Private

const updateUserPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  // check for oldPassword, newPassword in the body
  if (!oldPassword || !newPassword) {
    return next(
      new ErrorResponseAPI(
        "Please provide the old password and a new password",
        400
      )
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  // Find the _id of the user in the DB, and check the inputted "oldPassword" with compare [Instance] method defined in the user model
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    return next(new ErrorResponseAPI("Invalid Credentials", 401));
  }
  // console.log(user);

  // If All Checks out correctly, re-assign the password and update the new password in the DB using the save() : Instance Method on the current doc
  user.password = newPassword;
  await user.save();

  // If everything checks out correctly, Create user token and send in response via cookie
  createTokenAndAttachCookiesToResponse(user, 200, res);
});

//---------
// Exports
//---------
module.exports = {
  register,
  login,
  showMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updateUserPassword,
  logoutUserAndClearCookie,
};
