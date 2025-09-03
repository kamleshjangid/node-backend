/**
 * cart.js
 * @description :: sequelize model of database table cart
 */
const cls = require('cls-hooked');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const sequelizePaginate = require('sequelize-paginate');
const sequelizeTransforms = require('sequelize-transforms');
let Cart = sequelize.define('carts', {
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
  standingOrderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customerAddressId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  routeName: { type: DataTypes.TEXT },
  purchaseOrder: { type: DataTypes.STRING },
  customerEmail: { type: DataTypes.STRING },
  customerLegacyCode: { type: DataTypes.STRING },
  customerName:{ type: DataTypes.STRING },
  customerFullAddress:{ type: DataTypes.TEXT },
  customerTerms:{ type: DataTypes.STRING },
  address1: { type: DataTypes.TEXT },
  address2: { type: DataTypes.TEXT },
  address3: { type: DataTypes.TEXT },
  cityName: { type: DataTypes.STRING },
  postcode: { type: DataTypes.STRING }, 
  countryName: { type: DataTypes.STRING }, 
  stateName: { type: DataTypes.STRING }, 

  deliveryNumber:{ type: DataTypes.STRING },  
  invoiceNumber: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  deliveryChargesType: { type: DataTypes.BOOLEAN },
  deliveryCharges: { type: DataTypes.STRING },
  totalPieces: { type: DataTypes.STRING },
  totalWeight: { type: DataTypes.STRING },
  totalCost: { type: DataTypes.STRING },
  terms: { type: DataTypes.STRING },
  GST: { type: DataTypes.STRING },
  lateQuantity: { type: DataTypes.INTEGER },
  deliveryType: { type: DataTypes.STRING },
  discountPer: { type: DataTypes.STRING },
  discountPrice: { type: DataTypes.STRING },
  ruleId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  ruleName: { type: DataTypes.STRING },
  rules: { type: DataTypes.JSON },
  rulesPrice: { type: DataTypes.STRING },
  orderDate: { type: DataTypes.DATEONLY },
  deliveryDate: { type: DataTypes.DATEONLY },
  dueDate: { type: DataTypes.DATEONLY },
  deliveryStatus: {
    type: DataTypes.INTEGER,
    defaultValue:0 
  },
  publishedStatus: {
    type: DataTypes.INTEGER,
    defaultValue:0 
  },
  submitBy: {
    type: DataTypes.STRING,
    defaultValue:'cart' 
  },
  isActive: { type: DataTypes.BOOLEAN },
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
  addedBy: { type: DataTypes.INTEGER },
  updatedBy: { type: DataTypes.INTEGER },
  isDeleted: { type: DataTypes.BOOLEAN },
  soStatus: {
    type: DataTypes.STRING,
    defaultValue:null 
  },
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
sequelizeTransforms(Cart);
sequelizePaginate.paginate(Cart);
module.exports = Cart;
