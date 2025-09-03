/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const cartController = require('@controller/v1/cart/cartController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');

router.route('/get-customer-address').post(auth(PLATFORM.ADMIN),cartController.getCustomerAddress);
router.route('/get-item-list').post(auth(PLATFORM.ADMIN),cartController.getItemList);
router.route('/add-item').post(auth(PLATFORM.ADMIN),cartController.addItem);
router.route('/submit-cart-order').post(auth(PLATFORM.ADMIN),cartController.submitCartOrder);
router.route('/update-cart-order').put(auth(PLATFORM.ADMIN),cartController.submitCartOrder);
router.route('/get-order-date').post(auth(PLATFORM.ADMIN),cartController.getOrderDate);
router.route('/get-last-order').post(auth(PLATFORM.ADMIN),cartController.getLastOrder);
router.route('/get-new-last-order').post(auth(PLATFORM.ADMIN),cartController.getNewLastOrder);
router.route('/get-cart-order-list').post(auth(PLATFORM.ADMIN),cartController.getCartOrderList);
router.route('/get-cart-order-details/:cartId/:customerId').get(auth(PLATFORM.ADMIN),cartController.getCartOrderDetails);
router.route('/get-customer-details').post(auth(PLATFORM.ADMIN),cartController.getCustomerDetails);
router.route('/delete-cart-order').post(auth(PLATFORM.ADMIN),cartController.deleteCartOrder);
router.route('/get-customer-list').post(auth(PLATFORM.ADMIN),cartController.getCustomerList);
router.route('/check-holiday').post(auth(PLATFORM.ADMIN),cartController.checkHoliday);
module.exports = router;
