const express =  require('express');
const router  =  express.Router();
const fineRawMaterialController = require('@controller/v1/fineRawMaterial/fineRawMaterialController');
const { PLATFORM } = require('@constants/authConstant');
const auth = require('@middleware/auth');
router.route('/get-raw-material-list').post(auth(PLATFORM.ADMIN),fineRawMaterialController.getRawMaterialList);
router.route('/add-fine-raw-material').post(auth(PLATFORM.ADMIN),fineRawMaterialController.addFineRawMaterial);
router.route('/update-fine-raw-material').put(auth(PLATFORM.ADMIN),fineRawMaterialController.addFineRawMaterial);
router.route('/get-fine-raw-material-details/:id').get(auth(PLATFORM.ADMIN),fineRawMaterialController.getFineRawMaterialDetails);
router.route('/manage-fine-raw-material-status').put(auth(PLATFORM.ADMIN),fineRawMaterialController.manageStatus);
router.route('/get-fine-raw-material-list').post(auth(PLATFORM.ADMIN),fineRawMaterialController.getFineRawMaterialList);

module.exports = router;
