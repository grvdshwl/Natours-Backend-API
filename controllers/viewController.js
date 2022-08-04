const Tour = require('../models/tour.model');
const UserModel = require('../models/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const newTour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'review rating user'
  });

  if (!newTour) {
    return next(new AppError('No Tour exists for with that name.', 404));
  }

  res.status(200).render('tour', {
    title: `${newTour.name} tour`,
    tour: newTour
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login'
  });
});

exports.getUserProfile = async (req, res) => {
  res.status(200).render('account', {
    title: 'User Profile'
  });
};

// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const { email, name } = req.body;
//   const updatedUser = await UserModel.findByIdAndUpdate(
//     req.user._id,
//     {
//       email,
//       name
//     },
//     { runValidators: true, new: true }
//   );

//   res.status(200).render('account', {
//     title: 'User Profile',
//     user: updatedUser
//   });
// });
