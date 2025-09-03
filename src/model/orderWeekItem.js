/**
 * orderWeekItem.js
 * @description :: sequelize model of database table orderWeekItem
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let OrderWeekItem = sequelize.define('orderWeekItem', {
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
        if (data !== undefined && data.length) {
          for (let index = 0; index < data.length; index++) {
            const element = data[index];
            element.adminId = adminId;
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
}
);
sequelizeTransforms(OrderWeekItem);
sequelizePaginate.paginate(OrderWeekItem);
module.exports = OrderWeekItem;
