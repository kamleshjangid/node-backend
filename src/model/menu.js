const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Menu = sequelize.define('menu', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue:'All Update Menu',
  },
  menuKeys: {
    type: DataTypes.JSON,
    allowNull: true
  },

  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
},);
sequelizeTransforms(Menu);
sequelizePaginate.paginate(Menu);
module.exports = Menu;
