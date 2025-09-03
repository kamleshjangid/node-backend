const cls = require('cls-hooked');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Notes = sequelize.define('notes', {
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
  heading: { type: DataTypes.STRING },
  title: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  colorCode: { type: DataTypes.STRING },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'notes' 
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
          if (headers && headers['admin-id']) {
            data.adminId = headers['admin-id'];
          }
        }
        data.isActive = true;
        data.isDeleted = false;
      },
    ],
    beforeBulkCreate: [
      async function (data, options) {
        let adminId = undefined;
        const namespace = cls.getNamespace('sequelize-namespace');  
        if (data !== undefined && data.length) {
          for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (namespace) {
              const headers = namespace.get('headers');
              if (headers && headers['admin-id']) {
                element.adminId = headers['admin-id'];
              }
            }
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
}
);
sequelizeTransforms(Notes);
sequelizePaginate.paginate(Notes);
module.exports = Notes;
