const express =  require('express');
const router  =  express.Router();
const customerItemController = require('@controller/v1/customer/customerItemController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');

router.route('/add-customer-item').post(auth(PLATFORM.ADMIN),customerItemController.addCustomerItem);
router.route('/get-customer-item-list').post(auth(PLATFORM.ADMIN),customerItemController.getCustomerItem);
router.route('/manage-customer-item-status').put(auth(PLATFORM.ADMIN),customerItemController.manageStatus);
router.route('/get-item-list').post(auth(PLATFORM.ADMIN),customerItemController.getItemList);

module.exports = router;
