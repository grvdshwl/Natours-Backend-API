const Review = require('../models/review.model');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  createOne,
  updateOne,
  getOne,
  getAll
} = require('./handleFactory');

exports.addTourAndUserOnReview = (req, res, next) => {
  if (req.params.tourId) {
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
};

exports.createReview = createOne(Review);

exports.getAllReviews = getAll(Review);

exports.getReview = getOne(Review);

exports.deleteReview = deleteOne(Review);

exports.updateReview = updateOne(Review);
