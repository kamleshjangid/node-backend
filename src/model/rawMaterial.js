const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let RawMaterial = sequelize.define('rawMaterial', {
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
  itemId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  brandName: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  categoryName: { type: DataTypes.STRING },
  size: { type: DataTypes.STRING },
  unitType: { type: DataTypes.STRING },
  shortNameType: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING },
  unitBarcode: { type: DataTypes.STRING },
  cartonBarcode: { type: DataTypes.STRING },
  cartonWidth: { type: DataTypes.STRING },
  cartonHeight: { type: DataTypes.STRING },
  cartonDepth: { type: DataTypes.STRING },
  cartonWeight: { type: DataTypes.STRING },
  productType: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  countryId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  ingredients: { type: DataTypes.STRING },
  allergensContains: { type: DataTypes.STRING },
  allergensMayContains: { type: DataTypes.STRING },
  storageType: { type: DataTypes.STRING },
  shelfLife: { type: DataTypes.STRING },
  shelfLifeType: { type: DataTypes.STRING },
  batchCode: { type: DataTypes.STRING },

  expiryYield: { type: DataTypes.STRING },
  batchCodePrefix: { type: DataTypes.STRING },
  batchShelfLife: { type: DataTypes.STRING },
  batchShelfLifeType: { type: DataTypes.STRING },
  expiryType: { type: DataTypes.STRING },

  recipeSize: { type: DataTypes.STRING },
  recipeCost: { type: DataTypes.STRING },
  recipeUnitSize: { type: DataTypes.STRING },
  recipeUnitCost: { type: DataTypes.STRING },
  inventoryType: {
    type: DataTypes.INTEGER,
    defaultValue:0 
  },
  onHand: { type: DataTypes.STRING },
  available: { type: DataTypes.STRING },
  stockStatus: { type: DataTypes.STRING },
  onOrder: {
    type: DataTypes.STRING,
    defaultValue:0 
  },
  toBePicked: {
    type: DataTypes.STRING,
    defaultValue:0 
  },
  minimumStockHold: {
    type: DataTypes.STRING,
    defaultValue:0 
  },
  manageStock: {
    type: DataTypes.STRING,
    defaultValue:'yes' 
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
  }
}
);
sequelizeTransforms(RawMaterial);
sequelizePaginate.paginate(RawMaterial);
module.exports = RawMaterial;
