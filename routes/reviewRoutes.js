const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  deleteReview,
  updateReview,
  addTourAndUserOnReview,
  getReview
} = require('../controllers/reviewController');

const {
  getAllReviews,
  createReview
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), addTourAndUserOnReview, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
