/**
 * customerAddress.js
 * @description :: Express routes for customer address-related APIs
 */
  
/* Import necessary modules */
const express =  require('express');
const router  =  express.Router();
const customerController = require('@controller/v1/customer/customerController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');

/* Define routes and their corresponding HTTP methods */
router.route('/add-customer-address').post(auth(PLATFORM.ADMIN),customerController.addCustomerAddress);
router.route('/update-customer-address').put(auth(PLATFORM.ADMIN),customerController.addCustomerAddress);
router.route('/get-customer-details/:id').get(auth(PLATFORM.ADMIN),customerController.getCustomerDetails);
router.route('/delete-customer-address/:id').delete(auth(PLATFORM.ADMIN),customerController.deleteCustomerAddress);
router.route('/get-customer-data').post(auth(PLATFORM.ADMIN),customerController.getCustomerAddress);
router.route('/get-week-list').post(auth(PLATFORM.ADMIN),customerController.getWeekList);
router.route('/set-default-address').put(auth(PLATFORM.ADMIN),customerController.setDefaultAddress);
module.exports = router;
