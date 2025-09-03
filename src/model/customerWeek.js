/**
 * customerWeek.js
 * @description :: sequelize model of database table customerWeek
 */
const cls = require('cls-hooked');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let CustomerWeek = sequelize.define('customerweek', {
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
  customerAddressId: {
    type: DataTypes.UUID,
    allowNull: false 
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false 
  },
  weekDayId: {
    type: DataTypes.UUID,
    allowNull: false 
  },
  type:{ 
    type: DataTypes.BOOLEAN,
    defaultValue: false    
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: true 
  },
  routeType:{ 
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
            // element.adminId = adminId;
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
}
);
sequelizeTransforms(CustomerWeek);
sequelizePaginate.paginate(CustomerWeek);
module.exports = CustomerWeek;
