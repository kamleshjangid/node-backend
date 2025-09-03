const express =  require('express');
const router  =  express.Router();
const userController = require('@controller/v1/userManagement/userController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-user').post(auth(PLATFORM.ADMIN),userController.addUser);
router.route('/update-user').put(auth(PLATFORM.ADMIN),userController.addUser);
router.route('/get-user-details/:id').get(auth(PLATFORM.ADMIN),userController.getUserDetails);
router.route('/manage-user-status').put(auth(PLATFORM.ADMIN),userController.manageUserStatus);
router.route('/get-user-list').post(auth(PLATFORM.ADMIN),userController.userList);
router.route('/get-login-details/:id').get(auth(PLATFORM.ADMIN),userController.loginDetails);
router.route('/change-password').put(auth(PLATFORM.ADMIN),userController.changePassword);

module.exports = router;
