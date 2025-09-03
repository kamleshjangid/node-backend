/**
 * route.js
 * @description :: express routes of route APIs
 */
  
const express =  require('express');
const router  =  express.Router();
const routeController = require('@controller/v1/route/routeController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-route').post(auth(PLATFORM.ADMIN),routeController.addRoute);
router.route('/update-route').put(auth(PLATFORM.ADMIN),routeController.addRoute);
router.route('/get-details/:id').get(auth(PLATFORM.ADMIN),routeController.getDetails);
router.route('/manage-status').put(auth(PLATFORM.ADMIN),routeController.manageStatus);
router.route('/route-list').post(auth(PLATFORM.ADMIN),routeController.routeList);

module.exports = router;
