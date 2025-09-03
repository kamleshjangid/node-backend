/**
 * cart.js
 * @description :: sequelize model of database table cart
 */
const cls = require('cls-hooked');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let CartItem = sequelize.define('cartItems', {
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

  cartId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  itemGroupId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  lateQuantity: { type: DataTypes.INTEGER },
  lateType: {
    type: DataTypes.STRING,
    defaultValue:null 
  },
  quantity: { type: DataTypes.INTEGER },
  soQuantity: {
    type: DataTypes.INTEGER,
    defaultValue:0 
  },
  itemGroupName: { type: DataTypes.STRING },
  itemName: { type: DataTypes.STRING },
  itemCode: { type: DataTypes.STRING },
  weight: { type: DataTypes.STRING }, 
  accountingCode: { type: DataTypes.STRING }, 
  taxType: { type: DataTypes.STRING }, 
  itemPrice: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  retailPrice: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  itemCost: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  totalCost: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  gstPercentage: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  gstPrice: {
    type: DataTypes.STRING,
    defaultValue:'0'
  },
  giftType: {
    type: DataTypes.STRING,
    defaultValue:0
  },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
},{
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
            // element.adminId = adminId;
            element.isActive = true;
            element.isDeleted = false;
          }
        }
      },
    ],
  }
},
);
sequelizeTransforms(CartItem);
sequelizePaginate.paginate(CartItem);
module.exports = CartItem;
