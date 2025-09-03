/**
 * order.js
 * @description :: sequelize model of database table order
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Order = sequelize.define('order', {
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

  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customerAddressId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  mon: { type: DataTypes.JSON },
  tue: { type: DataTypes.JSON },
  wed: { type: DataTypes.JSON },
  thu: { type: DataTypes.JSON },
  fri: { type: DataTypes.JSON },
  sat: { type: DataTypes.JSON },
  sun: { type: DataTypes.JSON },
  totalPieces: { type: DataTypes.STRING },
  itemCost: { type: DataTypes.STRING },
  totalCost: { type: DataTypes.STRING },
  deliveryCharges: { type: DataTypes.STRING },
  deliveryType: { type: DataTypes.STRING },
  ruleId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  ruleName: { type: DataTypes.STRING },
  rules: { type: DataTypes.JSON },
  rulesPrice: { type: DataTypes.STRING },

  totalRetailCost: { type: DataTypes.STRING },

  isActive: { type: DataTypes.BOOLEAN },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  addedBy: { type: DataTypes.INTEGER },
  updatedBy: { type: DataTypes.INTEGER },
  isDeleted: { type: DataTypes.BOOLEAN },
},
{
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
sequelizeTransforms(Order);
sequelizePaginate.paginate(Order);
module.exports = Order;
