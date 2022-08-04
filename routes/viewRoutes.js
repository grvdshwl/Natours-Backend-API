const express = require('express');
const { isLoggedIn, protect } = require('../controllers/authController');
const {
  getTour,
  getOverview,
  getLogin,
  getUserProfile
} = require('../controllers/viewController');
const router = express.Router();

router.get('/', isLoggedIn, getOverview);

router.get('/tour/:slug', isLoggedIn, getTour);

router.get('/login', isLoggedIn, getLogin);

router.get('/me', protect, getUserProfile);

module.exports = router;
