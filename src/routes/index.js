/**
 * index.js
 * @description :: index route of platforms
 */

const express = require('express');
const router = express.Router();
const commonController = require('@controller/v1/commonController');
const loginController = require('@controller/v1/front/loginController');
const upload = require('@middleware/multerConfig');

const {
  capitalize, toLowerCase, toUpperCase
} = require('@helpers/function');
const authConstant = require('@constants/authConstant');

const {
  authenticate, noAuth
} = require('@middleware/authMiddleware');

/* Customer Search API */
router.route('/api/v1/customer-search').get(commonController.getCustomerBySearch);

router.route('/api/v1/get-country-list').post(commonController.getCountryList);
router.route('/api/v1/get-state-list').post(commonController.getStateList);
router.route('/api/v1/get-route-list').post(commonController.getRouteList);
router.route('/api/v1/get-date-route-list').post(commonController.getDateRouteList);
router.route('/api/v1/get-item-group-list').post(commonController.getItemGroupList);
router.route('/api/v1/get-role-list').post(commonController.getRoleList);
router.route('/api/v1/get-menu-list').post(commonController.getMenuList);
router.route('/api/v1/get-supplier-list').post(commonController.getSupplierList);
router.route('/api/v1/get-raw-material-list').post(commonController.getRawMaterialList);
router.route('/api/v1/get-product-raw-material-list').post(commonController.productRawMaterialList);
router.route('/api/v1/get-production-raw-material-list').post(commonController.productionRawMaterialList);

router.route('/api/v1/get-filter-country-list').post(commonController.getFilterCountryList);
router.route('/api/v1/get-filter-role-list').post(commonController.getFilterRoleList);
router.route('/api/v1/get-filter-state-list').post(commonController.getFilterStateList);
router.route('/api/v1/get-filter-route-list').post(commonController.getFilterRouteList);
router.route('/api/v1/get-filter-item-group-list').post(commonController.getFilterItemGroupList);
router.route('/api/v1/get-filter-customer-list').post(commonController.getFilterCustomerList);
router.route('/api/v1/get-filter-supplier-list').post(commonController.getFilterSupplierList);

router.route('/api/v1/upload-excel').post(upload.single('file'), commonController.uploadExel);
router.route('/api/v1/upload-item-excel').post(upload.single('file'), commonController.uploadItemExcel);
router.route('/api/v1/upload-route-excel').post(upload.single('file'), commonController.uploadRouteExcel);
router.route('/api/v1/upload-customer-route-excel').post(upload.single('file'), commonController.uploadCustomerRouteExcel);
router.route('/api/v1/upload-order-excel').post(upload.single('file'), commonController.uploadOrderExcel);

/* Front Route */
router.route('/login-user').post(loginController.loginUser);
router.route('/dashboard').get(authenticate, (req, res) => res.render('index'));
router.route('/').get(noAuth, (req, res) => res.render('login/index',{ version:authConstant.CODE_VERSION.currentVersion }));
function formatParameters (parameters) {
  return JSON.stringify(parameters, null, 2)
    .replace(/"(\w+)"\s*:/g, '"<span class="key">$1"</span>:')
    .replace(/"([^"]+)"\s*:/g, '"<span class="value">$1"</span>:');
}
function formatDate (timestamp) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric', 
    second: 'numeric'
  };
  return new Date(timestamp).toLocaleString(undefined, options);
}
function statusColor (status) {
  if (status >= 200 && status < 300) {
    return 'bg-success';
  } else if (status >= 300 && status < 400) {
    return 'bg-primary';
  } else if (status >= 400 && status < 500) {
    return 'bg-warning';
  } else if (status >= 500) {
    return 'bg-danger';
  } else {
    return 'bg-dark';
  }
}

router.use(require('./v1/SuperAdmin/index'));
router.use(require('./v1/Admin/index'));
router.use(require('./v1/Location/index'));
router.use(require('./v1/Route/index'));
router.use(require('./v1/Customer/index'));
router.use(require('./v1/Setting/index'));
router.use(require('./v1/Supplier/index'));
router.use(require('./v1/ItemGroup/index'));
router.use(require('./v1/Item/index'));
router.use(require('./v1/Front/index'));
router.use(require('./v1/Cart/index'));
router.use(require('./v1/Standing/index'));
router.use(require('./v1/DeliveryRules/index'));
router.use(require('./v1/UserManagement/index'));
router.use(require('./v1/Report/index'));
router.use(require('./v1/RawMaterial/index'));
router.use(require('./v1/Stock/index'));
router.use(require('./v1/Batch/index'));
router.use(require('./v1/Holiday/index'));
router.use(require('./v1/Notes/index'));
router.use(require('./v1/PurchaseOrder/index'));
router.use(require('./v1/FineRawMaterial/index'));
router.use(require('./v1/FineProduct/index'));
router.use(require('./v1/ProductionProduct/index'));
router.use(require('./v1/Inventory/index'));
module.exports = router;