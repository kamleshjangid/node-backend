/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const customerController = require('@controller/v1/customer/customerController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-customer').post(auth(PLATFORM.ADMIN),customerController.addCustomer);
router.route('/update-customer').put(auth(PLATFORM.ADMIN),customerController.addCustomer);
router.route('/get-details/:id').get(auth(PLATFORM.ADMIN),customerController.getDetails);
router.route('/manage-status').put(auth(PLATFORM.ADMIN),customerController.manageStatus);
router.route('/customer-list').post(auth(PLATFORM.ADMIN),customerController.customerList);
router.route('/get-customer-route-list/:id').get(auth(PLATFORM.ADMIN),customerController.getCustomerRouteList);
router.route('/get-customer-route-list/:id/:addressId').get(auth(PLATFORM.ADMIN),customerController.getCustomerRouteList);
router.route('/get-delivery-rule-list').post(auth(PLATFORM.ADMIN),customerController.getDeliveryRuleList);
router.route('/customer-standing-order').post(auth(PLATFORM.ADMIN),customerController.customerStandingOrder);
router.route('/get-customer-order').post(auth(PLATFORM.ADMIN),customerController.getCustomerOrder);
router.route('/get-address-list').post(auth(PLATFORM.ADMIN),customerController.getAddressList);

module.exports = router;
