const cls = require('cls-hooked');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Stock = sequelize.define('stock', {
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
  rawMaterialId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  manageStock: { type: DataTypes.STRING },
  stockStatus: { type: DataTypes.STRING },
  stockOnHand: {
    type: DataTypes.INTEGER,
    defaultValue:0 
  },
  stockAvailable: {
    type: DataTypes.INTEGER,
    defaultValue:0 
  },
  onOrder: { type: DataTypes.STRING },
  toBePicked: { type: DataTypes.STRING },
  minimumStockHold: { type: DataTypes.STRING },
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
          if (headers && headers['admin-id']) {
            data.adminId = headers['admin-id'];
          }
        }
        data.isActive = true;
        data.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (data, options) {
        let adminId = undefined;
        const namespace = cls.getNamespace('sequelize-namespace');  
        if (data !== undefined && data.length) {
          for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (namespace) {
              const headers = namespace.get('headers');
              if (headers && headers['admin-id']) {
                element.adminId = headers['admin-id'];
              }
            }
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
}
);
sequelizeTransforms(Stock);
sequelizePaginate.paginate(Stock);
module.exports = Stock;
