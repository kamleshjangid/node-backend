/**
 * customer.js
 * @description :: sequelize model of database table customer
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Customer = sequelize.define('customers', { 
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
  legalName: { type: DataTypes.STRING },
  legacyCode: { type: DataTypes.STRING },
  tradingName: { type: DataTypes.STRING },
  searchTradingName: { type: DataTypes.STRING },
  routeId: { type: DataTypes.TEXT },
  email: { type: DataTypes.STRING },
  mobileNumber: { type: DataTypes.STRING },
  websiteUrl: { type: DataTypes.STRING },
  gst: { type: DataTypes.TEXT },
  paymentTerms: { type: DataTypes.STRING },
  discount: {
    type: DataTypes.STRING,
    defaultValue:0 
  },
  note: { type: DataTypes.TEXT },
  deliveryInstructions: { type: DataTypes.TEXT },
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
sequelizeTransforms(Customer);
sequelizePaginate.paginate(Customer);
module.exports = Customer;
