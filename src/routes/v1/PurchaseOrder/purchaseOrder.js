const express =  require('express');
const router  =  express.Router();
const purchaseOrderController = require('@controller/v1/purchaseOrder/purchaseOrderController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/create-purchase-order').post(auth(PLATFORM.ADMIN),purchaseOrderController.createPurchaseOrder);
router.route('/get-purchase-order-details/:id').get(auth(PLATFORM.ADMIN),purchaseOrderController.purchaseOrderDetails);
router.route('/manage-order-status').put(auth(PLATFORM.ADMIN),purchaseOrderController.manageOrderStatus);
router.route('/remove-order/:id').delete(auth(PLATFORM.ADMIN),purchaseOrderController.orderDelete);
router.route('/get-purchase-order-list').post(auth(PLATFORM.ADMIN),purchaseOrderController.purchaseOrderList);
router.route('/receiving-order-details/:id').get(auth(PLATFORM.ADMIN),purchaseOrderController.receivingOrderDetails);
router.route('/cancel-receiving-order').put(auth(PLATFORM.ADMIN),purchaseOrderController.cancelReceivingOrder);
router.route('/submit-receiving-order').post(auth(PLATFORM.ADMIN),purchaseOrderController.submitReceivingOrder);

module.exports = router;
