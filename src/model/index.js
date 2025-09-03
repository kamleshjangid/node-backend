/**
 * index.js
 * @description :: exports all the models and its relationships among other models
 */

const dbConnection = require('../config/dbConnection');
const db = {};
db.sequelize = dbConnection;
db.user = require('./user');
db.userTokens = require('./userTokens');
db.projectRoute = require('./projectRoute');
db.routeRole = require('./routeRole');
db.userRole = require('./userRole');
db.role = require('./role');
db.userAuthSettings = require('./userAuthSettings');
db.state = require('./state');
db.countries = require('./country');
db.route = require('./route');
db.customer = require('./customer');
db.week = require('./week');
db.supplier = require('./supplier');
db.supplierNumber = require('./supplierNumber');
db.supplierDeliveryDay = require('./supplierDeliveryDay');
db.itemGroup = require('./itemGroup');
db.item = require('./item');
db.admin = require('./admin');
db.city = require('./city');
db.customerAddress = require('./customerAddress');
db.cart = require('./cart');
db.cartItem = require('./cartItem');
db.itemDay = require('./itemDay');
db.collection = require('./collection');
db.customerWeek = require('./customerWeek');
db.order = require('./order');
db.orderItem = require('./orderItem');
db.deliveryRules = require('./deliveryRules');
db.customerItem = require('./customerItem');
db.menu = require('./menu');
db.adminUser = require('./adminUser');
db.rawMaterial = require('./rawMaterial');
db.rawMaterialProduct = require('./rawMaterialProduct');
db.stock = require('./stock');
db.batch = require('./batch');
db.holiday = require('./holiday');
db.notes = require('./notes');
db.purchaseOrder = require('./purchaseOrder');
db.purchaseOrderItem = require('./purchaseOrderItem');
db.fineRawMaterial = require('./fineRawMaterial');
db.fineRawItem = require('./fineRawItem');
db.inventory = require('./inventory');
db.fineProductItem = require('./fineProductItem');
db.productionProduct = require('./productionProduct');

db.state.belongsTo(db.countries, {
  foreignKey: 'countryId',
  as: 'countryData',
  sourceKey: 'id'
});

/* CUSTOMER JOIN */

/*
 * db.customer.belongsTo(db.user, {
 * foreignKey: 'accountExecutiveId',
 * as: 'userData',
 * sourceKey: 'id'
 * }); 
 */

db.customer.hasMany(db.customerAddress, {
  foreignKey: 'customerId',
  as: 'customerAddressData',
  sourceKey: 'id'
});
db.customer.hasMany(db.order, {
  foreignKey: 'customerId',
  as: 'orderData',
  sourceKey: 'id'
});

/* Supplier Joins */
db.supplier.belongsTo(db.countries, {
  foreignKey: 'countryId',
  as: 'countryData',
  sourceKey: 'id'
});

db.supplier.belongsTo(db.state, {
  foreignKey: 'stateId',
  as: 'stateData',
  sourceKey: 'id'
});

db.supplier.hasMany(db.supplierNumber, {
  foreignKey: 'supplierId',
  as: 'supplierNumberData',
  sourceKey: 'id'
});

db.supplier.hasMany(db.supplierDeliveryDay, {
  foreignKey: 'supplierId',
  as: 'deliveryDayData',
  sourceKey: 'id'
});

db.supplier.hasOne(db.supplierNumber, {
  foreignKey: 'supplierId',
  as: 'oneSupplierNumberData',
  sourceKey: 'id'
});

/* Item Join */
db.item.belongsTo(db.itemGroup, {
  foreignKey: 'itemGroupId',
  as: 'itemGroupData',
  sourceKey: 'id'
});
db.item.hasMany(db.itemDay, {
  foreignKey: 'itemId',
  as: 'itemDayData',
  sourceKey: 'id'
});
db.itemDay.belongsTo(db.week, {
  foreignKey: 'weekDayId',
  as: 'weekData',
  sourceKey: 'id'
});

/* Admin JOIN */
db.admin.belongsTo(db.countries, {
  foreignKey: 'countryId',
  as: 'countryData',
  sourceKey: 'id'
});
db.admin.belongsTo(db.state, {
  foreignKey: 'stateId',
  as: 'stateData',
  sourceKey: 'id'
});

db.admin.belongsTo(db.countries, {
  foreignKey: 'tradingCountryId',
  as: 'tradingCountryData',
  sourceKey: 'id'
});
db.admin.belongsTo(db.state, {
  foreignKey: 'tradingStateId',
  as: 'tradingStateData',
  sourceKey: 'id'
});

/* City JOIN */
db.city.belongsTo(db.countries, {
  foreignKey: 'countryId',
  as: 'countryData',
  sourceKey: 'id'
});
db.city.belongsTo(db.state, {
  foreignKey: 'stateId',
  as: 'stateData',
  sourceKey: 'id'
});

/* Customer Address Join */
db.customerAddress.hasOne(db.order, {
  foreignKey: 'customerAddressId',
  as: 'orderData',
  sourceKey: 'id'
});
db.customerAddress.belongsTo(db.countries, {
  foreignKey: 'countryId',
  as: 'countryData',
  sourceKey: 'id'
});
db.customerAddress.belongsTo(db.state, {
  foreignKey: 'stateId',
  as: 'stateData',
  sourceKey: 'id'
});
db.supplierDeliveryDay.belongsTo(db.week, {
  foreignKey: 'weekDayId',
  as: 'weekData',
  sourceKey: 'id'
});
db.customerAddress.hasMany(db.customerWeek, {
  foreignKey: 'customerAddressId',
  as: 'weekData',
  sourceKey: 'id'
});
db.customerWeek.belongsTo(db.week, {
  foreignKey: 'weekDayId',
  as: 'weekData',
  sourceKey: 'id'
});
db.customerWeek.belongsTo(db.route, {
  foreignKey: 'routeId',
  as: 'routeData',
  sourceKey: 'id'
});

/* Cart Join */
/*
 * db.item.hasMany(db.cartItem, {
 * foreignKey: 'itemId',
 * as: 'cartItemData',
 * sourceKey: 'id'
 * });
 */
db.cart.belongsTo(db.customer, {
  foreignKey: 'customerId',
  as: 'customerData',
  sourceKey: 'id'
});
db.cart.hasMany(db.cartItem, {
  foreignKey: 'cartId',
  as: 'cartItemData',
  sourceKey: 'id'
});
db.cartItem.belongsTo(db.cart, {
  foreignKey: 'cartId',
  as: 'cartData',
  sourceKey: 'id'
});
db.cartItem.belongsTo(db.item, {
  foreignKey: 'itemId',
  as: 'itemData',
  sourceKey: 'id'
});
db.cartItem.belongsTo(db.itemGroup, {
  foreignKey: 'itemGroupId',
  as: 'itemGroupData',
  sourceKey: 'id'
});
db.cart.belongsTo(db.customerAddress, {
  foreignKey: 'customerAddressId',
  as: 'customerAddressData',
  sourceKey: 'id'
});

/* Standing Order JOIN */
db.orderItem.belongsTo(db.itemGroup, {
  foreignKey: 'itemGroupId',
  as: 'itemGroupData',
  sourceKey: 'id'
});
db.orderItem.belongsTo(db.order, {
  foreignKey: 'orderId',
  as: 'orderIdData',
  sourceKey: 'id'
});
db.itemGroup.hasMany(db.item, {
  foreignKey: 'itemGroupId',
  as: 'itemData',
  sourceKey: 'id'
});
db.item.hasOne(db.orderItem, {
  foreignKey: 'itemId',
  as: 'orderItemData',
  sourceKey: 'id'
});
db.orderItem.belongsTo(db.customer, {
  foreignKey: 'customerId',
  as: 'customerData',
  sourceKey: 'id'
});
db.orderItem.belongsTo(db.customerAddress, {
  foreignKey: 'customerAddressId',
  as: 'customerAddressData',
  sourceKey: 'id'
});
db.orderItem.belongsTo(db.item, {
  foreignKey: 'itemId',
  as: 'itemData',
  sourceKey: 'id'
});
db.week.hasOne(db.customerWeek, {
  foreignKey: 'weekDayId',
  as: 'customerWeekData',
  sourceKey: 'id'
});
db.order.belongsTo(db.customer, {
  foreignKey: 'customerId',
  as: 'customerData',
  sourceKey: 'id'
});
db.order.belongsTo(db.customerAddress, {
  foreignKey: 'customerAddressId',
  as: 'customerAddressData',
  sourceKey: 'id'
});
db.order.hasMany(db.orderItem, {
  foreignKey: 'orderId',
  as: 'orderItemData',
  sourceKey: 'id'
});

/* Delivery Rules Join */
db.customerAddress.belongsTo(db.deliveryRules, {
  foreignKey: 'deliveryRuleId',
  as: 'deliveryRulesData',
  sourceKey: 'id'
});
db.order.belongsTo(db.deliveryRules, {
  foreignKey: 'ruleId',
  as: 'deliveryRulesData',
  sourceKey: 'id'
});

/* Customer Item Join */
db.item.hasOne(db.customerItem, {
  foreignKey: 'itemId',
  as: 'customerItemData',
  sourceKey: 'id'
});

db.customerItem.belongsTo(db.item, {
  foreignKey: 'itemId',
  as: 'itemData',
  sourceKey: 'id'
});

db.route.hasMany(db.cart, {
  foreignKey: 'routeId',
  as: 'cartData',
  sourceKey: 'id'
});

db.admin.belongsTo(db.role, {
  foreignKey: 'roleId',
  as: 'roleData',
  sourceKey: 'id'
});

/* Raw Material Join */
db.rawMaterial.hasMany(db.rawMaterialProduct, {
  foreignKey: 'rawMaterialId',
  as: 'productDetails',
  sourceKey: 'id'
});
db.rawMaterial.hasOne(db.rawMaterialProduct, {
  foreignKey: 'rawMaterialId',
  as: 'singleProductDetails',
  sourceKey: 'id'
});

db.rawMaterial.belongsTo(db.countries, {
  foreignKey: 'countryId',
  as: 'countryData',
  sourceKey: 'id'
});
/* rawMaterialProduct Join */
db.rawMaterialProduct.belongsTo(db.supplier, {
  foreignKey: 'supplierId',
  as: 'supplierData',
  sourceKey: 'id'
});

/* Stock Join */
db.stock.hasMany(db.batch, {
  foreignKey: 'stockId',
  as: 'batchData',
  sourceKey: 'id'
});

/* Purchase Order Join */
db.purchaseOrder.hasMany(db.purchaseOrderItem, {
  foreignKey: 'purchaseOrderId',
  as: 'purchaseOrderItemData',
  sourceKey: 'id'
});
db.purchaseOrder.belongsTo(db.supplier, {
  foreignKey: 'supplierId',
  as: 'supplierData',
  sourceKey: 'id'
});
/* Fine Product */
db.fineRawMaterial.hasMany(db.fineRawItem, {
  foreignKey: 'fineRawMaterialId',
  as: 'productDetails',
  sourceKey: 'id'
});
db.fineRawItem.belongsTo(db.rawMaterial, {
  foreignKey: 'rawMaterialId',
  as: 'rawMaterialData',
  sourceKey: 'id'
});
db.purchaseOrderItem.belongsTo(db.rawMaterial, {
  foreignKey: 'rawMaterialId',
  as: 'rawMaterialData',
  sourceKey: 'id'
});
db.rawMaterialProduct.belongsTo(db.rawMaterial, {
  foreignKey: 'rawMaterialId',
  as: 'rawMaterialData',
  sourceKey: 'id'
});

db.fineProductItem.belongsTo(db.rawMaterial, {
  foreignKey: 'rawMaterialId',
  as: 'rawMaterialData',
  sourceKey: 'id'
});
db.rawMaterial.hasMany(db.fineProductItem, {
  foreignKey: 'fineProductId',
  as: 'fineProductItemData',
  sourceKey: 'id'
});
db.productionProduct.belongsTo(db.rawMaterial, {
  foreignKey: 'fineProductId',
  as: 'rawMaterialData',
  sourceKey: 'id'
});
db.rawMaterial.hasMany(db.batch, {
  foreignKey: 'rawMaterialId',
  as: 'batchData',
  sourceKey: 'id'
});

db.rawMaterial.belongsTo(db.item, {
  foreignKey: 'itemId',
  as: 'itemData',
  sourceKey: 'id'
});
db.order.hasMany(db.cart, {
  foreignKey: 'standingOrderId',
  as: 'cartData',
  sourceKey: 'id'
});

module.exports = db;