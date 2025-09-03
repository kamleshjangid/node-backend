/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const itemController = require('@controller/v1/item/itemController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-item').post(auth(PLATFORM.ADMIN),itemController.addItem);
router.route('/update-item').put(auth(PLATFORM.ADMIN),itemController.addItem);
router.route('/get-details/:id').get(auth(PLATFORM.ADMIN),itemController.getDetails);
router.route('/manage-status').put(auth(PLATFORM.ADMIN),itemController.manageStatus);
router.route('/item-list').post(auth(PLATFORM.ADMIN),itemController.itemList);
router.route('/delete-item/:id').delete(auth(PLATFORM.ADMIN),itemController.deleteItem);

module.exports = router;
