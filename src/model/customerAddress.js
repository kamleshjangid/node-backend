/**
 * customer.js
 * @description :: sequelize model of database table customer
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let CustomerAddress = sequelize.define(
  'customeraddress',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    address1: { type: DataTypes.TEXT },
    address2: { type: DataTypes.TEXT },
    address3: { type: DataTypes.TEXT },
    cityName: { type: DataTypes.STRING },
    postcode: { type: DataTypes.STRING },
    countryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    stateId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deliveryRuleId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deliveryType: { type: DataTypes.STRING },
    deliveryPrice: {
      type: DataTypes.STRING,
      defaultValue: 0,
    },
    defaultAddress: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
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
    },
  }
);
sequelizeTransforms(CustomerAddress);
sequelizePaginate.paginate(CustomerAddress);
module.exports = CustomerAddress;
