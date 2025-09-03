const express =  require('express');
const router  =  express.Router();
const holidayController = require('@controller/v1/holidayManagement/holidayController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-holiday').post(auth(PLATFORM.ADMIN),holidayController.addHoliday);
router.route('/update-holiday').put(auth(PLATFORM.ADMIN),holidayController.addHoliday);
router.route('/get-holiday-details/:id').get(auth(PLATFORM.ADMIN),holidayController.getDetails);
router.route('/delete-holiday/:id').delete(auth(PLATFORM.ADMIN),holidayController.deleteHoliday);
router.route('/get-holiday-list').post(auth(PLATFORM.ADMIN),holidayController.getHolidayList);

module.exports = router;
