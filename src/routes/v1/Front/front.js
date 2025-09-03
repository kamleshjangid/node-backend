/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const frontController = require('@controller/v1/front/frontController');
router.route('/manage-menu').get(frontController.menuIndex);

module.exports = router;
