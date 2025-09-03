/**
 * auth.js
 * @description :: express routes of authentication APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const countryController =  require('../../../controller/v1/location/countryController');
const { PLATFORM } =  require('../../../constants/authConstant');
const auth = require('../../../middleware/auth');
router.route('/add-country').post(countryController.addCountry);
router.route('/update-country').put(countryController.addCountry);
router.route('/get-details/:id').get(countryController.getDetails);
router.route('/manage-status').put(countryController.manageStatus);
router.route('/country-list').post(countryController.countryList);

module.exports = router;
