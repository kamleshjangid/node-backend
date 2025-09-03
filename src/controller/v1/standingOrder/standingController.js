/**
 * cartController.js
 * @description :: exports cartController methods
 */
const authService = require('@services/auth');
const {
  customer, order, orderItem, item, itemGroup, customerAddress, countries, state, customerWeek, week, customerItem, deliveryRules
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize, col, fn
} = require('sequelize');
const authConstant = require('@constants/authConstant');

const getCustomerList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const customerList = await customer.findAll({
      where: {
        isActive: true,
        isDeleted: false,
        adminId,
      },
      attributes: ['id', ['tradingName', 'legalName'], 'legacyCode'],
      include: [
        {
          model: customerAddress,
          as: 'customerAddressData',
          attributes: ['id'],
        }
      ],
      order: [['tradingName', 'ASC']],
    });
    if (customerList.length > 0) {
      return res.success({ data: customerList });
    } else {
      return res.recordNotFound({ message: 'No customers found without standing orders' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCustomerAddress = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId is required.' });
    }

    // Fetch customer addresses
    const getData = await customerAddress.findAll({
      where: { customerId },
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
        {
          model: countries,
          as: 'countryData',
          attributes: ['id', 'countryName'],
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['id', 'stateName'],
        },
        {
          model: customerWeek,
          as: 'weekData',
          attributes: ['weekDayId', 'type'],
          include: [
            {
              model: week,
              as: 'weekData',
              attributes: ['name', 'displayOrder'],
              order: [['displayOrder', 'ASC']],
            },
          ],
        },
        {
          model: order,
          as: 'orderData',
          attributes: ['id']
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (getData.length > 0) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message: 'No address found without standing orders' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getItemList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId is required.' });
    }
    let where = {
      isActive: true,
      isDeleted: false,
      customerId,
    };
    let itemType = false;
    const checkItem = await item.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: itemGroup,
          as: 'itemGroupData',
          attributes: ['id', 'name']
        },
        {
          required: false,
          where: {
            customerId,
            adminId
          },
          model: customerItem,
          as: 'customerItemData',
          attributes: [],
        }
      ],
      where: {
        isDeleted: false,
        adminId,
        [Op.or]: [
          { '$customerItemData.itemId$': { [Op.ne]: Sequelize.col('items.id') } },
          { '$customerItemData.itemId$': { [Op.eq]: null } }
        ]

      },
      order: [
        ['name', 'ASC'],
      ],
    });
    if (checkItem.length > 0) {
      itemType = true;
    }
    const getData = await customerItem.findAll({
      where,
      include: [
        {
          model: item,
          as: 'itemData',
          attributes: [],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name']
            },
          ]
        }
      ],
      attributes: [
        [Sequelize.col('itemData.id'), 'id'],
        [Sequelize.col('itemData.itemGroupData.id'), 'itemGroupId'],
        [Sequelize.col('itemData.name'), 'name'],
        [Sequelize.col('itemData.itemGroupData.name'), 'itemGroupName'],
        [Sequelize.col('itemData.wholeSalePrice'), 'wholeSalePrice'],
        [Sequelize.col('itemData.retailPrice'), 'retailPrice'],
        [Sequelize.col('itemData.minOrder'), 'minOrder'],
        [Sequelize.col('itemData.maxOrder'), 'maxOrder'],
        [Sequelize.col('itemData.gstPercentage'), 'gstPercentage'],
      ],
      order: [[{
        model: item,
        as: 'itemData'
      }, 'name', 'ASC']]
    });
    if (getData) {
      return res.success({
        data: {
          getData,
          itemType
        }
      });
    } else {
      return res.recordNotFound({ message: 'Items not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      itemId, mon, tue, wed, thu, fri, sat, sun, customerAddressId
    } = req.body;
    if (!itemId || !customerAddressId) {
      return res.badRequest({ message: 'Insufficient request parameters! itemId is required.' });
    }

    let where = {
      id: itemId,
      isActive: true,
      isDeleted: false
    };

    let getData = await item.findOne({
      where,
      attributes: ['id', 'name', 'wholeSalePrice', 'retailPrice', 'legacyCode'],
      include: [
        {
          model: itemGroup,
          as: 'itemGroupData',
          attributes: ['id', 'name']
        },
      ],
    });
    const customerWeekData = await week.findAll({
      where: { adminId },
      include: [
        {
          required: false,
          model: customerWeek,
          as: 'customerWeekData',
          attributes: ['id', 'type'],
          where: { customerAddressId },
        }
      ],
      attributes: [['id', 'weekDayId'], 'name',],
      order: [['displayOrder', 'ASC']]
    });
    if (getData) {
      delete req.body.itemId;
      delete req.body.customerAddressId;
      return res.success({
        data: {
          ...req.body,
          customerWeekData,
          getData
        }
      });
    } else {
      return res.recordNotFound({ message: 'Items not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

async function checkDuplicateItems (cartOrderItem) {
  if (cartOrderItem.length > 0) {
    const seenItems = new Map();
    for (let i = 0; i < cartOrderItem.length; i++) {
      const {
        itemId, itemGroupId
      } = cartOrderItem[i];

      // Construct key using item and item group IDs
      const key = `${itemId}-${itemGroupId}`;

      // Check for duplicates
      if (seenItems.has(key)) {
        const prevIndex = seenItems.get(key);
        return {
          duplicate: true,
          itemId: itemId,
          itemGroupId: itemGroupId,
          currentIndex: i + 1,
          prevIndex: prevIndex + 1
        };
      }
      seenItems.set(key, i);
    }
  }
  return { duplicate: false };
}

/*
 * const createCartItem = async (orderId, cartOrderItem, customerId, customerAddressId) => {
 * const getItemData = await item.findOne({ where: { id: cartOrderItem.itemId } });
 * if (!getItemData) return null;
 * const monRetail = getItemData.retailPrice * cartOrderItem.mon;
 * const tueRetail = getItemData.retailPrice * cartOrderItem.tue;
 * const wedRetail = getItemData.retailPrice * cartOrderItem.wed;
 * const thuRetail = getItemData.retailPrice * cartOrderItem.thu;
 * const friRetail = getItemData.retailPrice * cartOrderItem.fri;
 * const satRetail = getItemData.retailPrice * cartOrderItem.sat;
 * const sunRetail = getItemData.retailPrice * cartOrderItem.sun;
 * 
 * const monCostPrice = getItemData.wholeSalePrice * cartOrderItem.mon;
 * const tueCostPrice = getItemData.wholeSalePrice * cartOrderItem.tue;
 * const wedCostPrice = getItemData.wholeSalePrice * cartOrderItem.wed;
 * const thuCostPrice = getItemData.wholeSalePrice * cartOrderItem.thu;
 * const friCostPrice = getItemData.wholeSalePrice * cartOrderItem.fri;
 * const satCostPrice = getItemData.wholeSalePrice * cartOrderItem.sat;
 * const sunCostPrice = getItemData.wholeSalePrice * cartOrderItem.sun;
 * const calQty = (cartOrderItem.mon + cartOrderItem.tue + cartOrderItem.wed + cartOrderItem.thu + cartOrderItem.fri + cartOrderItem.sat + cartOrderItem.sun);
 * let newItem = {
 *  ...cartOrderItem,
 *  orderId,
 *  customerAddressId,
 *  customerId,
 *  mon: cartOrderItem.mon,
 *  tue: cartOrderItem.tue,
 *  wed: cartOrderItem.wed,
 *  thu: cartOrderItem.thu,
 *  fri: cartOrderItem.fri,
 *  sat: cartOrderItem.sat,
 *  sun: cartOrderItem.sun,
 *  itemCost: (monCostPrice + tueCostPrice + wedCostPrice + thuCostPrice + friCostPrice + satCostPrice + sunCostPrice),
 *  totalQuantity: calQty
 * };
 * dbService.createOne(orderItem, newItem);
 * newItem.monCostPrice = monCostPrice;
 * newItem.tueCostPrice = tueCostPrice;
 * newItem.wedCostPrice = wedCostPrice;
 * newItem.thuCostPrice = thuCostPrice;
 * newItem.friCostPrice = friCostPrice;
 * newItem.satCostPrice = satCostPrice;
 * newItem.sunCostPrice = sunCostPrice;
 * 
 * newItem.monRetail = monRetail;
 * newItem.tueRetail = tueRetail;
 * newItem.wedRetail = wedRetail;
 * newItem.thuRetail = thuRetail;
 * newItem.friRetail = friRetail;
 * newItem.satRetail = satRetail;
 * newItem.sunRetail = sunRetail;
 * return newItem;
 * }; 
 */

const checkExistingCartOrder = async (customerId, customerAddressId, standindOrderId) => {
  let where = { customerId };
  if (standindOrderId) {
    where.id = { [Op.ne]: standindOrderId };
  }

  const existingCartOrder = await order.findOne({ where });
  if (existingCartOrder) {
    return false;
  }
  return true;
};

const submitStandingOrder = async (req, res) => {
  try {
    const {
      customerId, customerAddressId, itemData, deliveryType, standingOrderId
    } = req.body;
    if (!customerId || !customerAddressId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId, customerAddressId is required.' });
    }

    /*
     *     if (!itemData || itemData.length == 0) {
     *     return res.badRequest({ message: 'Insufficient request parameters! item data is required.' });
     *     } 
     */

    const customerData = await customer.findOne({ where: { id: customerId } });
    if (!customerData) return res.failure({ message: 'Customer not found' });

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

    if (!addressData) return res.failure({ message: 'Customer Address not found' });

    // Check for duplicate items
    const duplicateItems = await checkDuplicateItems(itemData);
    if (duplicateItems.duplicate) {
      return res.failure({ message: `Duplicate items detected: ${duplicateItems.itemId} and ${duplicateItems.itemGroupId} at row ${duplicateItems.currentIndex}. Previous occurrence at row ${duplicateItems.prevIndex}.` });
    }

    if (!await checkExistingCartOrder(customerId, customerAddressId, standingOrderId)) {
      return res.failure({ message: 'Standing order already exists.' });
    }

    let cartOrder = {
      customerId,
      customerAddressId
    };
    let message = 'Added';
    let messageType = 'insert';
    let createdCart = {};

    if (standingOrderId) {
      // Update existing order
      const updateResult = await updateStandingOrder(standingOrderId, customerId, customerAddressId, itemData, deliveryType, addressData);
      if (!updateResult.success) {
        return res.failure({ message: updateResult.message });
      }
      createdCart.id = standingOrderId;
      message = 'Updated';
      messageType = 'update';
    } else {
      // Create new order
      createdCart = await dbService.createOne(order, cartOrder);
      if (!createdCart) {
        return res.failure({ message: 'Failed to create standing order' });
      }

      // Process items for new order
      const result = await processItems(itemData, createdCart.id, customerId, customerAddressId, deliveryType, addressData);
      if (!result.success) {
        await orderItem.destroy({ where: { cartId: createdCart.id } });
        await order.destroy({ where: { id: createdCart.id } });
        return res.failure({ message: 'Failed to create standing order item' });
      }

      await updateOrder(createdCart.id, result.totals, deliveryType, addressData);
    }
    let getData = await order.findOne({
      where: { id: createdCart.id },
      attributes: ['id', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalPieces', 'totalCost', 'deliveryCharges', 'totalRetailCost', ['rulesPrice', 'deliveryPrice'], 'deliveryType'],
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', 'legalName', 'legacyCode'],
        },
        {
          model: customerAddress,
          as: 'customerAddressData',
          attributes: ['id', 'address1', 'address1', 'address3', 'postcode', 'deliveryPrice', 'deliveryType'],
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
            {
              model: deliveryRules,
              as: 'deliveryRulesData',
              attributes: ['id', 'ruleName', 'rules'],
            },
            {
              model: customerWeek,
              as: 'weekData',
              attributes: ['weekDayId', 'type'],
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
        },
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalQuantity', 'itemCost'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'retailPrice', 'legacyCode'],
            },
          ]
        },
      ],
    });
    const _obj = getData.toJSON();
    _obj.currentAddressStatus = true;
    return res.success({
      message: `Standing Order ${message} Successfully`,
      data: {
        messageType,
        token: createdCart.id,
        getData: _obj
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const updateStandingOrder = async (standingOrderId, customerId, customerAddressId, itemData, deliveryType, addressData) => {
  const cartOrder = {
    customerId,
    customerAddressId
  };
  const updateCart = await dbService.update(order, { id: standingOrderId }, cartOrder);
  if (!updateCart) return {
    success: false,
    message: 'Failed to update cart order'
  };
  // Process item data to update order items and calculate totals
  const result = await processItems(itemData, standingOrderId, customerId, customerAddressId, deliveryType, addressData);
  if (!result.success) {
    await orderItem.destroy({ where: { cartId: standingOrderId } });
    await order.destroy({ where: { id: standingOrderId } });
    return {
      success: false,
      message: 'Failed to update standing order item'
    };
  }

  // Update order totals with the calculated values from processItems
  await updateOrder(standingOrderId, result.totals, deliveryType, addressData);
  return {
    success: true,
    cartId: standingOrderId
  };
};

const processItems = async (itemData, cartId, customerId, customerAddressId, deliveryType, addressData) => {
  let totals = initializeTotals();
  if (itemData.length === 0 && cartId){
    await orderItem.destroy({ where: { orderId: cartId } });
    let updateItem = {
      mon: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      tue: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      wed: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      thu: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      fri: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      sat: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      sun: {
        'quantity':0,
        'costPerDay':0,
        'deliveryType':false,
        'costPerDayWithDelivery':0,
        'retailValuePerDay':0
      },
      totalPieces:0,
      itemCost:0,
      totalCost: 0,
      totalRetailCost: 0,
      deliveryCharges: 0,
    };
    await dbService.update(order, { id: cartId }, updateItem);
  }
  for (const item of itemData) {
    const createdCartItem = await createOrUpdateCartItem(cartId, item, customerId, customerAddressId, addressData, deliveryType, itemData);
    if (!createdCartItem) return { success: false };

    updateTotals(totals, createdCartItem, item, deliveryType, addressData);
  }

  return {
    success: true,
    totals
  };
};

const createOrUpdateCartItem = async (orderId, cartOrderItem, customerId, customerAddressId, addressData, deliveryType, itemData) => {
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
    const ids = getCartOrder
      .filter(dbItem => !itemData.some(item => item.itemId === dbItem.itemId && item.itemGroupId === dbItem.itemGroupId))
      .map(dbItem => dbItem.id);
    if (ids.length > 0) {
      // Delete non-matching items
      await orderItem.destroy({ where: { id: ids } });
    }

    // Update the existing item with the new details
    await dbService.update(orderItem, { id: existingCartItem.id }, newItem);
  }

  else {
    const getCartOrder = await orderItem.findAll({
      where: { orderId },
      attributes: ['id', 'itemId', 'itemGroupId']  // Ensure 'id' is included
    });
    const ids = getCartOrder
      .filter(dbItem => !itemData.some(item => item.itemId === dbItem.itemId && item.itemGroupId === dbItem.itemGroupId))
      .map(dbItem => dbItem.id);
    if (ids.length > 0) {
      // Delete non-matching items
      await orderItem.destroy({ where: { id: ids } });
    }

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
  if (authConstant.DELIVERY_TYPE.delivery_price == addressData.deliveryType) {
    totals.deliveryType = authConstant.DELIVERY_TYPE.delivery_price;
    deliveryCharges = addressData.deliveryPrice;
    totals.ruleId = null;
    totals.ruleName = null;
    totals.rules = null;

  } else if (authConstant.DELIVERY_TYPE.delivery_price_rule === addressData.deliveryType) {
    totals.deliveryType = authConstant.DELIVERY_TYPE.delivery_price_rule;
    deliveryCharges = null;
    totals.ruleId = addressData.deliveryRulesData.id;
    totals.ruleName = addressData.deliveryRulesData.ruleName;
    totals.rules = addressData.deliveryRulesData.rules;

    const ruless = addressData.deliveryRulesData.rules;
    ruless.sort((a, b) => a.largerPrice - b.largerPrice);
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    days.forEach(day => {
      const costPrice = totals[`${day}Cost`];
      if (totals[day].deliveryType) {
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

const getStandingOrderList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    let getData = await itemGroup.findAll({
      include: [
        {
          model: item,
          as: 'itemData',
          include: [
            {
              required: true,
              model: orderItem,
              as: 'orderItemData',
              attributes: [],
            }
          ],
          attributes: ['id', ['name', 'itemName'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.mon')), 0), 'mon'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.tue')), 0), 'tue'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.wed')), 0), 'wed'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.thu')), 0), 'thu'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.fri')), 0), 'fri'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.sat')), 0), 'sat'],
            [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('itemData.orderItemData.sun')), 0), 'sun'], [
              Sequelize.literal(
                'COALESCE(SUM("itemData->orderItemData"."mon"), 0) + ' +
                'COALESCE(SUM("itemData->orderItemData"."tue"), 0) + ' +
                'COALESCE(SUM("itemData->orderItemData"."wed"), 0) + ' +
                'COALESCE(SUM("itemData->orderItemData"."thu"), 0) + ' +
                'COALESCE(SUM("itemData->orderItemData"."fri"), 0) + ' +
                'COALESCE(SUM("itemData->orderItemData"."sat"), 0) + ' +
                'COALESCE(SUM("itemData->orderItemData"."sun"), 0)'
              ),
              'totalSum'
            ]
          ],
        },
      ],
      attributes: [
        'id',
        ['name', 'itemGroupName'],
      ],
      group: ['itemgroup.id', 'itemData.id'],
      where: {
        id: { [Op.col]: 'itemData.orderItemData.itemGroupId' },
        adminId
      }
    });
    return res.success({ data: getData });  
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getCustomerStandingOrderList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    // Fetching customers with their addresses and orders
    const getCustomer = await customer.findAll({
      where: {
        isActive: true,
        adminId,
      },
      attributes: ['id', ['tradingName', 'legalName']],
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
              'address1'
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
        },
        {
          required: true,
          model: order,
          as: 'orderData',
          attributes: ['id', 'customerId', 'customerAddressId'],
          include: [
            {
              model: orderItem,
              as: 'orderItemData',
              attributes: [
                'id',
                'itemId',
                'itemGroupId',
                'mon',
                'tue',
                'wed',
                'thu',
                'fri',
                'sat',
                'sun',
              ],
              include: [
                {
                  model: item,
                  as: 'itemData',
                  attributes: ['id', 'name'],
                },
                {
                  model: itemGroup,
                  as: 'itemGroupData',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
      ],
    });

    // Aggregating and transforming data
    const customerMap = new Map();

    getCustomer.forEach(customer => {
      customer.customerAddressData.forEach(address => {
        const addressKey = `${customer.id}-${address.id}`;

        if (!customerMap.has(addressKey)) {
          customerMap.set(addressKey, {
            customerId: customer.id,
            legalName: customer.legalName,
            customerFullAddress: address.address1,
            customerAddressId: address.id,
            orders: []
          });
        }

        const customerEntry = customerMap.get(addressKey);
        const orderMap = new Map();
        let hasValidItems = false;

        customer.orderData.forEach(order => {
          if (order.customerId === customer.id && order.customerAddressId === address.id) {
            const orderId = order.id;

            // Check if the order already exists in the map
            let orderEntry = orderMap.get(orderId);
            if (!orderEntry) {
              orderEntry = {
                orderId: orderId,
                itemData: []
              };
              orderMap.set(orderId, orderEntry);
            }

            const itemDataMap = new Map();

            order.orderItemData.forEach(orderItem => {
              if (orderItem.itemGroupData && orderItem.itemData) {
                const groupName = orderItem.itemGroupData.name;
                const itemName = orderItem.itemData.name;

                if (!itemDataMap.has(groupName)) {
                  itemDataMap.set(groupName, {
                    itemGroupName: groupName,
                    items: []
                  });
                }

                const itemGroup = itemDataMap.get(groupName);
                const existingItem = itemGroup.items.find(i => i.name === itemName);

                if (existingItem) {
                  existingItem.mon += Number(orderItem.mon) || 0;
                  existingItem.tue += Number(orderItem.tue) || 0;
                  existingItem.wed += Number(orderItem.wed) || 0;
                  existingItem.thu += Number(orderItem.thu) || 0;
                  existingItem.fri += Number(orderItem.fri) || 0;
                  existingItem.sat += Number(orderItem.sat) || 0;
                  existingItem.sun += Number(orderItem.sun) || 0;
                } else {
                  /*
                   *                   itemGroup.items.push({
                   *                   name: itemName,
                   *                   mon: Number(orderItem.mon) || 0,
                   *                   tue: Number(orderItem.tue) || 0,
                   *                   wed: Number(orderItem.wed) || 0,
                   *                   thu: Number(orderItem.thu) || 0,
                   *                   fri: Number(orderItem.fri) || 0,
                   *                   sat: Number(orderItem.sat) || 0,
                   *                   sun: Number(orderItem.sun) || 0,
                   *                   }); 
                   */
                  const item = {
                    name: itemName,
                    mon: Number(orderItem.mon) || 0,
                    tue: Number(orderItem.tue) || 0,
                    wed: Number(orderItem.wed) || 0,
                    thu: Number(orderItem.thu) || 0,
                    fri: Number(orderItem.fri) || 0,
                    sat: Number(orderItem.sat) || 0,
                    sun: Number(orderItem.sun) || 0,
                  };

                  // Check if any day has a quantity greater than 0
                  if (
                    item.mon > 0 || item.tue > 0 || item.wed > 0 ||
                    item.thu > 0 || item.fri > 0 || item.sat > 0 || item.sun > 0
                  ) {
                    itemGroup.items.push(item);
                    hasValidItems = true;
                  }
                }
              }
            });

            orderEntry.itemData = Array.from(itemDataMap.values());
          }
        });
        // customerEntry.orders = Array.from(orderMap.values());
        if (hasValidItems) {
          customerEntry.orders = Array.from(orderMap.values());
        } else {
          customerMap.delete(addressKey); // Remove the customer if no valid items
        }
      });
    });

    const resultData = Array.from(customerMap.values());

    return res.json({
      status: 'SUCCESS',
      message: 'Your request is successfully executed',
      data: resultData,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'An error occurred while processing your request',
      error: error.message,
    });
  }
};

const getStandingOrderDetails = async (req, res) => {
  try {
    const {
      itemGroupId, itemId, weekDayType, customerId
    } = req.body;
    if (!itemGroupId || !itemId || !weekDayType) {
      return res.badRequest({ message: 'Insufficient request parameters! itemGroupId, itemId, weekDayType is required.' });
    }
    let where = {
      itemGroupId,
      itemId,
    };
    if (customerId) {
      where.customerId = customerId;
    }
    where[weekDayType] = { [Op.gt]: 0 };
    let getData = await orderItem.findAll({
      where: where,
      attributes: [[`${[weekDayType]}`, 'quantity'], 'orderId'],
      include: [
        {
          model: itemGroup,
          as: 'itemGroupData',
          attributes: ['id', 'name'],
        },
        {
          model: item,
          as: 'itemData',
          attributes: ['id', 'name'],
        },
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', ['tradingName', 'legalName'], 'legacyCode'],
        },
        {
          model: customerAddress,
          as: 'customerAddressData',
          attributes: ['id', 'address1', 'address1', 'address3', 'postcode'],
        },
      ],
    });
    return res.success({ data: getData });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getWeekList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await week.findAll({
      where: { adminId },
      attributes: [['id', 'weekDayId'], 'name'],
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

const getOrderDetails = async (req, res) => {
  try {
    const {
      customerId, customerAddressId, orderId
    } = req.params;
    if (!customerId || !customerAddressId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId, customerAddressId is required.' });
    }
    const where = { customerId };
    if (orderId) {
      where.id = orderId;
    }
    /* Check if customer not exists */
    const customerData = await customer.findOne({ where: { id: customerId } });
    if (!customerData) return res.failure({ message: 'Customer not found' });

    /* Check if customer address not exists */
    const addressData = await customerAddress.findOne({ where: { id: customerAddressId } });
    if (!addressData) return res.failure({ message: 'Customer Address not found' });

    /* Check if order not exists */
    const orderCheck = await order.findOne({ where });
    if (!orderCheck) return res.failure({ message: 'Order not found' });

    const orderAddressCheck = await order.findOne({
      where: {
        customerAddressId,
        customerId
      }
    });

    let getData = await order.findOne({
      where,
      attributes: ['id', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalPieces', 'totalCost', 'deliveryCharges', 'totalRetailCost', ['rulesPrice', 'deliveryPrice'], 'deliveryType'],
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', 'legalName', 'legacyCode'],
        },
        {
          model: customerAddress,
          as: 'customerAddressData',
          attributes: ['id', 'address1', 'address1', 'address3', 'postcode', 'deliveryPrice', 'deliveryType'],
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
            {
              model: deliveryRules,
              as: 'deliveryRulesData',
              attributes: ['id', 'ruleName', 'rules'],
            },
            {
              model: customerWeek,
              as: 'weekData',
              attributes: ['weekDayId', 'type'],
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
        },
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalQuantity', 'itemCost'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'retailPrice', 'legacyCode'],
            },
          ]
        },
      ],
    });
    if (getData) {
      const customerAddressData = await customerAddress.findOne({
        where: { id: customerAddressId },
        attributes: ['id', 'address1', 'address1', 'address3', 'postcode', 'deliveryPrice', 'deliveryType'],
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
          {
            model: deliveryRules,
            as: 'deliveryRulesData',
            attributes: ['id', 'ruleName', 'rules'],
          },
          {
            model: customerWeek,
            as: 'weekData',
            attributes: ['weekDayId', 'type'],
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
      const _obj = getData.toJSON();
      _obj.currentAddressStatus = orderAddressCheck ? true : false;
      _obj.customerAddressData = customerAddressData;
      if (customerAddressData.deliveryType == 'Delivery Price') {
        _obj.deliveryPrice = customerAddressData.deliveryPrice;
        _obj.deliveryRulesData = null;
      } else if (customerAddressData.deliveryType == 'Delivery Price Rule') {
        _obj.deliveryPrice = null;
        _obj.deliveryRulesData = customerAddressData.deliveryRulesData;
      } else {
        _obj.deliveryPrice = 0;
        _obj.deliveryRulesData = customerAddressData.deliveryRulesData;
      }
      _obj.customerAddressData = customerAddressData;
      getData = _obj;
    }
    return res.success({
      data: { getData },
      message: 'Standing Order Details '
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getEditCustomerAddress = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId is required.' });
    }
    let where = { customerId };
    let getData = await customerAddress.findAll({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
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
              attributes: ['name', 'displayOrder'],
              order: [['displayOrder', 'ASC']]
            },
          ]
        },
      ],
      order: [['createdAt', 'DESC']]

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

module.exports = {
  getCustomerList,
  getCustomerAddress,
  getItemList,
  addItem,
  submitStandingOrder,
  getStandingOrderList,
  getStandingOrderDetails,
  getWeekList,
  getOrderDetails,
  getCustomerStandingOrderList,
  getEditCustomerAddress
};