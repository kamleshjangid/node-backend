const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let AdminUser = sequelize.define('adminuser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
  roleId: {
    type: DataTypes.UUID,
    allowNull: true 
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true 
  },

  sideBarItem: { type: DataTypes.JSON },
  password: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  mobileNumber: { type: DataTypes.STRING },
  userType:{
    type:DataTypes.INTEGER,
    defaultValue:2 
  },
  userRole:{
    type:DataTypes.STRING,
    defaultValue: 'BAKERY_ADMIN'
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
sequelizeTransforms(AdminUser);
sequelizePaginate.paginate(AdminUser);
module.exports = AdminUser;
