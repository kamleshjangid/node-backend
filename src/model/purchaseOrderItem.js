const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let PurchaseOrderItem = sequelize.define('purchaseorderitem', {
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
  purchaseOrderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  supplierId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  rawMaterialId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  brandName: { type: DataTypes.STRING },
  rawMaterialBatchCode: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  size: { type: DataTypes.STRING },
  unitType: { type: DataTypes.STRING },
  shortNameType: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING },
  purchasedBy: { type: DataTypes.STRING },
  purchaseCartonQty: { type: DataTypes.STRING },
  buyPrice: { type: DataTypes.STRING },
  buyTax: { type: DataTypes.STRING },
  supplierSKU: { type: DataTypes.STRING },

  batchNumber: { type: DataTypes.STRING },
  rawMaterialName: { type: DataTypes.TEXT },
  itemPrice: { type: DataTypes.STRING },
  quantity: { type: DataTypes.STRING },
  itemsReceived: { type: DataTypes.STRING },
  itemTotal: { type: DataTypes.STRING },
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
sequelizeTransforms(PurchaseOrderItem);
sequelizePaginate.paginate(PurchaseOrderItem);
module.exports = PurchaseOrderItem;
