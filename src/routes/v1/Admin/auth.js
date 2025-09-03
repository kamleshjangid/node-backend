/**
 * auth.js
 * @description :: express routes of authentication APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const authController =  require('@controller/v1/admin/authController');
const { PLATFORM } =  require('@constants/authConstant');
const auth = require('@middleware/auth');
router.post('/login',authController.login);
router.route('/forgot-password').post(authController.forgotPassword);
router.route('/validate-reset-password').post(authController.validateResetPassword);
router.route('/reset-password').put(authController.resetPassword);
router.route('/logout').post(auth(PLATFORM.ADMIN), authController.logout);
router.route('/get-admin-details').post(auth(PLATFORM.ADMIN), authController.getUserDetails);
router.route('/change-password').put(auth(PLATFORM.ADMIN),authController.changePassword);
router.route('/update-profile').put(auth(PLATFORM.ADMIN),authController.updateProfile);
router.route('/update-setting').put(auth(PLATFORM.ADMIN),authController.updateSetting);

module.exports = router;
