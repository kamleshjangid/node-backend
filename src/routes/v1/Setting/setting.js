/**
 * setting.js
 * @description :: express routes of setting APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const settingController = require('@controller/v1/production/settingController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/week-list').post(auth(PLATFORM.ADMIN),settingController.getWeeks);
router.route('/save-order-week').put(auth(PLATFORM.ADMIN),settingController.saveOrderWeek);
router.route('/update-foot-notes').put(auth(PLATFORM.ADMIN),settingController.updateFootNotes);

module.exports = router;
