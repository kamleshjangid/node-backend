/**
 * supplier.js
 * @description :: express routes of supplier APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const supplierController = require('@controller/v1/supplier/supplierController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-supplier').post(auth(PLATFORM.ADMIN),supplierController.addSupplier);
router.route('/update-supplier').put(auth(PLATFORM.ADMIN),supplierController.addSupplier);
router.route('/get-details/:id').get(auth(PLATFORM.ADMIN),supplierController.getDetails);
router.route('/manage-supplier-status').put(auth(PLATFORM.ADMIN),supplierController.manageStatus);
router.route('/get-supplier-list').post(auth(PLATFORM.ADMIN),supplierController.supplierList);
router.route('/get-supplier-order-list').post(auth(PLATFORM.ADMIN),supplierController.supplierOrderList);
router.route('/get-supplier-product-list').post(auth(PLATFORM.ADMIN),supplierController.supplierProductList);

module.exports = router;
