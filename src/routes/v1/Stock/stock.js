const express =  require('express');
const router  =  express.Router();
const stockController = require('@controller/v1/stockManagement/stockController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/get-stock-details/:id').get(auth(PLATFORM.ADMIN),stockController.getDetails);
router.route('/add-batch').post(auth(PLATFORM.ADMIN),stockController.addBatch);
router.route('/update-batch').put(auth(PLATFORM.ADMIN),stockController.addBatch);
router.route('/get-batch-details/:id').get(auth(PLATFORM.ADMIN),stockController.getBatchDetails);
router.route('/remove-batch/:id').delete(auth(PLATFORM.ADMIN),stockController.removeBatch);
router.route('/update-stock').put(auth(PLATFORM.ADMIN),stockController.updateStock);
/*
 * router.route('/add-stock').post(auth(PLATFORM.ADMIN),stockController.addStock);
 * router.route('/update-stock').put(auth(PLATFORM.ADMIN),stockController.addStock);
 * router.route('/get-stock-details/:id').get(auth(PLATFORM.ADMIN),stockController.getDetails);
 * router.route('/manage-stock-status').put(auth(PLATFORM.ADMIN),stockController.manageStatus);
 * router.route('/get-stock-list').post(auth(PLATFORM.ADMIN),stockController.stockList);
 */
module.exports = router;
