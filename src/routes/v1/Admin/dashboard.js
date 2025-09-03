/**
 * dashboard.js
 * @description :: express routes of authentication APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const dashboardController =  require('@controller/v1/admin/dashboardController');
const { PLATFORM } =  require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/dashboard-count').post(auth(PLATFORM.ADMIN),dashboardController.dashboardCount);

module.exports = router;
