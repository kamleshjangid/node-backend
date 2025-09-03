/**
 * user.js
 * @description :: sequelize model of database table user
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
const bcrypt = require('bcrypt');
let User = sequelize.define('user',{
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

  username:{ type:DataTypes.STRING },
  password:{ type:DataTypes.STRING },
  email:{ type:DataTypes.STRING },
  name:{ type:DataTypes.STRING },
  userType:{ type:DataTypes.INTEGER },
  userRole:{
    type:DataTypes.STRING,
    defaultValue: 'SUPER_ADMIN'  
  },
  isActive:{ type:DataTypes.BOOLEAN },
  isDeleted:{ type:DataTypes.BOOLEAN },
  createdAt:{ type:DataTypes.DATE },
  updatedAt:{ type:DataTypes.DATE },
  addedBy:{ type:DataTypes.INTEGER },
  updatedBy:{ type:DataTypes.INTEGER },
  mobileNo:{ type:DataTypes.STRING },
}
,{
  hooks:{
    beforeCreate: [
      async function (user,options){
        const namespace = cls.getNamespace('sequelize-namespace');  
        if (namespace) {
          const headers = namespace.get('headers');
          if (headers) {
            data.adminId = headers['admin-id'];
          }
        }

        if (user.password){ user.password =
          await bcrypt.hash(user.password, 8);}
        user.isActive = true;
        user.isDeleted = false;

      },
    ],
    beforeBulkCreate: [
      async function (user,options){
        let adminId = '';
        const namespace = cls.getNamespace('sequelize-namespace');  
        if (namespace) {
          const headers = namespace.get('headers');
          if (headers) {
            adminId = headers['admin-id'];
          }
        }
        
        if (user !== undefined && user.length) { 
          for (let index = 0; index < user.length; index++) { 
            const element = user[index];
            if (element.password){ 
              element.password = await bcrypt.hash(element.password, 8);
            }
            element.adminId = adminId; 
            element.isActive = true; 
            element.isDeleted = false;
          } 
        }
      },
    ],
    afterCreate: [
      async function (user,options){
        sequelize.model('userAuthSettings').create({ userId:user.id });
      },
    ],
  }
}
);
User.prototype.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};
User.prototype.toJSON = function () {
  let values = Object.assign({}, this.get());
  delete values.password;
  return values;
};
sequelizeTransforms(User);
sequelizePaginate.paginate(User);
module.exports = User;
