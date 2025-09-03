/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const itemGroupController = require('@controller/v1/itemGroup/itemGroupController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-item-group').post(auth(PLATFORM.ADMIN),itemGroupController.addItemGroup);
router.route('/update-item-group').put(auth(PLATFORM.ADMIN),itemGroupController.addItemGroup);
router.route('/get-details/:id').get(auth(PLATFORM.ADMIN),itemGroupController.getDetails);
router.route('/manage-status').put(auth(PLATFORM.ADMIN),itemGroupController.manageStatus);
router.route('/item-group-list').post(auth(PLATFORM.ADMIN),itemGroupController.itemGroupList);
router.route('/delete-item-group/:id').delete(auth(PLATFORM.ADMIN),itemGroupController.deleteItemGroup);
router.route('/get-master-catalogue').post(auth(PLATFORM.ADMIN),itemGroupController.getMasterCatalogue);

module.exports = router;
