/**
 * dashboardController.js
 * @description :: exports dashboard methods
 */
const { 
  item,
  itemGroup,
  route,
  customer,
  cart
} = require('@model/index');
const dbService = require('@utils/dbService');

const dashboardCount = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const itemGroupCount = await dbService.count(itemGroup,{ adminId });
    const itemCount = await dbService.count(item, { adminId });
    const routeCount = await dbService.count(route, { adminId });
    const customerCount = await dbService.count(customer, { adminId });
    const cartCount = await dbService.count(cart, { adminId });
    return res.success({
      data: {
        itemGroupCount:{
          name:'Total Item Group',
          value:itemGroupCount    
        },
        itemCount:{
          name:'Total Item',
          value:itemCount    
        },
        routeCount:{
          name:'Total Route',
          value:routeCount    
        },
        customerCount:{
          name:'Total Customer',
          value:customerCount    
        },
        cartCount:{
          name:'Total Cart Order',
          value:cartCount    
        }
      },
      message: 'Dashboard Count'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = { dashboardCount };








