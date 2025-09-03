const express =  require('express');
const router  =  express.Router();
const batchController = require('@controller/v1/batchManagement/batchController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/add-batch').post(auth(PLATFORM.ADMIN),batchController.addBatch);
router.route('/update-batch').put(auth(PLATFORM.ADMIN),batchController.addBatch);
router.route('/get-batch-details/:id').get(auth(PLATFORM.ADMIN),batchController.getDetails);
router.route('/manage-batch-status').put(auth(PLATFORM.ADMIN),batchController.manageStatus);
router.route('/get-batch-list').post(auth(PLATFORM.ADMIN),batchController.batchList);

module.exports = router;
