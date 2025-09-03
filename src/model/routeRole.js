/**
 * routeRole.js
 * @description :: sequelize model of database table routeRole
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const { convertObjectToEnum } = require('../utils/common');
let RouteRole = sequelize.define('routeRole',{
  routeId:{
    type: DataTypes.UUID,
    allowNull:false 
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  roleId:{ type: DataTypes.UUID },
  id:{
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  isActive:{ type:DataTypes.BOOLEAN },
  createdAt:{ type:DataTypes.DATE },
  updatedAt:{ type:DataTypes.DATE },
  addedBy:{ type:DataTypes.INTEGER },
  updatedBy:{ type:DataTypes.INTEGER },
  isDeleted:{ type:DataTypes.BOOLEAN }
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
RouteRole.prototype.toJSON = function () {
  let values = Object.assign({}, this.get());
  return values;
};
sequelizeTransforms(RouteRole);
sequelizePaginate.paginate(RouteRole);
module.exports = RouteRole;
