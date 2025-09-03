const express =  require('express');
const router  =  express.Router();
const roleController = require('@controller/v1/userManagement/roleController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-role').post(auth(PLATFORM.ADMIN),roleController.addRole);
router.route('/update-role').put(auth(PLATFORM.ADMIN),roleController.addRole);
router.route('/get-role-details/:id').get(auth(PLATFORM.ADMIN),roleController.getRoleDetails);
router.route('/manage-role-status').put(auth(PLATFORM.ADMIN),roleController.manageStatus);
router.route('/role-list').post(auth(PLATFORM.ADMIN),roleController.roleList);

module.exports = router;
