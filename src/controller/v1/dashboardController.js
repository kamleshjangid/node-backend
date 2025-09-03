/**
 * dashboardController.js
 * @description :: exports dashboard methods
 */
const { 
  countries,
  state,
  city,
  admin
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');

const dashboardCount = async (req, res) => {
  try {
    const companyCount = await dbService.count(admin,  { roleId: null });
    const countryCount = await dbService.count(countries);
    const stateCount = await dbService.count(state);
    const cityCount = await dbService.count(city);
    return res.success({
      data: {
        companyCount:{
          name:'Total Company',
          value:companyCount    
        },
        countryCount:{
          name:'Total Country',
          value:countryCount    
        },
        stateCount:{
          name:'Total State',
          value:stateCount    
        },
        cityCount:{
          name:'Total City',
          value:cityCount    
        }
      },
      message: 'Dashboard Count'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = { dashboardCount };