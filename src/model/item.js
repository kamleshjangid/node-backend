/**
 * item.js
 * @description :: sequelize model of database table item
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Item = sequelize.define( 
  'items',
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

    name: { type: DataTypes.STRING },
    itemGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    selfLifeDay: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    sameDayDelivery: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    returnable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    wholeSalePrice: { type: DataTypes.STRING },
    retailPrice: { type: DataTypes.STRING },
    taxStructure: { type: DataTypes.STRING },
    gstPercentage: {
      type: DataTypes.STRING,
      defaultValue: '0',
    },
    taxIncludePrice: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    productionCost: { type: DataTypes.STRING },
    legacyCode: { type: DataTypes.STRING },
    accountingCode: { type: DataTypes.STRING },
    minOrder: { type: DataTypes.INTEGER },
    maxOrder: { type: DataTypes.INTEGER },
    unitOfMeasure: { type: DataTypes.STRING },
    weight: { type: DataTypes.STRING },
    bakedWeight: { type: DataTypes.STRING },
    packSize: { type: DataTypes.STRING },
    packWeight: { type: DataTypes.STRING },
    barcodeType: { type: DataTypes.STRING },
    barcodeValue: { type: DataTypes.STRING },
    tags: { type: DataTypes.TEXT },
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
          console.log('====================================');
          console.log('adminId ', adminId);
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
    },
  }
);
sequelizeTransforms(Item);
sequelizePaginate.paginate(Item);
module.exports = Item;
