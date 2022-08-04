const express = require('express');
const {
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  restrictTo
} = require('../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/logout', userController.logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//protect all routes with authentication.

router.use(protect);

router.patch('/updatePassword', updatePassword);

router
  .route('/me')
  .get(userController.getMe, userController.getUser)
  .patch(
    userController.preUpdateUser,
    userController.getMe,
    userController.updateUser
  )
  .delete(userController.deleteMe);

// Restricted Routes for admin only.

router.use(restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
