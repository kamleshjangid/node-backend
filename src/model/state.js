/**
 * state.js
 * @description :: sequelize model of database table state
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let State = sequelize.define('states', {
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
  stateName: { type: DataTypes.STRING },
  stateUrl: { type: DataTypes.STRING },
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
      async function (states, options) {
        states.isActive = true;
        states.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (states, options) {
        if (states !== undefined && states.length) {
          for (let index = 0; index < states.length; index++) {
            const element = states[index];
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
});
sequelizeTransforms(State);
sequelizePaginate.paginate(State);
module.exports = State;
