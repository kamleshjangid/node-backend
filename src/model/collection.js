/**
 * Collection.js
 * @description :: sequelize model of database table Collection
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Collection = sequelize.define('collection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  openapiSpec: {
    type: DataTypes.TEXT,
    allowNull: true // Modify as needed based on your requirements
  },

  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
},);
sequelizeTransforms(Collection);
sequelizePaginate.paginate(Collection);
module.exports = Collection;
