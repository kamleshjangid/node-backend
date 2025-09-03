/**
 * countries.js
 * @description :: sequelize model of database table countries
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let countries = sequelize.define('countries', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  countryName: { type: DataTypes.STRING },
  countryUrl: { type: DataTypes.STRING },
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
      async function (countries, options) {
        countries.isActive = true;
        countries.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (countries, options) {
        if (countries !== undefined && countries.length) {
          for (let index = 0; index < countries.length; index++) {
            const element = countries[index];
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
}
);
sequelizeTransforms(countries);
sequelizePaginate.paginate(countries);
module.exports = countries;
