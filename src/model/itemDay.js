/**
 * itemDay.js
 * @description :: sequelize model of database table itemDay
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let ItemDay = sequelize.define('itemday', {
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

  itemId: {
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
      async function (ItemDay, options) {
        ItemDay.isActive = true;
        ItemDay.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (ItemDay, options) {
        if (ItemDay !== undefined && ItemDay.length) {
          for (let index = 0; index < ItemDay.length; index++) {
            const element = ItemDay[index];
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],

  }
}
);
sequelizeTransforms(ItemDay);
sequelizePaginate.paginate(ItemDay);
module.exports = ItemDay;
