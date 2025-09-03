/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const standingController = require('@controller/v1/standingOrder/standingController');
const recurringStandingController = require('@controller/v1/standingOrder/recurringStandingController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');

router.route('/get-customer-list').post(auth(PLATFORM.ADMIN),standingController.getCustomerList);
router.route('/get-customer-address').post(auth(PLATFORM.ADMIN),standingController.getCustomerAddress);
router.route('/get-item-list').post(auth(PLATFORM.ADMIN),standingController.getItemList);
router.route('/add-item').post(auth(PLATFORM.ADMIN),standingController.addItem);
router.route('/submit-standing-order').post(auth(PLATFORM.ADMIN),standingController.submitStandingOrder);
router.route('/update-standing-order').put(auth(PLATFORM.ADMIN),standingController.submitStandingOrder);
router.route('/get-standing-order-list').post(auth(PLATFORM.ADMIN),standingController.getStandingOrderList);
router.route('/get-week-list').post(auth(PLATFORM.ADMIN),standingController.getWeekList);
router.route('/get-standing-order-details-list').post(auth(PLATFORM.ADMIN),standingController.getStandingOrderDetails);
router.route('/get-order-details/:customerId/:customerAddressId/:orderId').get(auth(PLATFORM.ADMIN),standingController.getOrderDetails);
router.route('/get-order-details/:customerId/:customerAddressId').get(auth(PLATFORM.ADMIN),standingController.getOrderDetails);
router.route('/get-customer-standing-order-list').post(auth(PLATFORM.ADMIN),standingController.getCustomerStandingOrderList);
router.route('/get-edit-customer-address').post(auth(PLATFORM.ADMIN),standingController.getEditCustomerAddress);

/* RecurringOrder */
// router.route('/create-recurring-order').post(auth(PLATFORM.ADMIN),recurringStandingController.recurringOrder);

module.exports = router;
