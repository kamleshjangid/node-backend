
/**
 * dbConnection.js
 * @description :: database connection using sequelize
 */

const {
  Sequelize, DataTypes
} = require('sequelize');
const cls = require('cls-hooked');

// Create a CLS namespace
const namespace = cls.createNamespace('sequelize-namespace');
// Use the CLS namespace with Sequelize
Sequelize.useCLS(namespace);
const dbConfig = require('./db');


const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  port: dbConfig.port,
  logging: false
});


/* const sequelize = new Sequelize('db_bakery', 'postgres', 'postgres', {
  host: '154.26.159.1',
  port: 5432,
  dialect: 'postgres',
  logging: false
}); */
sequelize.authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));
module.exports = sequelize;
