const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let ProductionProduct = sequelize.define('productionproduct', {
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
  fineProductId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  productionDate: { type: DataTypes.DATEONLY },
  assignedTo: { type: DataTypes.STRING },
  batchCode: { type: DataTypes.INTEGER },
  bestBefore: { type: DataTypes.DATEONLY },
  expiryType: { type: DataTypes.STRING },
  batchQty: { type: DataTypes.STRING },
  expectedYield: { type: DataTypes.INTEGER },
  totalSize: { type: DataTypes.STRING },
  totalCost: { type: DataTypes.STRING },
  currentStage: { type: DataTypes.STRING },
  notes: { type: DataTypes.STRING },
  actualYield: { type: DataTypes.INTEGER },
  statusNotes: { type: DataTypes.STRING },
  mixingTime: { type: DataTypes.DATE },
  bakingTime: { type: DataTypes.DATE },
  packingTime: { type: DataTypes.DATE },
  completedTime: { type: DataTypes.DATE },
  mixingActualYield: { type: DataTypes.INTEGER },
  bakingActualYield: { type: DataTypes.INTEGER },
  packingActualYield: { type: DataTypes.INTEGER },
  completedActualYield: { type: DataTypes.INTEGER },

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
sequelizeTransforms(ProductionProduct);
sequelizePaginate.paginate(ProductionProduct);
module.exports = ProductionProduct;
