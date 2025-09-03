/**
 * city.js
 * @description :: express routes of city APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const cityController =  require('../../../controller/v1/location/cityController');
const { PLATFORM } =  require('../../../constants/authConstant');
const auth = require('../../../middleware/auth');
router.route('/add-city').post(cityController.mangeCity);
router.route('/update-city').put(cityController.mangeCity);
router.route('/get-details/:id').get(cityController.getDetails);
router.route('/manage-status').put(cityController.manageStatus);
router.route('/city-list').post(cityController.cityList);

module.exports = router;
