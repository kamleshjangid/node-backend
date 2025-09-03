/**
 * admin.js
 * @description :: sequelize model of database table admin
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Admin = sequelize.define('admins', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  companyName: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING },
  legacyCode: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  mobileNumber: { type: DataTypes.STRING },
  websiteUrl: { type: DataTypes.STRING },
  gst: { type: DataTypes.TEXT },
  address1: { type: DataTypes.TEXT },
  address2: { type: DataTypes.TEXT },
  address3: { type: DataTypes.TEXT },
  cityName: { type: DataTypes.STRING },
  postcode: { type: DataTypes.STRING },
  countryId: {
    type: DataTypes.UUID,
    allowNull: true 
  },
  stateId: {
    type: DataTypes.UUID,
    allowNull: true 
  },
  currentActiveStatus:{
    type:DataTypes.INTEGER,
    defaultValue:0 
  },
  tradingName: { type: DataTypes.STRING },
  tradingAddress1: { type: DataTypes.TEXT },
  tradingAddress2: { type: DataTypes.TEXT },
  tradingAddress3: { type: DataTypes.TEXT },
  tradingCityName: { type: DataTypes.STRING },
  tradingPostcode: { type: DataTypes.STRING },
  tradingCountryId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  tradingStateId: {
    type: DataTypes.UUID,
    allowNull: true 
  },
  userType:{
    type:DataTypes.INTEGER,
    defaultValue:2 
  },
  mode: {
    type: DataTypes.STRING,
    defaultValue:'light' 
  },
  layout: {
    type: DataTypes.STRING ,
    defaultValue:'vertical'
  },
  contrast: {
    type: DataTypes.STRING,
    defaultValue:'default' 
  }, 
  presets: {
    type: DataTypes.STRING,
    defaultValue:'default' 
  },
  userRole:{
    type:DataTypes.STRING,
    defaultValue: 'BAKERY_ADMIN'
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
  packingNote: { type: DataTypes.TEXT },
  sideBarItem: { type: DataTypes.JSON },

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
      async function (admin, options) {
        admin.isActive = true;
        admin.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (admin, options) {
        if (admin !== undefined && admin.length) {
          for (let index = 0; index < admin.length; index++) {
            const element = admin[index];
            element.isActive = true; 
            element.isDeleted = false;
          }
        }
      },
    ],
    afterCreate: [
      async function (admin,options){
        sequelize.model('userAuthSettings').create({ userId:admin.id });
      },
    ],

  }
}
);
sequelizeTransforms(Admin);
sequelizePaginate.paginate(Admin);
module.exports = Admin;
