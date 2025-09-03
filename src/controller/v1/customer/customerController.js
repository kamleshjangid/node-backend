/**
 * customerController.js
 * @description :: exports customer methods
 */
const {
  order,
  customer,
  route,
  countries,
  state,
  item,
  user,
  customerAddress,
  week,
  customerWeek,
  deliveryRules,
  customerItem,
  orderItem,
  cart
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize 
} = require('sequelize');
const authConstant = require('@constants/authConstant');

const {
  capitalize, toLowerCase
} = require('@helpers/function');

/**
 * @description : add customer
 * @param {Object} req : request for customer
 * @param {Object} res : response for customer
 * @return {Object} : response for customer {status, message, data}
 */
const addCustomer = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body;

    if (!requestParam.legalName || !requestParam.email || !requestParam.tradingName) {
      return res.badRequest({ message: 'Insufficient request parameters! legalName, email, tradingName is required.' });
    }
    let where = { email: toLowerCase(requestParam.email) };
    where.adminId = adminId;
    if (requestParam.id) where.id = { [Op.ne]: requestParam.id };

    if (await customer.findOne({ where })) {
      return res.failure({ message: 'Email already exists' });
    }
    const dataToCreate = { ...requestParam };
    dataToCreate.email = toLowerCase(requestParam.email);
    dataToCreate.legalName = capitalize(requestParam.legalName);
    dataToCreate.tradingName = capitalize(requestParam.tradingName);
    dataToCreate.searchTradingName = toLowerCase(requestParam.tradingName);
    delete dataToCreate.routeId;

    if (requestParam.discount){
      if (+requestParam.discount < 0 || +requestParam.discount > 100) {
        return res.failure({ message: 'Discount amount must be between 0 and 100' });
      }      
    }
    const messageType = requestParam.id ? 'update' : 'insert';
    let token = '';
    if (requestParam.id) {
      await dbService.update(customer, { id: requestParam.id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(customer, dataToCreate);
      if (getData){
        const getItem = await item.findAll({
          where:{
            isDeleted: false,
            adminId 
          },
          attributes:[['id','itemId'],'itemGroupId']
        });
        const updatedItems = getItem.map(item => ({
          ...item.toJSON(),
          customerId: getData.id
        }));
        await dbService.createMany(customerItem, updatedItems);
        token = getData.id;
      }
    }

    return res.success({
      message: `Customer ${requestParam.id ? 'Updated' : 'Added'} Successfully`,
      data: {
        messageType,
        token
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : view customer data
 * @param {Object} req : request for customer
 * @param {Object} res : response for customer
 * @return {Object} : response for customer {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    const adminId = req.headers['admin-id'] || null;
    where.adminId = adminId;
    let getData = await customer.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: customerAddress,
          as: 'customerAddressData',
          attributes: [
            'id',
            [
              Sequelize.fn(
                'TRIM',
                Sequelize.fn(
                  'CONCAT',
                  Sequelize.fn('COALESCE', Sequelize.col('customerAddressData.address1'), ''),
                  Sequelize.literal(`
                CASE
                  WHEN "customerAddressData"."address2" IS NOT NULL AND "customerAddressData"."address2" != '' THEN CONCAT(' ', "customerAddressData"."address2")
                  ELSE ''
                END
              `),
                  Sequelize.literal(`
                CASE
                  WHEN "customerAddressData"."address3" IS NOT NULL AND "customerAddressData"."address3" != '' THEN CONCAT(' ', "customerAddressData"."address3")
                  ELSE ''
                END
              `),
                  '',
                  Sequelize.literal(`
                CASE
                  WHEN "customerAddressData->countryData"."countryName" IS NOT NULL THEN CONCAT(', ', "customerAddressData->countryData"."countryName")
                  ELSE ''
                END
              `),
                  ' ',
                  Sequelize.literal(`
                CASE
                  WHEN "customerAddressData->stateData"."stateName" IS NOT NULL THEN CONCAT(', ', "customerAddressData->stateData"."stateName")
                  ELSE ''
                END
              `),
                  Sequelize.literal(`
                  CASE
                    WHEN "customerAddressData"."cityName" IS NOT NULL AND "customerAddressData"."cityName" != '' THEN CONCAT(', ', "customerAddressData"."cityName")
                    ELSE ''
                  END
                `),
                  ' ',
                  Sequelize.fn('COALESCE', Sequelize.col('customerAddressData.postcode'), ''),
                  '.'
                )
              ),
              'fullAddress'
            ]
          ],
          
          include: [
            {
              model: countries,
              as: 'countryData',
              attributes: ['id', 'countryName']
            },
            {
              model: state,
              as: 'stateData',
              attributes: ['id', 'stateName']
            },
          ],
        }
      ],
      order: [
        ['customerAddressData','createdAt', 'DESC'],
      ],
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : manage customer status
 * @param {Object} req : request for customer
 * @param {Object} res : response for customer
 * @return {Object} : response for customer {status, message, data}
 */
const manageStatus = async (req, res) => {
  try {
    const {
      id, status
    } = req.body;
    if (!id || !status) {
      return res.badRequest({ message: 'Insufficient request parameters! id, status is required.' });
    }
    if (status == '0' || status == '1') {
      let where = { id };
      const adminId = req.headers['admin-id'] || null;
      where.adminId = adminId;
      let getData = await customer.findOne({ where });
      if (getData) {
        await dbService.update(customer, { id }, { isActive: status });
        return res.success({ message: `${status == 0 ? 'Inactive' : 'Active'} successfully` });
      } else {
        return res.recordNotFound();
      }
    } else {
      return res.failure({ message: 'Invalid status' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description handles customer list requests.
 * @param {Object} req - The request object for the customer.
 * @param {Object} res - The response object for the customer.
 * @return {Object} - The response object for the customer {status, message, data}.
 */
const customerList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    var rsData = req.body;
    let { options } = rsData;
    if (!options) {
      return res.badRequest({ message: 'Insufficient request parameters! options is required.' });
    }

    let dataToFind = rsData;
    let querOptions = {};
    querOptions.page = options.page;
    querOptions.paginate = options.paginate;
    let query = dataToFind.query;
    if (dataToFind.search) {
      const searchTerm = dataToFind.search.toLowerCase();
      query[Op.or] = {
        'searchTradingName': { [Op.like]: '%' + searchTerm + '%' },
        'email': { [Op.like]: '%' + searchTerm + '%' },
      };
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(customer, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'legalName', 'tradingName', 'legacyCode', 'mobileNumber', 'email', 'isActive', 'createdAt'];
    querOptions.include = [{
      model: customerAddress,
      as: 'customerAddressData',
      attributes: ['id']
    }];
    
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
      querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    } else { querOptions.sort = { 'tradingName': 1 }; }
    foundData = await dbService.paginate(customer, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Customer List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description Adds or updates customer addresses based on the provided request.
 * @param {Object} req - The request object containing customer address data.
 * @param {Object} res - The response object to be sent back.
 * @returns {Object} - The response object indicating success or failure and any relevant data.
 */
const updateStandingOrder = async (customerId, customerAddressId, weekName, type) => {  
  const shortWeekName = weekName.slice(0, 3).toLowerCase();  
  const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  if (!type) {
    const addressData = await customerAddress.findOne({ 
      where: { id: customerAddressId },
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
      ]
    });
  
    const orderCheck = await order.findOne({
      where: {
        customerId,
        customerAddressId,
      },
      attributes: ['id', 'customerId', 'customerAddressId', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],  // Access using the shortWeekName directly
      include: [
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'itemGroupId', 'itemId', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],  // Access the shortWeekName field dynamically
        }
      ]
    });
    if (orderCheck){
      const result = {
        customerId: customerId,
        customerAddressId: customerAddressId,
        itemData: orderCheck.orderItemData.map(item => {
        // Iterate over each weekday and apply the conditional logic for itemData
          const itemData = {};
          weekDays.forEach(day => {
            itemData[day] = shortWeekName === day ? null : item[day];
          });
          return {
            itemGroupId: item.itemGroupId,
            itemId: item.itemId,
            ...itemData
          };
        }),
        deliveryType: {
          mon: shortWeekName === 'mon' ? false : !!orderCheck.mon.deliveryType,
          tue: shortWeekName === 'tue' ? false : !!orderCheck.tue.deliveryType,
          wed: shortWeekName === 'web' ? false : !!orderCheck.wed.deliveryType,
          thu: shortWeekName === 'thu' ? false : !!orderCheck.thu.deliveryType,
          fri: shortWeekName === 'fri' ? false : !!orderCheck.fri.deliveryType,
          sat: shortWeekName === 'sat' ? false : !!orderCheck.sat.deliveryType,
          sun: shortWeekName === 'tue' ? false : !!orderCheck.sun.deliveryType,
        },
        standingOrderId: orderCheck.id
      };    
      // Process item data to update order items and calculate totals
      const resultData = await processItems(result.itemData, result.standingOrderId, customerId, customerAddressId, result.deliveryType, addressData);
      if (!resultData.success) {
        return false,
        console.log('Failed to update standing order item');
      }
      // Update order totals with the calculated values from processItems
      await updateOrder(result.standingOrderId, resultData.totals, result.deliveryType, addressData);
      return true;
    }
  }
  return true;
};
const processItems = async (itemData, cartId, customerId, customerAddressId, deliveryType, addressData) => {
  let totals = initializeTotals();
  for (const item of itemData) {
    const createdCartItem = await createOrUpdateCartItem(cartId, item, customerId, customerAddressId, addressData, deliveryType);
    if (!createdCartItem) return { success: false };
    updateTotals(totals, createdCartItem, item, deliveryType, addressData);
  }

  return {
    success: true,
    totals 
  };
};
const createOrUpdateCartItem = async (orderId, cartOrderItem, customerId, customerAddressId, addressData, deliveryType) => {
  const getItemData = await item.findOne({ where: { id: cartOrderItem.itemId } });
  if (!getItemData) return null;

  const existingCartItem = await orderItem.findOne({
    where: {
      orderId,
      itemId: cartOrderItem.itemId,
      itemGroupId: cartOrderItem.itemGroupId 
    } 
  });

  const monRetail = getItemData.retailPrice * cartOrderItem.mon;
  const tueRetail = getItemData.retailPrice * cartOrderItem.tue;
  const wedRetail = getItemData.retailPrice * cartOrderItem.wed;
  const thuRetail = getItemData.retailPrice * cartOrderItem.thu;
  const friRetail = getItemData.retailPrice * cartOrderItem.fri;
  const satRetail = getItemData.retailPrice * cartOrderItem.sat;
  const sunRetail = getItemData.retailPrice * cartOrderItem.sun;

  const monCostPrice = getItemData.wholeSalePrice * cartOrderItem.mon;
  const tueCostPrice = getItemData.wholeSalePrice * cartOrderItem.tue;
  const wedCostPrice = getItemData.wholeSalePrice * cartOrderItem.wed;
  const thuCostPrice = getItemData.wholeSalePrice * cartOrderItem.thu;
  const friCostPrice = getItemData.wholeSalePrice * cartOrderItem.fri;
  const satCostPrice = getItemData.wholeSalePrice * cartOrderItem.sat;
  const sunCostPrice = getItemData.wholeSalePrice * cartOrderItem.sun;
  const calQty = (cartOrderItem.mon + cartOrderItem.tue + cartOrderItem.wed + cartOrderItem.thu + cartOrderItem.fri + cartOrderItem.sat + cartOrderItem.sun);
  let deliveryCharges = 0;

  let newItem = {
    ...cartOrderItem,
    orderId,
    customerAddressId,
    customerId,
    mon: cartOrderItem.mon,
    tue: cartOrderItem.tue,
    wed: cartOrderItem.wed,
    thu: cartOrderItem.thu,
    fri: cartOrderItem.fri,
    sat: cartOrderItem.sat,
    sun: cartOrderItem.sun,
    itemCost: (monCostPrice + tueCostPrice + wedCostPrice + thuCostPrice + friCostPrice + satCostPrice + sunCostPrice),
    retailCost: (monRetail + tueRetail + wedRetail + thuRetail + friRetail + satRetail + sunRetail),
    totalQuantity: calQty
  };

  if (existingCartItem) {
    // Fetch all items for the given orderId
    const getCartOrder = await orderItem.findAll({
      where: { orderId },
      attributes: ['id', 'itemId', 'itemGroupId']  // Ensure 'id' is included
    });    
    const cartItemGroupId = cartOrderItem.itemGroupId;
    const cartItemId = cartOrderItem.itemId;

    /*
     * Filter items with either:
     * 1. Same itemGroupId but different itemId
     * 2. Different itemGroupId and different itemId
     */
    const nonMatchingObjects = getCartOrder.filter(item => 
      (item.itemGroupId === cartItemGroupId && item.itemId !== cartItemId) || 
      (item.itemGroupId !== cartItemGroupId && item.itemId !== cartItemId)
    );
    // Extract IDs of the non-matching items
    const ids = nonMatchingObjects.map(item => item.id);  // Now ids should be correctly defined
    
    if (ids.length > 0) {
      // Delete non-matching items
      await orderItem.destroy({ where: { id: ids } });
    }

    // Update the existing item with the new details
    await dbService.update(orderItem, { id: existingCartItem.id }, newItem);
  }

  else {
    /* Create new item */
    await dbService.createOne(orderItem, newItem);
  }
  
  newItem.monCostPrice = monCostPrice;
  newItem.tueCostPrice = tueCostPrice;
  newItem.wedCostPrice = wedCostPrice;
  newItem.thuCostPrice = thuCostPrice;
  newItem.friCostPrice = friCostPrice;
  newItem.satCostPrice = satCostPrice;
  newItem.sunCostPrice = sunCostPrice;

  newItem.monRetail = monRetail;
  newItem.tueRetail = tueRetail;
  newItem.wedRetail = wedRetail;
  newItem.thuRetail = thuRetail;
  newItem.friRetail = friRetail;
  newItem.satRetail = satRetail;
  newItem.sunRetail = sunRetail;

  return newItem;
};

const updateTotals = (totals, createdCartItem, item, deliveryType, addressData) => {
  totals.totalCost += createdCartItem.itemCost;
  totals.totalRetailCost += createdCartItem.retailCost;
  totals.monQty += item.mon;
  totals.tueQty += item.tue;
  totals.wedQty += item.wed;
  totals.thuQty += item.thu;
  totals.friQty += item.fri;
  totals.satQty += item.sat;
  totals.sunQty += item.sun;
  
  totals.monCost += createdCartItem.monCostPrice;
  totals.tueCost += createdCartItem.tueCostPrice;
  totals.wedCost += createdCartItem.wedCostPrice;
  totals.thuCost += createdCartItem.thuCostPrice;
  totals.friCost += createdCartItem.friCostPrice;
  totals.satCost += createdCartItem.satCostPrice;
  totals.sunCost += createdCartItem.sunCostPrice;
  
  totals.monRetailCost += createdCartItem.monRetail;
  totals.tueRetailCost += createdCartItem.tueRetail;
  totals.wedRetailCost += createdCartItem.wedRetail;
  totals.thuRetailCost += createdCartItem.thuRetail;
  totals.friRetailCost += createdCartItem.friRetail;
  totals.satRetailCost += createdCartItem.satRetail;
  totals.sunRetailCost += createdCartItem.sunRetail;
  
  let calPic = (item.mon + item.tue + item.wed + item.thu + item.fri + item.sat + item.sun);
  totals.totalPieces += calPic;

  totals.mon = {
    quantity: totals.monQty,
    costPerDay: totals.monCost,
    deliveryType: deliveryType.mon,
    costPerDayWithDelivery: totals.monCost,
    retailValuePerDay: totals.monRetailCost,
  };
  
  totals.tue = {
    quantity: totals.tueQty,
    costPerDay: totals.tueCost,
    deliveryType: deliveryType.tue,
    costPerDayWithDelivery: totals.tueCost,
    retailValuePerDay: totals.tueRetailCost,
  };
  
  totals.wed = {
    quantity: totals.wedQty,
    costPerDay: totals.wedCost,
    deliveryType: deliveryType.wed,
    costPerDayWithDelivery: totals.wedCost,
    retailValuePerDay: totals.wedRetailCost,
  };
  
  totals.thu = {
    quantity: totals.thuQty,
    costPerDay: totals.thuCost,
    deliveryType: deliveryType.thu,
    costPerDayWithDelivery: totals.thuCost,
    retailValuePerDay: totals.thuRetailCost,
  };
  
  totals.fri = {
    quantity: totals.friQty,
    costPerDay: totals.friCost,
    deliveryType: deliveryType.fri,
    costPerDayWithDelivery: totals.friCost,
    retailValuePerDay: totals.friRetailCost,
  };
  
  totals.sat = {
    quantity: totals.satQty,
    costPerDay: totals.satCost,
    deliveryType: deliveryType.sat,
    costPerDayWithDelivery: totals.satCost,
    retailValuePerDay: totals.satRetailCost,
  };
  
  totals.sun = {
    quantity: totals.sunQty,
    costPerDay: totals.sunCost,
    deliveryType: deliveryType.sun,
    costPerDayWithDelivery: totals.sunCost,
    retailValuePerDay: totals.sunRetailCost,
  };
  let totalDeliveryCharges = 0;
  let deliveryCharges = 0;
  
  if (authConstant.DELIVERY_TYPE.delivery_price == addressData.deliveryType){
    totals.deliveryType = authConstant.DELIVERY_TYPE.delivery_price;
    deliveryCharges = addressData.deliveryPrice;
    totals.ruleId = null;
    totals.ruleName = null;
    totals.rules = null;

  } else if (authConstant.DELIVERY_TYPE.delivery_price_rule === addressData.deliveryType){
    deliveryCharges = null;
    totals.deliveryType = authConstant.DELIVERY_TYPE.delivery_price_rule;
    totals.ruleId = addressData.deliveryRulesData.id;
    totals.ruleName = addressData.deliveryRulesData.ruleName;
    totals.rules = addressData.deliveryRulesData.rules;

    const ruless = addressData.deliveryRulesData.rules;
    ruless.sort((a, b) => a.largerPrice - b.largerPrice);
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    days.forEach(day => {
      const costPrice = totals[`${day}Cost`];
      if (totals[day].deliveryType){
        /*
         *         ruless.forEach((rule, index) => {
         *         if (index === 0) {
         *          if (ruless[index + 1]) {
         *            // Check if costPrice is less than the next rule's largerPrice and greater than or equal to the current rule's largerPrice
         *            if (+costPrice < +ruless[index + 1].largerPrice && +costPrice >= +rule.largerPrice) {
         *              deliveryCharges = rule.price;
         *              totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
         *            }
         *          } else {
         *            // If there's no next rule, just check if costPrice is less than the current rule's largerPrice
         *            if (+costPrice < +rule.largerPrice) {
         *              deliveryCharges = rule.price;
         *              totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
         *            }
         *          }
         *         } else if (index > 0 && index < ruless.length - 1) {
         *          // Check if costPrice is between the current rule's and the next rule's largerPrice
         *          if (+costPrice < +rule.largerPrice && +costPrice >= +ruless[index - 1].largerPrice) {
         *            deliveryCharges = rule.price;
         *            totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
         *          }
         *         } else if (index === ruless.length - 1) {
         *          // For the last rule, check if costPrice is less than the current rule's largerPrice
         *          if (+costPrice < +rule.largerPrice && +costPrice >= +ruless[index - 1].largerPrice) {
         *            deliveryCharges = rule.price;
         *            totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
         *          }
         *         }
         *         
         *         totalDeliveryCharges += deliveryCharges;
         *         });  
         */       
        ruless.forEach((rule, index) => {
          if (index === 0) {
            if (ruless[index + 1]) {
              // Check if costPrice is greater than or equal to the current rule's largerPrice and less than the next rule's largerPrice
              if (+costPrice >= +rule.largerPrice && +costPrice < +ruless[index + 1].largerPrice) {
                deliveryCharges = rule.price;
                totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
              }
            } else {
              // If there's no next rule, just check if costPrice is greater than or equal to the current rule's largerPrice
              if (+costPrice >= +rule.largerPrice) {
                deliveryCharges = rule.price;
                totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
              }
            }
          } else if (index > 0 && index < ruless.length - 1) {
            // Check if costPrice is between the previous rule's largerPrice and the current rule's largerPrice
            if (+costPrice >= +ruless[index - 1].largerPrice && +costPrice < +rule.largerPrice) {
              deliveryCharges = rule.price;
              totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
            }
          } else if (index === ruless.length - 1) {
            // For the last rule, check if costPrice is greater than or equal to the current rule's largerPrice
            if (+costPrice >= +ruless[index - 1].largerPrice) {
              deliveryCharges = rule.price;
              totals[day].costPerDayWithDelivery = costPrice + (totals[day].deliveryType && deliveryType[day] ? +rule.price : 0);
            }
          }
        
          totalDeliveryCharges += deliveryCharges;
        });
      }      
    });     
  } else { /*  else part is free delivery */
    totals.deliveryType = authConstant.DELIVERY_TYPE.free_delivery;
    totals.ruleId = null;
    totals.ruleName = null;
    totals.rules = null;

    deliveryCharges = 0;
  }
  totals.rulesPrice = deliveryCharges;
  totals.deliveryCharges = totalDeliveryCharges;
};
const initializeTotals = () => ({
  totalCost: 0,
  totalPieces: 0,
  totalRetailCost: 0,
  monQty: 0,
  tueQty: 0,
  wedQty: 0,
  thuQty: 0,
  friQty: 0,
  satQty: 0,
  sunQty: 0,
  monCost: 0,
  tueCost: 0,
  wedCost: 0,
  thuCost: 0,
  friCost: 0,
  satCost: 0,
  sunCost: 0,
  monRetailCost: 0,
  tueRetailCost: 0,
  wedRetailCost: 0,
  thuRetailCost: 0,
  friRetailCost: 0,
  satRetailCost: 0,
  sunRetailCost: 0,
});

const updateOrder = async (orderId, totals, deliveryType, addressData) => {
  await dbService.update(order, { id: orderId }, {
    itemCost: totals.totalCost,
    totalCost: totals.totalCost + totals.deliveryCharges,
    totalPieces: totals.totalPieces,
    totalRetailCost: totals.totalRetailCost,
    deliveryCharges: totals.deliveryCharges,
    deliveryType: totals.deliveryType,
    rulesPrice: totals.rulesPrice,
    ruleId: totals.ruleId,
    ruleName: totals.ruleName,
    rules: totals.rules,
    mon: totals.mon,
    tue: totals.tue,
    wed: totals.wed,
    thu: totals.thu,
    fri: totals.fri,
    sat: totals.sat,
    sun: totals.sun,
  });
};

const insertDeliveryDays = async (body, customerAddressId, customerId) => {
  
  if (!body.weekData || body.weekData.length === 0) return;
  const dataArray = [];
  for (const data of body.weekData) {
    const existingRecord = await customerWeek.findOne({
      where: {
        customerAddressId,
        customerId,
        weekDayId: data.weekDayId
      },
      include: [
        {
          model: week,
          as: 'weekData',
          attributes: ['id', 'name']
        },
      ]
    });
    if (existingRecord) {
      await dbService.update(customerWeek, {
        customerAddressId,
        customerId,
        weekDayId: data.weekDayId
      }, {
        type: data.type,
        routeId:data.routeId ? data.routeId : null,
        routeType:data.routeType ? data.routeType : false,
      });
      await updateStandingOrder(customerId, customerAddressId, existingRecord?.weekData?.name, data.type);
    } else {
      dataArray.push({
        customerAddressId,
        customerId,
        weekDayId: data.weekDayId,
        type: data.type,
        routeId:data.routeId ? data.routeId : null,
        routeType:data.routeType ? data.routeType : false,  
      });
    }
  }
  dataArray.length > 0 && await dbService.createMany(customerWeek, dataArray);

};
const addCustomerAddress = async (req, res) => {
  try {
    const requestParam = req.body;
    const updateParam = { ...requestParam };
    if (!requestParam.address1 || !requestParam.customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! address1, customerId is required.' });
    }
    if (!requestParam.weekData || requestParam.weekData.length == 0) {
      return res.badRequest({ message: 'Insufficient request parameters! week day is required.' });
    }
    const hasTrueType = requestParam.weekData.some(item => item.type === true);

    if (!hasTrueType) {
      return res.badRequest({ message: 'Please select at least one delivery day' });
    }

    const hasTrueRouteId = requestParam.weekData.some(item => item.routeId !== null && item.routeId !== '');

    if (!hasTrueRouteId) {
      return res.badRequest({ message: 'Please select at least one route' });
    }

    if (requestParam.deliveryType && requestParam.deliveryType == 'Delivery Price Rule') {
      if (!requestParam.deliveryRuleId) {
        return res.badRequest({ message: 'Please select delivery rule id.' });
      }
    }

    const dataToCreate = { ...updateParam };
    dataToCreate.address1 = updateParam.address1 ? capitalize(updateParam.address1) : '';
    dataToCreate.address2 = updateParam.address2 ? capitalize(updateParam.address2) : '';
    dataToCreate.address3 = updateParam.address3 ? capitalize(updateParam.address3) : '';
    dataToCreate.cityName = updateParam.cityName ? capitalize(updateParam.cityName) : '';
    delete updateParam.weekData;
    if (updateParam.deliveryType == 'Delivery Price Rule') {
      updateParam.deliveryPrice = null;
    } else if (updateParam.deliveryType == 'Delivery Price'){
      updateParam.deliveryRuleId = null;
    } else {
      updateParam.deliveryPrice = null;
      updateParam.deliveryRuleId = null;
    }

    const messageType = requestParam.id ? 'update' : 'insert';
    let token = '';
    if (requestParam.id) {
      await dbService.update(customerAddress, { id: requestParam.id }, updateParam);
      await insertDeliveryDays(requestParam, requestParam.id, requestParam.customerId);

    } else {
      const checkAddress = await customerAddress.findOne({ where:{ customerId:requestParam.customerId } });    
      if (!checkAddress){
        updateParam.defaultAddress = true;
      }
      if (updateParam.defaultAddress){
        // Reset all addresses for the customer to non-default
        await dbService.update(customerAddress, { customerId:requestParam.customerId, }, { defaultAddress: false });
      }
  
      let getData = await dbService.createOne(customerAddress, updateParam);

      if (getData) {
        await insertDeliveryDays(requestParam, getData.id, requestParam.customerId);
        token = getData.id;
      }
    }

    return res.success({
      message: `Customer Address ${requestParam.id ? 'Updated' : 'Added'} Successfully`,
      data: {
        messageType,
        token
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description Retrieves customer address data based on the provided customer ID.
 * @param {Object} req - The request object containing the customer ID.
 * @param {Object} res - The response object to be sent back.
 * @returns {Object} - The response object containing customer address data.
 */
const getCustomerAddress = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId is required.' });
    }
    let where = { customerId: customerId };
    const customerData = await customer.findOne({
      where: { id: customerId },
      attributes:[['tradingName','legalName']] 
    });
    const getData = await customerAddress.findAll({
      where: where,
      attributes: ['id', 'address1', 'address2', 'defaultAddress', 'address3', 'cityName', 'postcode','deliveryType','deliveryPrice','deliveryRuleId'],
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName']
        },
        {
          model: countries,
          as: 'countryData',
          attributes: ['id', 'countryName']
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['id', 'stateName']
        },
        {
          model: customerWeek,
          as: 'weekData',
          attributes: ['weekDayId', 'type'],
          include: [
            {
              model: week,
              as: 'weekData',
              attributes: ['name','displayOrder']
            },
          ]
        },
        {
          model: order,
          as: 'orderData',
          attributes: ['id']
        },

      ],
      order: [
        ['createdAt', 'ASC'],
      ],
    });
    return res.success({
      data: {
        customerName: customerData.legalName,
        getData,
      },
      message: 'Customer Address Data'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description Retrieves customer details based on the provided customer ID.
 * @param {Object} req - The request object containing the customer ID in parameters.
 * @param {Object} res - The response object to be sent back.
 * @returns {Object} - The response object containing customer details.
 */
const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await customerAddress.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName']
        },
        {
          model: countries,
          as: 'countryData',
          attributes: ['id', 'countryName']
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['id', 'stateName']
        },
        {
          model: customerWeek,
          where:{ customerAddressId:id },
          as: 'weekData',
          attributes: ['weekDayId', 'type','routeId','routeType'],
          include: [
            {
              model: week,
              as: 'weekData',
              attributes: ['name', 'displayOrder'],
              order: [['displayOrder', 'ASC']]
            },
          ]
        },
      ],
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message: 'Customer address not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description Deletes a customer address based on the provided address ID.
 * @param {Object} req - The request object containing the address ID in parameters.
 * @param {Object} res - The response object to be sent back.
 * @returns {Object} - The response object indicating success or failure.
 */
const deleteCustomerAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await customerAddress.findOne({ where });
    if (getData) {
      try {
        if ( await customerAddress.destroy({ where: where }) ){
          if (await customerWeek.findOne({ where: { customerAddressId: id } })){
            await customerWeek.destroy({ where: { customerAddressId: id } });
          }
        }
      } catch (error) {
        return res.failure({ message: `Address deletion failed: it's used in an order.` });        
      }
      
      return res.success({ message: 'Customer Address Deleted ' });
    } else {
      return res.recordNotFound({ message: 'Invalid Address Id' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get week list 
 * @param {Object} req : request for week
 * @param {Object} res : response for week
 * @return {Object} : response for week { data}
 */
const getWeekList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    let where = {
      type: true,
      adminId 
    };
    const getData = await week.findAll({
      where: where,
      attributes: [['id', 'weekDayId'], 'name','displayOrder'],
      order: [
        ['displayOrder', 'ASC'],
      ],
    });
    return res.success({
      data: getData,
      message: 'Week List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCustomerRouteList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      id, addressId 
    } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    const getCustomerData = await customer.findOne({
      where: { id },
      attributes:['id',['tradingName','legalName']] 
    });
    if (!getCustomerData) {
      return res.failure({ message: 'Customer not found..' });
    }
    let where = {
      adminId,
      isActive:true,  
    };
    if (addressId){
      where = { adminId };
    }
    const getData = await route.findAll({
      where,
      attributes: ['id','name'],
      order: [
        ['name', 'ASC'],
      ], 
    });    
    return res.success({
      data: {
        customerName: getCustomerData.legalName,
        getData
      },
      message: 'Customer Route List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getDeliveryRuleList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await deliveryRules.findAll({
      where:{ adminId },
      attributes: ['id','ruleName'],
      order: [
        ['ruleName', 'ASC'],
      ],
    });
    return res.success({
      data: getData,
      message: 'Delivery Rules List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const customerStandingOrder = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      customerId, customerAddressId 
    } = req.body;
    if (!customerId || !customerAddressId || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId, customerAddressId , adminId is required.' });
    }
    let where = {
      customerId,
      customerAddressId,
      adminId
    };  
    const existingCartOrder = await order.findOne({ where });
    if (existingCartOrder) {
      return res.success({
        data: {
          customerId,
          customerAddressId,
          orderId:existingCartOrder.id
        },
        message: 'Order Data'
      });
    }
    return res.recordNotFound({ message:'Order not found' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const {
      addressId, customerId 
    } = req.body;

    if (!addressId || !customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! addressId, customerId are required.' });
    }

    // Reset all addresses for the customer to non-default
    await dbService.update(customerAddress, { customerId, }, { defaultAddress: false });

    // Set the selected address as default
    const updatedAddress = await dbService.update(
      customerAddress, 
      {
        id: addressId,
        customerId,
      }, 
      { defaultAddress: true }
    );

    if (updatedAddress) {
      return res.success({ message: 'Default address set successfully.' });
    } else {
      return res.recordNotFound();
    }

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCustomerOrder = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    var rsData = req.body;
    let { options } = rsData;
    if (!options) {
      return res.badRequest({ message: 'Insufficient request parameters! options is required.' });
    }

    let dataToFind = rsData;
    let querOptions = {};
    querOptions.page = options.page;
    querOptions.paginate = options.paginate;
    let query = dataToFind.query;
    if (dataToFind.search) {
      query[Op.or] = {
        'legalName': { [Op.like]: '%' + dataToFind.search + '%' },
        'email': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }
    if (query.customerId){
      query.customerId = query.customerId;
    } else {
      query.customerId = null;
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(cart, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'deliveryNumber', 'invoiceNumber', 'customerFullAddress', 'deliveryCharges','totalPieces','totalWeight', 'totalCost', 'deliveryDate'];
    querOptions.sort = { 'createdAt': -1 };
    foundData = await dbService.paginate(cart, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Order List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getAddressList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { customerId } = req.body;
    const getData = await customerAddress.findAll({
      where: {
        adminId,
        customerId 
      },
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
          'customerFullAddress'
        ]
      ],
      include: [
        {
          model: countries,
          as: 'countryData',
          attributes: ['id', 'countryName']
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['id', 'stateName']
        },
      ],
    });
    if (getData.length == 0){
      return res.recordNotFound({ message: 'address not found.' });
    }
    return res.success({
      data: getData,
      message: 'Customer Address List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  setDefaultAddress,
  addCustomer,
  getDetails,
  manageStatus,
  customerList,
  addCustomerAddress,
  getCustomerAddress,
  getCustomerDetails,
  deleteCustomerAddress,
  getWeekList,
  getCustomerRouteList,
  getDeliveryRuleList,
  customerStandingOrder,
  getCustomerOrder,
  getAddressList
};