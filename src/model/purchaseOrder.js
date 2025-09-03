const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let PurchaseOrder = sequelize.define('purchaseorder', {
  autoIncrementId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue:1,
  },  
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    unique: true,
    allowNull: false,
  },
  adminId: {
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
  orderDate: { type: DataTypes.DATE },
  batchNumber: { type: DataTypes.STRING },
  orderPrefix: {
    type: DataTypes.STRING,
    defaultValue:'OD' 
  },
  orderNumber: { type: DataTypes.INTEGER },
  receivePrefix: {
    type: DataTypes.STRING,
    defaultValue:'R' 
  },
  receiveNumber: { type: DataTypes.INTEGER },
  totalQty: { type: DataTypes.STRING },
  itemsReceived: { type: DataTypes.STRING },
  subTotal: { type: DataTypes.STRING },
  total: { type: DataTypes.STRING },
  batchCode: { type: DataTypes.STRING },

  supplierName: { type: DataTypes.STRING },
  countryName: { type: DataTypes.STRING },
  orderNotes: { type: DataTypes.TEXT },
  orderStatus: {
    type: DataTypes.STRING,
    defaultValue:0
  },
  lastStatus: {
    type: DataTypes.STRING,
    defaultValue:0
  },
  receivedAt: { type: DataTypes.DATE },
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
sequelizeTransforms(PurchaseOrder);
sequelizePaginate.paginate(PurchaseOrder);
module.exports = PurchaseOrder;
