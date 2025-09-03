/**
 * city.js
 * @description :: sequelize model of database table city
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let City = sequelize.define('cities', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  countryId: {
    type: DataTypes.UUID,
    allowNull: false 
  },
  stateId: {
    type: DataTypes.UUID,
    allowNull: false 
  },
  cityName: { type: DataTypes.STRING },
  cityUrl: { type: DataTypes.STRING },
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
      async function (City, options) {
        City.isActive = true;
        City.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (City, options) {
        if (City !== undefined && City.length) {
          for (let index = 0; index < City.length; index++) {
            const element = City[index];
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
});
sequelizeTransforms(City);
sequelizePaginate.paginate(City);
module.exports = City;
