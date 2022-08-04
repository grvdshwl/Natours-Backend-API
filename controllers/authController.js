const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //Send JWT
  res.status(statusCode).json({
    status: 'Success',
    token: token
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // Check if token exists in req.

  let token = null;
  if (
    req.headers?.authorization &&
    req.headers?.authorization?.startsWith('Bearer')
  ) {
    token = req.headers?.authorization?.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // Token Verification.

  if (!token) {
    return next(new AppError('User is not logged in. Please login in.', 401));
  }

  const tokenData = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if users exist for the token.
  const freshUser = await User.findById(tokenData.id);

  if (!freshUser) {
    return next(
      new AppError('User does not exists the for provided token.', 401)
    );
  }

  // Check if password has been changed post token is created.

  const isPasswordChanged = freshUser.checkPasswordUpdated(tokenData.iat);

  if (isPasswordChanged) {
    return next(
      new AppError('Password changed for the user.Please log in again.', 401)
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;

  // Allow to proceed
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const tokenData = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // Check if users exist for the token.
      const freshUser = await User.findById(tokenData.id);

      if (!freshUser) {
        return next();
      }

      // Check if password has been changed post token is created.

      const isPasswordChanged = freshUser.checkPasswordUpdated(tokenData.iat);

      if (isPasswordChanged) {
        return next();
      }
      res.locals.user = freshUser;
      req.user = freshUser;

      // Allow to proceed
      return next();
    }

    return next();
  } catch (err) {
    next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permissions to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on Posted Email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address,', 404));
  }

  //Generate random  reset token.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to User's email
  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password ? Submit a patch request with your new password and passwordConfirm to  ${resetUrl}. \n If you didn't forgot your password please ignore this email.`;
    const subject = 'Your password reset token (valid for 10mins.)';
    const { email } = user;

    await sendEmail({
      email,
      subject,
      message
    });

    res.status(200).json({
      status: 'Success',
      message: 'Token Sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError('There was an error sending email.Try again later.', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log('reset test');
  //Check if user exist for token provided.
  const resetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetExpires: { $gte: Date.now() }
  });

  if (!user) {
    next(new AppError('Token is invalid or expired.Please Try again', 400));
  }

  //if user exists then change password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection

  const user = await User.findById(req.user._id).select('+password');
  //checked if posted currrent password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  //Update Password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //Login User

  createAndSendToken(user, 200, res);
});
