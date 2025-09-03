/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const productionProductController = require('@controller/v1/productionProduct/productionProductController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-product-production').post(auth(PLATFORM.ADMIN),productionProductController.addProductionProduct);
router.route('/update-product-production').put(auth(PLATFORM.ADMIN),productionProductController.addProductionProduct);
router.route('/get-fine-product-details').post(auth(PLATFORM.ADMIN),productionProductController.getFineProductDetails);
router.route('/delete-production-product/:id').delete(auth(PLATFORM.ADMIN),productionProductController.deleteProductionProduct);
router.route('/get-production-product-details/:id').get(auth(PLATFORM.ADMIN),productionProductController.getProductionProductDetails);
router.route('/update-status').put(auth(PLATFORM.ADMIN),productionProductController.updateStatus);
router.route('/get-production-product-list').post(auth(PLATFORM.ADMIN),productionProductController.getProductionProductList);

module.exports = router;
