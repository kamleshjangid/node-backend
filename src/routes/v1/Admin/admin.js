/**
 * user.js
 * @description :: express routes of authentication APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const adminController =  require('@controller/v1/admin/adminController');
const { PLATFORM } =  require('@constants/authConstant');
const auth = require('@middleware/auth');
const checkRolePermission = require('@middleware/checkRolePermission');
router.route('/add-company').post(auth(PLATFORM.SUPER_ADMIN),adminController.manageAdmin);
router.route('/update-company').put(auth(PLATFORM.SUPER_ADMIN),adminController.manageAdmin);
router.route('/get-details/:id').get(auth(PLATFORM.SUPER_ADMIN),adminController.getDetails);
router.route('/manage-status').put(auth(PLATFORM.SUPER_ADMIN),adminController.manageStatus);
router.route('/admin-list').post(auth(PLATFORM.SUPER_ADMIN),adminController.adminList);
router.route('/delete-company/:id').delete(auth(PLATFORM.SUPER_ADMIN),adminController.deleteCompany);
router.route('/update-company-password').put(auth(PLATFORM.SUPER_ADMIN),adminController.updateCompanyPassword);
router.route('/admin-user-list').post(auth(PLATFORM.SUPER_ADMIN),adminController.adminUserList);


module.exports = router;
