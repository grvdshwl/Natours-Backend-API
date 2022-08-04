const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, getOne, getAll, updateOne } = require('./handleFactory');

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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.logout = async (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'Success'
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exists.

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check if user exists and password is correct.

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // if valid send token

  createAndSendToken(user, 200, res);
});

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm
  });

  const token = signToken(newUser.id);

  const userObj = {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email
  };

  res.status(201).json({
    status: 'Success',
    token,
    data: {
      user: userObj
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'Success',
    data: null
  });
});

exports.preUpdateUser = (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'Please do not enter password. Use /updatePassword route to change password.'
      )
    );
  }
  req.body = filterObj(req.body, 'name', 'email');

  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  console.log('mes');
  next();
};

exports.updateUser = updateOne(User);

exports.getUser = getOne(User);

exports.getAllUsers = getAll(User);

exports.deleteUser = deleteOne(User);
