/**
 * state.js
 * @description :: express routes of state APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const stateController =  require('../../../controller/v1/location/stateController');
const { PLATFORM } =  require('../../../constants/authConstant');
const auth = require('../../../middleware/auth');
router.route('/get-country-list').post(stateController.getCountryList);
router.route('/add-state').post(stateController.addState);
router.route('/update-state').put(stateController.addState);
router.route('/get-details/:id').get(stateController.getDetails);
router.route('/manage-status').put(stateController.manageStatus);
router.route('/state-list').post(stateController.stateList);

module.exports = router;
