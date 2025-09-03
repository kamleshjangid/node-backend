const express =  require('express');
const router  =  express.Router();
const productionController = require('@controller/v1/production/productionController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/delivery-order-list').post(auth(PLATFORM.ADMIN),productionController.deliveryOrderList);
router.route('/get-order-customer-list').post(auth(PLATFORM.ADMIN),productionController.getOrderCustomerList);
module.exports = router;
