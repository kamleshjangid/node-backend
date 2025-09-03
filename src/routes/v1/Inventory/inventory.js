const express =  require('express');
const router  =  express.Router();
const inventoryController = require('@controller/v1/inventory/inventoryController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/get-inventory-list').post(auth(PLATFORM.ADMIN),inventoryController.getInventoryList);
module.exports = router;
