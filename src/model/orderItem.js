/**
 * orderItem.js
 * @description :: sequelize model of database table orderItem
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let OrderItem = sequelize.define('orderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customerAddressId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  itemGroupId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  mon: { type: DataTypes.INTEGER },
  tue: { type: DataTypes.INTEGER },
  wed: { type: DataTypes.INTEGER },
  thu: { type: DataTypes.INTEGER },
  fri: { type: DataTypes.INTEGER },
  sat: { type: DataTypes.INTEGER },
  sun: { type: DataTypes.INTEGER },
  totalQuantity: { type: DataTypes.INTEGER },
  itemCost: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  deliveryCharges: { type: DataTypes.STRING },
  deliveryChargesType: { type: DataTypes.STRING },
  deliveryType: { type: DataTypes.STRING },
  ruleId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  ruleName: { type: DataTypes.STRING },
  rules: { type: DataTypes.JSON },
  rulesPrice: { type: DataTypes.STRING },

  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
},{
  hooks: {
    beforeCreate: [
      async function (data, options) {
        const namespace = cls.getNamespace('sequelize-namespace');  
        if (namespace) {
          const headers = namespace.get('headers');
          if (headers) {
            data.adminId = headers['admin-id'];
          }
        }
        data.isActive = true;
        data.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (data, options) {
        let adminId = '';
        const namespace = cls.getNamespace('sequelize-namespace');  
        if (namespace) {
          const headers = namespace.get('headers');
          if (headers) {
            adminId = headers['admin-id'];
          }
        }
        console.log('====================================');
        console.log('adminId',adminId);
        console.log('====================================');
        if (data !== undefined && data.length) {
          for (let index = 0; index < data.length; index++) {
            const element = data[index];
            // element.adminId = adminId;
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
}
);
sequelizeTransforms(OrderItem);
sequelizePaginate.paginate(OrderItem);
module.exports = OrderItem;
