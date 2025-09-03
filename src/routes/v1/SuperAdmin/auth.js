/**
 * auth.js
 * @description :: express routes of authentication APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const authController =  require('@controller/v1/authentication/authController');
const { PLATFORM } =  require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/register').post(authController.register);
router.post('/login',authController.login);
router.route('/forgot-password').post(authController.forgotPassword);
router.route('/validate-reset-password').post(authController.validateResetPassword);
router.route('/reset-password').put(authController.resetPassword);
router.route('/update-profile').put(authController.updateProfile);
router.route('/get-user-details').post(authController.getUserDetails);
router.route('/change-password').put(authController.changePassword);
router.route('/logout').post(auth(PLATFORM.SUPER_ADMIN), authController.logout); 

module.exports = router;
