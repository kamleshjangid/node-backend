const {
  cart, customer, order, orderItem, item, itemGroup, customerAddress, countries, state, customerWeek, week, cartItem, deliveryRules, route, holiday
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize, col, fn
} = require('sequelize');
const cron = require('node-cron');
async function getCustomerData (customerId, customerAddressId, weekDayName, adminId) {
  const customerData = await customer.findOne({
    where:{
      id:customerId,
      adminId 
    },
    attributes:['legalName','legacyCode','routeId','paymentTerms','discount','note'] 
  });
  const addressData = await customerAddress.findOne({
    where:{
      id:customerAddressId,
      adminId 
    },
    include: [
      {
        model: countries,
        as: 'countryData',
        attributes: []
      },
      {
        model: state,
        as: 'stateData',
        attributes: []
      },
      {
        model: deliveryRules,
        as: 'deliveryRulesData',
        attributes: ['id', 'ruleName', 'rules'],
      },
      {
        model: customerWeek,
        where: {
          customerAddressId: customerAddressId,
          type: true
        },
        attributes:['routeId'],
        as: 'weekData',
        include: [
          {
            model: week,
            as: 'weekData',
            where: { name: `${[weekDayName]}` },
            attributes: ['name']
          },            
          {
            model: route,
            as: 'routeData',
            attributes: ['name']
          },
        ],
      },
    ],
    attributes: [
      'id',
      [
        Sequelize.fn(
          'TRIM',
          Sequelize.fn(
            'CONCAT',
            Sequelize.fn('COALESCE', Sequelize.col('address1'), ''),
            Sequelize.literal(`
            CASE
              WHEN "address2" IS NOT NULL AND "address2" != '' THEN CONCAT(' ', "address2")
              ELSE ''
            END
          `),
            Sequelize.literal(`
            CASE
              WHEN "address3" IS NOT NULL AND "address3" != '' THEN CONCAT(' ', "address3")
              ELSE ''
            END
          `),
            '',
            Sequelize.literal(`
            CASE
              WHEN "countryData"."countryName" IS NOT NULL THEN CONCAT(', ', "countryData"."countryName")
              ELSE ''
            END
          `),
            ' ',
            Sequelize.literal(`
            CASE
              WHEN "stateData"."stateName" IS NOT NULL THEN CONCAT(', ', "stateData"."stateName")
              ELSE ''
            END
          `),
            Sequelize.literal(`
              CASE
                WHEN "cityName" IS NOT NULL AND "cityName" != '' THEN CONCAT(', ', "cityName")
                ELSE ''
              END
            `),
            ' ',
            Sequelize.fn('COALESCE', Sequelize.col('postcode'), ''),
            '.'
          )
        ),
        'address1'
      ]
    ],    
  });
  const dataObj = {
    customerData,
    addressData 
  };
  return dataObj;
}

async function cartOrderFun (cartObj, cartItemData, shortWeekdayName) {
  try {
    const checkOrder = await checkExistingCartOrder(cartObj.customerId, cartObj.customerAddressId, cartObj.deliveryDate, cartObj.adminId);
    if (checkOrder) {
      const createCartItem = await cartItemFun(checkOrder, cartItemData, shortWeekdayName, 1);
      if (!createCartItem) {
        return false;
      }  
      return true;
    } else {
      let createdCart = await dbService.createOne(cart, cartObj);
      if (!createdCart) {
        return false;
      }
      const createCartItem = await cartItemFun(createdCart, cartItemData, shortWeekdayName, 2);
      if (!createCartItem) {
        return false;
      }
      return true;
    }
  } catch (error) {
    console.log('Error :', error);  
  }
}

async function cartItemFun (cartObj, cartItemData, shortWeekdayName, dataType) {
  if (dataType == 1){
    let totalWeight = 0;
    let totalCost = +cartObj.totalCost;
    let deliveryCharges = +cartObj.deliveryCharges;
    let totalPieces = +cartObj.totalPieces;

    const updatedArray = await Promise.all(cartItemData.map(async (item) => {
      let where = {
        customerId: cartObj.customerId,
        adminId: cartObj.adminId,
        itemId: item.itemId
      };
    
      const existingCartOrder = await cartItem.findOne({ where: where });
      if (existingCartOrder) {
        return null;
      }

      deliveryCharges += item.deliveryCharges;

      let updatedItem = {
        adminId: cartObj.adminId,
        quantity: item[shortWeekdayName.toLocaleLowerCase()],
        itemGroupId: item.itemGroupId,
        itemId: item.itemId,
        customerId: item.customerId,
        cartId: cartObj.id,
        itemGroupName: item?.itemGroupData.name,
        itemName: item?.itemData.name,
        weight: item?.itemData.weight,
        legacyCode: item?.itemData.legacyCode,
        itemPrice: item?.itemData.wholeSalePrice,
        retailPrice: item?.itemData.retailPrice,
        itemCost: (item[shortWeekdayName.toLocaleLowerCase()] * item?.itemData.wholeSalePrice).toFixed(2),
      };

      totalWeight += +updatedItem.weight;
      totalCost += +updatedItem.itemCost;
      totalPieces += updatedItem.quantity;
      return updatedItem;
    }));

    const filteredArray = updatedArray.filter(item => item !== null);

    if (filteredArray.length > 0) {
      deliveryCharges = cartObj.deliveryChargesType ? deliveryCharges : 0;
      await dbService.createMany(cartItem, filteredArray);
      totalCost = totalCost.toFixed(2);
      await dbService.update(cart, { id: cartObj.id }, {
        deliveryCharges,
        totalPieces,
        totalCost,
        totalWeight: totalWeight / 1000,
      });
      await dbService.update(cartItem, { cartId: cartObj.id }, { totalCost });
      return true;
    }
  } else {
    let deliveryCharges = 0;
    let totalCost = 0;
    let totalWeight = 0;
    if (cartItemData.length > 0){
      let updatedArray = cartItemData.map( item => {
        deliveryCharges = item.deliveryCharges; 
        let updatedItem = {
          adminId: cartObj.adminId,
          quantity: item[shortWeekdayName.toLocaleLowerCase()],
          itemGroupId: item.itemGroupId,
          itemId: item.itemId,
          customerId: item.customerId,
          cartId : cartObj.id,
          itemGroupName : item?.itemGroupData.name,
          itemName : item?.itemData.name,
          weight : item?.itemData.weight,
          legacyCode : item?.itemData.legacyCode,
          itemPrice : item?.itemData.wholeSalePrice,
          retailPrice : item?.itemData.retailPrice,
          itemCost : (item[shortWeekdayName.toLocaleLowerCase()] * item?.itemData.wholeSalePrice).toFixed(2),
        };
        totalWeight += +updatedItem.weight;
        totalCost += +updatedItem.itemCost;
    
        return updatedItem;
      });
      if ( updatedArray.length > 0){
        cartObj.deliveryChargesType ? deliveryCharges : 0;
        await dbService.createMany(cartItem, updatedArray);
        totalCost = totalCost.toFixed(2);
        await dbService.update(cart, { id: cartObj.id }, {
          deliveryCharges,
          totalCost,
          totalWeight:totalWeight / 1000,
        });
        await dbService.update(cartItem, { cartId:cartObj.id }, { totalCost });
       
        return true; 
      }
      return false; 
    }    
  }
}

function createUniqueString (date) {
  const prefix = Date.now().toString().slice(-4); // Get last 4 digits of current timestamp
  const newDate = new Date(date).toISOString().slice(0, 10).replace(/-/g, ''); // Format date to YYYYMMDD
  const suffix = Date.now().toString().slice(-2); // Get last 2 digits of current timestamp
  
  return `${prefix}-${newDate}-${suffix}`;
}
// const recurringOrder = async (req, res) => {
async function recurringOrder (){
  try {
    /* Get the current date */
    const currentDate = new Date();
    /* Get the next day's date */
    const nextDayDate = new Date(currentDate);
    nextDayDate.setDate(currentDate.getDate() + 2);
    /* Get the short weekday name */
    const shortWeekdayName = nextDayDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    /* Define the condition based on time */
    let whereCondition = {
      // adminId,
      [`${shortWeekdayName.toLocaleLowerCase()}.quantity`]: { [Op.gt]: 0 }
    };
    const getOrderCustomer = await order.findAll({
      where:whereCondition,
      include: [
        {
          model: orderItem,
          where:{ [`${shortWeekdayName.toLocaleLowerCase()}`]: { [Op.gt]: 0 } },
          as: 'orderItemData',
          attributes: ['itemGroupId','itemId',`${shortWeekdayName.toLocaleLowerCase()}`, 'customerId','deliveryCharges'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'retailPrice','legacyCode','weight'],
            },
          ],
        }
      ],
      attributes:['customerId','customerAddressId',`${shortWeekdayName.toLocaleLowerCase()}`, 'deliveryType','totalPieces','adminId'],
      
    });
   
    const cartArray = [];
    const longWeekdayName = nextDayDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (getOrderCustomer.length > 0 ){
      for (const element of getOrderCustomer) {
        const checkHoliday = await holiday.findOne({ 
          where: { 
            adminId:element.adminId,
            [Op.or]: [
              {
                startDate: { [Op.lte]: nextDayDate },
                endDate: { [Op.gte]: nextDayDate }     
              },
              {
                startDate: { [Op.lte]: nextDayDate },  
                endDate: { [Op.gte]: nextDayDate }
              }
            ]
          }
        });
        
        if (checkHoliday) {
          return true;
        } else {
          const getData = await getCustomerData(element.customerId, element.customerAddressId, longWeekdayName, element.adminId);
          const uniqueString = createUniqueString(nextDayDate);
          let cartOrder = {
            deliveryNumber:uniqueString,
            adminId:element.adminId,
            customerId:element.customerId,
            customerAddressId:element.customerAddressId,
            orderDate: currentDate,
            deliveryDate: nextDayDate,
            routeId: getData?.addressData?.weekData[0]?.routeId,
            routeName: getData?.addressData?.weekData[0]?.routeData.name,
            customerName:getData?.customerData?.legalName,
            customerFullAddress:getData?.addressData?.address1,
            customerTerms:getData?.customerData?.paymentTerms,
            terms:getData?.customerData?.paymentTerms,
            deliveryChargesType:element[shortWeekdayName.toLocaleLowerCase()].deliveryType,
            totalPieces:element[shortWeekdayName.toLocaleLowerCase()].quantity,
            deliveryType:element.deliveryType,
            ruleId:element.ruleId,
            ruleName:element.ruleName,
            rules:element.rules,
            rulesPrice:element.rulesPrice,
          };
          let createCartOrder = await cartOrderFun(cartOrder, element.orderItemData, shortWeekdayName);
          try {
            if (createCartOrder){
              cartArray.push(createCartOrder);
            }          
          } catch (error) {
            return cartArray;        
          }
        }
      }
      return cartArray;
    }
  } catch (error) {
    console.log('error:',error);
  }
};

const checkExistingCartOrder = async (customerId, customerAddressId, orderDate, adminId) => {
  let where = {
    customerId,
    deliveryDate:orderDate,
    customerAddressId,
    adminId
  };
  const existingCartOrder = await cart.findOne({ where: where });
  return existingCartOrder;
};

// Schedule a task to run every minute

/*
 * cron.schedule('27 18 * * *', async () => {
 *   try {
 *     console.log('Cron job triggered at 12:30 PM');
 *     const checkItem = await recurringOrder();      
 *   } catch (error) {
 *     console.log('error:', error);
 *   }
 * });
 */

// module.exports = { recurringOrder };