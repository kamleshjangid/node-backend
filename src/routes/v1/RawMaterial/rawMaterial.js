/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const rawMaterialController = require('@controller/v1/rawMaterial/rawMaterialController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-raw-material').post(auth(PLATFORM.ADMIN),rawMaterialController.addRawMaterial);
router.route('/update-raw-material').put(auth(PLATFORM.ADMIN),rawMaterialController.addRawMaterial);
router.route('/get-raw-material-details/:id').get(auth(PLATFORM.ADMIN),rawMaterialController.getDetails);
router.route('/manage-raw-material-status').put(auth(PLATFORM.ADMIN),rawMaterialController.manageStatus);
router.route('/get-raw-material-list').post(auth(PLATFORM.ADMIN),rawMaterialController.getRawMaterialList);

module.exports = router;
