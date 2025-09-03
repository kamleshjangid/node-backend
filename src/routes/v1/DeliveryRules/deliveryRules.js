/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const deliveryRulesController = require('@controller/v1/deliveryRules/deliveryRulesController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-delivery-rules').post(auth(PLATFORM.ADMIN),deliveryRulesController.addDeliveryRules);
router.route('/update-delivery-rules').put(auth(PLATFORM.ADMIN),deliveryRulesController.addDeliveryRules);
router.route('/get-details/:id').get(auth(PLATFORM.ADMIN),deliveryRulesController.getDetails);
router.route('/delivery-rules-list').post(auth(PLATFORM.ADMIN),deliveryRulesController.deliveryRulesList);
router.route('/delete-delivery-rules/:id').delete(auth(PLATFORM.ADMIN),deliveryRulesController.deleteDeliveryRules);

module.exports = router;
