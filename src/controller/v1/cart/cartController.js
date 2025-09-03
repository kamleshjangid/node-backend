/**
 * cartController.js
 * @description :: exports cartController methods
 */
const {
  customer,
  holiday,
  cart,
  cartItem,
  item,
  itemGroup,
  customerAddress,
  countries,
  state,
  customerWeek,
  week,
  customerItem,
  deliveryRules,
  route,
  rawMaterial,
  order,
  orderItem,
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op, Sequelize, col, fn } = require('sequelize');
const authConstant = require('@constants/authConstant');

/**
 * @description : get cart data
 * @param {Object} req : request for cart
 * @param {Object} res : response for cart
 * @return {Object} : response for cart {status, message, data}
 */
const getCustomerAddress = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({
        message: 'Insufficient request parameters! customerId is required.',
      });
    }
    let where = { customerId };
    let getData = await customerAddress.findAll({
      where,
      attributes: {
        exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'],
      },
      include: [
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
      ],
      order: [['createdAt', 'DESC']],
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
 * @description : get cart data
 * @param {Object} req : request for cart
 * @param {Object} res : response for cart
 * @return {Object} : response for cart {status, message, data}
 */
const getItemList = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({
        message: 'Insufficient request parameters! customerId is required.',
      });
    }
    let where = {
      isActive: true,
      isDeleted: false,
      customerId,
    };

    const getData = await customerItem.findAll({
      where,
      include: [
        {
          model: item,
          as: 'itemData',
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col('itemData.id'), 'id'],
        [Sequelize.col('itemData.name'), 'name'],
        [Sequelize.col('itemData.wholeSalePrice'), 'wholeSalePrice'],
        [Sequelize.col('itemData.retailPrice'), 'retailPrice'],
        [Sequelize.col('itemData.minOrder'), 'minOrder'],
        [Sequelize.col('itemData.maxOrder'), 'maxOrder'],
        [Sequelize.col('itemData.gstPercentage'), 'gstPercentage'],
      ],
      order: [
        [
          {
            model: item,
            as: 'itemData',
          },
          'name',
          'ASC',
        ],
      ],
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message: 'Items not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
/**
 * @description : get cart data
 * @param {Object} req : request for cart
 * @param {Object} res : response for cart
 * @return {Object} : response for cart {status, message, data}
 */
const addItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    if (!itemId) {
      return res.badRequest({
        message: 'Insufficient request parameters! itemId is required.',
      });
    }

    let where = {
      id: itemId,
      isActive: true,
      isDeleted: false,
    };
    let getData = await item.findOne({
      where,
      attributes: [
        'id',
        'name',
        'wholeSalePrice',
        'retailPrice',
        'legacyCode',
        'minOrder',
        'maxOrder',
        'gstPercentage',
      ],
      include: [
        {
          model: itemGroup,
          as: 'itemGroupData',
          attributes: ['id', 'name'],
        },
      ],
    });
    if (getData) {
      const _obj = getData.toJSON();
      _obj.giftType = false;
      return res.success({
        data: {
          ...req.body,
          getData: _obj,
        },
      });
    } else {
      return res.recordNotFound({ message: 'Items not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const checkExistingCartOrder = async (
  customerId,
  customerAddressId,
  orderDate,
  cartId
) => {
  let where = {
    customerId,
    deliveryDate: orderDate,
    customerAddressId,
  };
  if (cartId) {
    where.id = { [Op.ne]: cartId };
  }
  const existingCartOrder = await cart.findOne({ where: where });
  if (existingCartOrder) {
    return false;
  }
  return true;
};
async function checkDuplicateItems(cartOrderItem) {
  const seenItems = new Map();
  for (let i = 0; i < cartOrderItem.length; i++) {
    const { itemId, itemGroupId } = cartOrderItem[i];
    const itemData = await item.findOne({ where: { id: itemId } });
    const itemGroupData = await itemGroup.findOne({
      where: { id: itemGroupId },
    });

    /* Construct key using item and item group IDs */
    const key = `${itemId}-${itemGroupId}`;

    /* Check for duplicates */
    if (seenItems.has(key)) {
      const prevIndex = seenItems.get(key);
      return {
        duplicate: true,
        itemId: itemData.name,
        itemGroupId: itemGroupData.name,
        currentIndex: i + 1,
        prevIndex: prevIndex + 1,
      };
    }
    seenItems.set(key, i);
  }
  return { duplicate: false };
}
function calculateGST(price, rate) {
  // Calculate GST amount
  const gstAmount = (price * rate) / 100;
  return gstAmount;
}

const createCartItem = async (
  cartId,
  cartOrderItem,
  customerId,
  customerAddressId,
  deliveryDate
) => {
  const getItemData = await item.findOne({
    where: { id: cartOrderItem.itemId },
    include: [
      {
        model: itemGroup,
        as: 'itemGroupData',
        attributes: ['id', 'name'],
      },
    ],
  });
  if (!getItemData) return null;

  const weekDayShort = new Date(deliveryDate)
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toLowerCase();
  const orderCheck = await orderItem.findOne({
    where: {
      customerId,
      customerAddressId: customerAddressId,
      itemId: cartOrderItem.itemId,
      itemGroupId: cartOrderItem.itemGroupId,
    },
    attributes: ['id', `${weekDayShort}`],
  });
  const existingCartItem = await cartItem.findOne({
    where: {
      cartId: cartId,
      itemId: cartOrderItem.itemId,
      customerId: customerId,
    },
  });
  let gstPercentage = existingCartItem
    ? existingCartItem.gstPercentage
    : getItemData.gstPercentage;
  let calWholeSalePrice =
    (existingCartItem
      ? +existingCartItem.itemPrice
      : +getItemData.wholeSalePrice) * +cartOrderItem.quantity;
  let calGSt = calculateGST(
    +calWholeSalePrice,
    existingCartItem
      ? existingCartItem.gstPercentage
      : getItemData.gstPercentage
  );

  if (cartOrderItem.giftType === 1) {
    calWholeSalePrice = 0;
    calGSt = 0;
    gstPercentage = 0;
  }
  const getRawData = await rawMaterial.findOne({
    where: {
      itemId: cartOrderItem.itemId,
      productType: 'Production',
    },
  });
  if (existingCartItem) {
    console.log('====================================');
    console.log(
      'cartOrderItem.quantity != existingCartItem.quantity',
      cartOrderItem.quantity != existingCartItem.quantity
    );
    console.log('cartOrderItem.quantity', cartOrderItem.quantity);
    console.log('existingCartItem.quantity', existingCartItem.quantity);
    console.log('====================================');

    if (+cartOrderItem.quantity != existingCartItem.quantity) {
      cartOrderItem.lateQuantity = existingCartItem.quantity;
      cartOrderItem.lateType = 'late';
    }
    if (+existingCartItem.quantity > +cartOrderItem.quantity) {
      if (getRawData) {
        const newQty = +existingCartItem.quantity - +cartOrderItem.quantity;
        const available = +getRawData.available + +newQty;
        await dbService.update(
          rawMaterial,
          { id: getRawData.id },
          { available }
        );
      }
    } else {
      if (getRawData) {
        const newQty = +cartOrderItem.quantity - +existingCartItem.quantity;
        const available = +getRawData.available - +newQty;
        await dbService.update(
          rawMaterial,
          { id: getRawData.id },
          { available }
        );
      }
    }
    return dbService.update(
      cartItem,
      { id: existingCartItem.id },
      {
        ...cartOrderItem,
        itemPrice: existingCartItem.itemPrice,
        retailPrice: existingCartItem.retailPrice,
        weight: existingCartItem.weight,
        accountingCode: existingCartItem?.accountingCode,
        taxType: existingCartItem.taxStructure,
        cartId,
        customerId,
        itemCost: +calWholeSalePrice == 0 ? 0.0 : +calWholeSalePrice.toFixed(2),
        gstPercentage: gstPercentage,
        gstPrice: calGSt,
        itemGroupName: getItemData?.itemGroupData.name,
        itemName: getItemData.name,
        itemCode: getItemData.legacyCode,
      }
    );
  } else {
    if (getRawData) {
      const available = +getRawData.available - +quantity;
      await dbService.update(rawMaterial, { id: getRawData.id }, { available });
    }
    if (cartOrderItem.id) {
      delete cartOrderItem.id;
    }
    console.log('====================================');
    console.log('cartOrderItem', cartOrderItem);
    console.log('deliveryDate', deliveryDate);
    console.log('====================================');
    const currentDate = new Date();
    const checkOrderDate = new Date(deliveryDate);
    let canOrderNextDay = false;
    const currentDay = currentDate.getDate();
    const orderDay = checkOrderDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    console.log('====================================');
    console.log('currentHour > 12 || (currentHour === 12 && currentMinutes >= 30', currentHour > 12 || (currentHour === 12 && currentMinutes >= 30));
    console.log('====================================');
    if (orderDay === currentDay + 1) {
      if (currentHour > 12 || (currentHour === 12 && currentMinutes >= 30)) {
        canOrderNextDay = true; // 23rd, after 12:30 → 24th order allowed
      }
    }
    console.log('====================================');
    console.log('new',canOrderNextDay);
    console.log('====================================');
    return dbService.createOne(cartItem, {
      ...cartOrderItem,
      soQuantity: orderCheck ? orderCheck[weekDayShort] : 0,
      itemPrice: getItemData.wholeSalePrice,
      weight: getItemData.weight,
      retailPrice: getItemData.retailPrice,
      accountingCode: getItemData?.accountingCode,
      taxType: getItemData.taxStructure,
      cartId,
      customerId,
      itemCost: +calWholeSalePrice == 0 ? 0.0 : +calWholeSalePrice.toFixed(2),
      gstPercentage: gstPercentage,
      gstPrice: calGSt,
      itemGroupName: getItemData?.itemGroupData.name,
      itemName: getItemData.name,
      itemCode: getItemData.legacyCode,
      lateType: canOrderNextDay ? 'late' : '',
    });
  }
};
function createUniqueString(date) {
  date = date.replace(/[\s-]/g, '');
  const timestamp = new Date().getTime();
  const prefix = timestamp.toString().slice(-4);
  const suffix = timestamp.toString().slice(-2);
  return `${prefix}-${date}-${suffix}`;
}

/**
 * @description : get cart data
 * @param {Object} req : request for cart
 * @param {Object} res : response for cart
 * @return {Object} : response for cart {status, message, data}
 */
const submitCartOrder = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    const {
      customerId,
      customerAddressId,
      itemData,
      description,
      deliveryChargesType,
      orderDate,
      cartId,
      purchaseOrder,
    } = req.body;
    if (!customerId || !customerAddressId || !orderDate) {
      return res.badRequest({
        message:
          'Insufficient request parameters! customerId, customerAddressId, description, orderDate is required.',
      });
    }

    if (itemData && itemData.length == 0) {
      return res.badRequest({
        message: 'Insufficient request parameters! item data is required.',
      });
    }
    const currentDate = new Date();

    const checkHoliday = await holiday.findOne({
      where: {
        adminId,
        [Op.or]: [
          {
            startDate: { [Op.lte]: orderDate },
            endDate: { [Op.gte]: orderDate },
          },
          {
            startDate: { [Op.lte]: orderDate },
            endDate: { [Op.gte]: orderDate },
          },
        ],
      },
    });

    if (checkHoliday) {
      return res.failure({
        message: 'This day is a holiday. You cannot add an order.',
      });
    }
    let canOrderNextDay = false;

    if (orderDate) {
      const orderDateStr = new Date(orderDate.replace(/-/g, '/'));

      // Check for invalid date format
      if (orderDateStr == 'Invalid Date') {
        return res.failure({ message: 'Invalid date format' });
      }

      // Function to check if two dates are the same day
      /*
       *       function isSameDay (date1, date2) {
       *       return date1.toDateString() === date2.toDateString();
       *       }
       */

      // Check if current time is past 12:30 PM
      const currentHour = currentDate.getHours();
      const currentMinutes = currentDate.getMinutes();
      /*
       * const isPastNoon = currentHour > 12 || (currentHour === 12 && currentMinutes > 30);
       * If order date is today or in the past
       */
      if (currentDate.getTime() >= orderDateStr.getTime()) {
        return res.failure({ message: 'Order date must be in the future.' });
      }

      const checkOrderDate = new Date(orderDate); // maan lo order date 24th hai

      const currentDay = currentDate.getDate();
      const orderDay = checkOrderDate.getDate();
      console.log('====================================');
      console.log('canOrderNextDay',canOrderNextDay);
      console.log('orderDay',orderDay);
      console.log('orderDay',orderDay);
      console.log('currentDay',currentDay);
      console.log('currentDay + 1',currentDay + 1);
      console.log('currentHour',currentHour);
      console.log('currentMinutes',currentMinutes);
      console.log('====================================');
      if (orderDay === currentDay + 1) {
        if (currentHour > 12 || (currentHour === 12 && currentMinutes >= 30)) {
          canOrderNextDay = true; // 23rd, after 12:30 → 24th order allowed
        }
      }
      /*
       * If current time is past 12:30 PM, and orderDate is today or tomorrow
       * if (isPastNoon) {
       *   const tomorrow = new Date(currentDate);
       *   tomorrow.setDate(currentDate.getDate() + 1);
       */

      /*
       *   if (isSameDay(currentDate, orderDateStr) || isSameDay(tomorrow, orderDateStr)) {
       *     return res.failure({ message: 'Order date must be after tomorrow if ordering after 12:30 PM.' });
       *   }
       * }
       */
    }

    /* Check if customer exists */
    const customerData = await customer.findOne({ where: { id: customerId } });
    if (!customerData) return res.failure({ message: 'Customer not found' });

    /* Check if customer address exists */
    const addressObj = await customerAddress.findOne({
      where: { id: customerAddressId },
      attributes: [
        'id',
        'cityName',
        'postcode',
        'address1',
        'address2',
        'address3',
      ],
    });

    const addressData = await customerAddress.findOne({
      where: { id: customerAddressId },
      attributes: [
        'id',
        'deliveryType',
        'deliveryPrice',
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
          'address1',
        ],
      ],
      include: [
        {
          model: countries,
          as: 'countryData',
          attributes: ['countryName'],
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['stateName'],
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
            type: true,
          },
          as: 'weekData',
          include: [
            {
              model: week,
              as: 'weekData',
              attributes: ['name', 'displayOrder'],
            },
          ],
          attributes: ['weekDayId', 'routeId'],
        },
      ],
      order: [['weekData', 'weekData', 'displayOrder', 'ASC']],
    });
    if (!addressData)
      return res.failure({ message: 'Customer Address not found' });

    if (
      !(await checkExistingCartOrder(
        customerId,
        customerAddressId,
        orderDate,
        cartId
      ))
    ) {
      return res.failure({
        message: 'Cart order already exists for this delivery date',
      });
    }

    const options = { weekday: 'long' };
    const orderDateStr = new Date(orderDate.replace(/-/g, '/'));

    const currentDayName = orderDateStr.toLocaleDateString('en-US', options);
    const getWeekData = await customerWeek.findAll({
      where: {
        customerAddressId,
        type: true,
      },
      include: [
        {
          model: week,
          as: 'weekData',
          where: { name: `${[currentDayName]}` },
          attributes: ['id', 'name', 'displayOrder'],
        },
        {
          model: route,
          as: 'routeData',
          attributes: ['name'],
        },
      ],
      attributes: ['weekDayId', 'type', 'routeId'],
      order: [['weekData', 'displayOrder', 'ASC']],
    });
    if (getWeekData.length == 0) {
      return res.failure({
        message: `Sorry, we do not deliver to this address on ${currentDayName}. Please choose another day or address.`,
      });
    }

    /* Check for duplicate items */
    const duplicateItems = await checkDuplicateItems(itemData);
    if (duplicateItems.duplicate) {
      return res.failure({
        message: `Duplicate items detected: ${duplicateItems.itemId} and ${duplicateItems.itemGroupId} at row ${duplicateItems.currentIndex}. Previous occurrence at row ${duplicateItems.prevIndex}.`,
      });
    }

    let cartOrder = {
      purchaseOrder: purchaseOrder,
      customerId,
      customerAddressId,
      description,
      deliveryDate: orderDate,
      routeId: getWeekData[0].routeId,
      routeName: getWeekData[0].routeData.name,
      customerName: customerData.tradingName,
      customerFullAddress: addressData.address1,
      customerTerms: customerData.paymentTerms,
      customerLegacyCode: customerData.legacyCode,
      customerEmail: customerData.email,
      address1: addressObj.address1,
      address2: addressObj.address2,
      address3: addressObj.address3,
      cityName: addressObj.cityName,
      postcode: addressObj.postcode,
      countryName: addressData?.countryData?.countryName,
      stateName: addressData?.stateData?.stateName,
    };
    let lateQty = 0;
    let message = 'Added';
    let messageType = 'insert';
    let createdCart = {};
    if (cartId) {
      const getCartData = await cart.findOne({
        where: { id: cartId },
        attributes: ['deliveryDate'],
      });
      if (new Date(getCartData.deliveryDate) < currentDate) {
        return res.failure({ message: `This order is already completed` });
      }
      /*
       * const currentDate = new Date().toISOString().split('T')[0];
       * const orderDateObj = new Date(orderDate);
       * const previousDateObj = new Date(orderDateObj.setDate(orderDateObj.getDate() - 1));
       * const previousDate = previousDateObj.toISOString().split('T')[0];
       */

      // const isAfter12_30PM = previousDateObj.getHours() >= 12 && previousDateObj.getMinutes() >= 30;

      /* Check if both dates are equal and if the previous date is after 12:30 PM */
      /*
       *  if (currentDate >= previousDate || isAfter12_30PM) {
       *  return res.failure({ message: `This order is packed. You can't update it.` });
       *  }
       */

      if (
        customerData.paymentTerms == 'COD' ||
        customerData.paymentTerms == 'Prepaid'
      ) {
        cartOrder.dueDate = orderDate;
      } else {
        let daysToAdd = parseInt(customerData.paymentTerms.split(' ')[0]);
        let dateObject = new Date(orderDate);
        dateObject.setDate(dateObject.getDate() + daysToAdd);
        let newDate = dateObject.toISOString().split('T')[0];
        cartOrder.dueDate = newDate;
      }

      const updateCart = await dbService.update(
        cart,
        { id: cartId },
        cartOrder
      );
      lateQty = updateCart[0].totalPieces;
      createdCart.id = cartId;
      message = 'Updated';
      messageType = 'update';
      const getItemArray = await cartItem.findAll({
        where: { cartId },
        attributes: ['id'],
      });
      /* Step 1: Create a Set of update IDs for fast lookup */
      const updateIds = new Set(itemData.map((item) => item.id));

      /*  Step 2: Filter the dbArray to get IDs not present in updateIds */
      const nonMatchingIds = getItemArray
        .filter((dbItem) => !updateIds.has(dbItem.id))
        .map((dbItem) => dbItem.id);
      if (nonMatchingIds.length > 0) {
        await cartItem.destroy({ where: { id: nonMatchingIds } });
      }
      if (!updateCart) {
        return res.failure({ message: 'Failed to update cart order' });
      }
    } else {
      const uniqueString = createUniqueString(orderDate);
      const getInvoiceNumber = await cart.findOne({
        attributes: ['invoiceNumber'],
        order: [
          ['createdAt', 'DESC'],
          ['invoiceNumber', 'DESC'],
        ],
      });
      if (getInvoiceNumber) {
        cartOrder.invoiceNumber = +getInvoiceNumber.invoiceNumber + 1;
      } else {
        cartOrder.invoiceNumber = 0 + 1;
      }
      cartOrder.orderDate = currentDate.toISOString().split('T')[0];
      if (
        cartOrder.customerTerms == 'COD' ||
        cartOrder.customerTerms == 'Prepaid'
      ) {
        cartOrder.dueDate = orderDate;
      } else {
        let daysToAdd = parseInt(customerData.paymentTerms.split(' ')[0]);
        let dateObject = new Date(orderDate);
        dateObject.setDate(dateObject.getDate() + daysToAdd);
        let newDate = dateObject.toISOString().split('T')[0];
        cartOrder.dueDate = newDate;
      }
      cartOrder.deliveryNumber = uniqueString;
      cartOrder.submitBy = 'cart';
      createdCart = await dbService.createOne(cart, cartOrder);
      if (!createdCart) {
        return res.failure({ message: 'Failed to create cart order' });
      }
    }
    let totalCost = 0;
    let totalWeight = 0;
    let totalPieces = 0;
    let gstPrice = 0;
    for (const item of itemData) {
      let createdCartItem = await createCartItem(
        createdCart.id,
        item,
        customerId,
        customerAddressId,
        cartOrder.deliveryDate
      );
      if (createdCartItem.length > 0) {
        createdCartItem = createdCartItem[0];
      }
      if (!createdCartItem) {
        await cartItem.destroy({ where: { cartId: createdCart.id } });
        await cart.destroy({ where: { id: createdCart.id } });
        return res.failure({ message: 'Failed to create cart order item' });
      }
      totalCost += +createdCartItem.itemCost;
      totalPieces += item.quantity;
      gstPrice += +createdCartItem.gstPrice;
      totalWeight += +createdCartItem.weight / 1000;
    }
    let cartOrderItem = {
      totalCost: totalCost + gstPrice,
      deliveryChargesType,
    };
    let price = 0;

    if (deliveryChargesType) {
      if (
        authConstant.DELIVERY_TYPE.delivery_price == addressData.deliveryType
      ) {
        cartOrderItem.deliveryType = authConstant.DELIVERY_TYPE.delivery_price;
        price = addressData.deliveryPrice;
      } else if (
        authConstant.DELIVERY_TYPE.delivery_price_rule ===
        addressData.deliveryType
      ) {
        cartOrderItem.deliveryType =
          authConstant.DELIVERY_TYPE.delivery_price_rule;
        cartOrderItem.ruleId = addressData.deliveryRulesData.id;
        cartOrderItem.ruleName = addressData.deliveryRulesData.ruleName;
        cartOrderItem.rules = addressData.deliveryRulesData.rules;

        const ruless = addressData.deliveryRulesData.rules;

        /* Sort the rules array based on largerPrice in ascending order */
        ruless.sort((a, b) => a.largerPrice - b.largerPrice);

        /*
         *         ruless.forEach((rule, index) => {
         *         // Condition for the first rule (index 0)
         *         if (index === 0) {
         *          if (ruless[index + 1]) {
         *            // Check if totalCost is less than or equal to the first rule's largerPrice
         *            if (+cartOrderItem.totalCost <= +rule.largerPrice) {
         *              price = rule.price;
         *            }
         *          } else {
         *            // If there's no next rule, check if totalCost is less than or equal to the rule's largerPrice
         *            if (+cartOrderItem.totalCost <= +rule.largerPrice) {
         *              price = rule.price;
         *            }
         *          }
         *         }
         *
         *         // Condition for middle rules (index > 0 and index < last)
         *         if (index > 0 && index < ruless.length - 1) {
         *          // Here the condition should be based on the current and next rule's largerPrice
         *          if (+cartOrderItem.totalCost <= +rule.largerPrice && +cartOrderItem.totalCost > +ruless[index - 1].largerPrice) {
         *            price = rule.price;
         *          }
         *         }
         *
         *         // Condition for the last rule (index === ruless.length - 1)
         *         if (index === ruless.length - 1) {
         *          // If totalCost is less than or equal to the last rule's largerPrice
         *          if (+cartOrderItem.totalCost <= +rule.largerPrice && +cartOrderItem.totalCost > +ruless[index - 1].largerPrice) {
         *            price = rule.price;
         *          }
         *         }
         *         });
         */
        ruless.forEach((rule, index) => {
          // Condition for the first rule (index 0)
          if (index === 0) {
            if (ruless[index + 1]) {
              // Check if totalCost is greater than or equal to the first rule's largerPrice
              if (+cartOrderItem.totalCost >= +rule.largerPrice) {
                price = rule.price;
              }
            } else {
              // If there's no next rule, check if totalCost is greater than or equal to the rule's largerPrice
              if (+cartOrderItem.totalCost >= +rule.largerPrice) {
                price = rule.price;
              }
            }
          }

          // Condition for middle rules (index > 0 and index < last)
          if (index > 0 && index < ruless.length - 1) {
            // Here the condition should be based on the current and previous rule's largerPrice
            if (
              +cartOrderItem.totalCost >= +rule.largerPrice &&
              +cartOrderItem.totalCost < +ruless[index + 1].largerPrice
            ) {
              price = rule.price;
            }
          }

          // Condition for the last rule (index === ruless.length - 1)
          if (index === ruless.length - 1) {
            // If totalCost is greater than or equal to the last rule's largerPrice
            if (+cartOrderItem.totalCost >= +rule.largerPrice) {
              price = rule.price;
            }
          }
        });
      } else {
        /* else part is free delivery */
        cartOrderItem.deliveryType = authConstant.DELIVERY_TYPE.free_delivery;
        price = 0;
      }
      cartOrderItem.rulesPrice = +price;
      cartOrderItem.totalCost += +price;
    }
    await dbService.update(
      cartItem,
      { cartId: createdCart.id },
      {
        totalCost: totalCost,
        deliveryChargesType,
      }
    );
    cartOrderItem.totalWeight = totalWeight;
    cartOrderItem.totalPieces = totalPieces;
    cartOrderItem.deliveryCharges = price;
    cartOrderItem.terms = customerData.paymentTerms;
    cartOrderItem.GST = +gstPrice;
    if (+customerData.discount > 0) {
      cartOrderItem.discountPrice = (totalCost * +customerData.discount) / 100;
      cartOrderItem.discountPer = customerData.discount;
    }
    console.log('====================================');
    console.log('+lateQty != +totalPieces', +lateQty != +totalPieces);
    console.log('+lateQty != +totalPieces', +totalPieces);
    console.log('+lateQty != +totalPieces', +lateQty);
    console.log('====================================');
    if (+lateQty != +totalPieces) {
      console.log('====================================');
      console.log('canOrderNextDay', canOrderNextDay);
      console.log('====================================');
      if (canOrderNextDay) {
        cartOrderItem.lateQuantity = lateQty;
        cartOrderItem.lateType = 'late';
      }
    }
    const checkOrder = await order.findOne({
      where: {
        customerId,
        customerAddressId,
      },
      attributes: ['id'],
    });
    cartOrderItem.publishedStatus = 0;
    checkOrder ? (cartOrderItem.standingOrderId = checkOrder.id) : null;
    await dbService.update(cart, { id: createdCart.id }, cartOrderItem);
    return res.success({
      message: `Cart Order ${message} Successfully`,
      data: {
        messageType: messageType,
        token: createdCart.id,
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get cart data
 * @param {Object} req : request for cart
 * @param {Object} res : response for cart
 * @return {Object} : response for cart {status, message, data}
 */
const getOrderDate = async (req, res) => {
  try {
    const { customerId, customerAddressId } = req.body;
    if (!customerId) {
      return res.badRequest({
        message: 'Insufficient request parameters! customerId is required.',
      });
    }

    let where = {
      customerId,
      customerAddressId,
    };
    const getData = await cart.findAll({
      where,
      attributes: ['deliveryDate'],
      order: [['deliveryDate', 'ASC']],
    });
    const holidayData = await holiday.findAll({
      attributes: ['startDate', 'endDate'],
    });
    return res.success({
      data: {
        getData,
        holidayData,
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
/**
 * @description : get cart data
 * @param {Object} req : request for cart
 * @param {Object} res : response for cart
 * @return {Object} : response for cart {status, message, data}
 */
const getLastOrder = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { customerId, orderDate, customerAddressId } = req.body;
    if (!customerId) {
      return res.badRequest({
        message: 'Insufficient request parameters! customerId is required.',
      });
    }
    let where = { customerId };
    if (orderDate) {
      where.deliveryDate = orderDate;
    }
    if (customerAddressId) {
      where.customerAddressId = customerAddressId;
    }
    let itemType = false;
    const addressData = await customerAddress.findOne({
      where: { id: customerAddressId ? customerAddressId : null },
      attributes: ['deliveryPrice'],
    });

    const checkHoliday = await holiday.findOne({
      where: {
        adminId,
        [Op.or]: [
          {
            startDate: { [Op.lte]: orderDate },
            endDate: { [Op.gte]: orderDate },
          },
          {
            startDate: { [Op.lte]: orderDate },
            endDate: { [Op.gte]: orderDate },
          },
        ],
      },
    });
    const checkItem = await item.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          required: false,
          where: {
            customerId,
            adminId,
          },
          model: customerItem,
          as: 'customerItemData',
          attributes: [],
        },
      ],
      where: {
        isDeleted: false,
        adminId,
        [Op.or]: [
          {
            '$customerItemData.itemId$': { [Op.ne]: Sequelize.col('items.id') },
          },
          { '$customerItemData.itemId$': { [Op.eq]: null } },
        ],
      },
      order: [['name', 'ASC']],
    });
    if (checkItem.length > 0) {
      itemType = true;
    }
    let getData = await cart.findOne({
      where,
      attributes: {
        exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'],
      },
      include: [
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', 'legalName', 'tradingName', 'legacyCode'],
        },
        {
          model: customerAddress,
          as: 'customerAddressData',
          include: [
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
          ],
          attributes: [
            [
              Sequelize.fn(
                'CONCAT',
                Sequelize.col('customerAddressData.address1'),
                ' ',
                Sequelize.col('customerAddressData.address2'),
                ' ',
                Sequelize.col('customerAddressData.address3'),
                ' ',
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.countryData.countryName'),
                  ''
                ),
                ' ',
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.stateData.stateName'),
                  ''
                ),
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.cityName'),
                  ''
                ),
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.postcode'),
                  ''
                )
              ),
              'full_address',
            ],
          ],
        },
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: [
            'id',
            'totalCost',
            'quantity',
            'gstPercentage',
            'gstPrice',
            'giftType',
            'itemCost',
          ],
          include: [
            {
              model: item,
              as: 'itemData',
              attributes: [
                'id',
                'name',
                'wholeSalePrice',
                'retailPrice',
                'legacyCode',
                'gstPercentage',
                'maxOrder',
              ],
            },
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 1,
    });
    const obj = getData ? getData.toJSON() : getData;
    if (getData) {
      obj.deliveryCharges = addressData?.deliveryPrice;
    }

    return res.success({
      data: {
        getData: obj,
        itemType,
        orderType: orderDate ? true : false,
        holidayType: checkHoliday ? true : undefined,
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCartOrderList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    var rsData = req.body;
    let { options } = rsData;
    if (!options) {
      return res.badRequest({
        message: 'Insufficient request parameters! options is required.',
      });
    }

    let dataToFind = rsData;
    let querOptions = {};
    querOptions.page = options.page;
    querOptions.paginate = options.paginate;
    let query = dataToFind.query;
    query.adminId = adminId;
    query.submitBy = 'cart';
    if (dataToFind.search) {
    }
    if (query.startDate) {
      query.deliveryDate = {
        [Sequelize.Op.between]: [query.startDate, query.endDate],
      };
    } else {
      query.deliveryDate = { [Sequelize.Op.gte]: new Date() };
    }

    if (query.id) {
      query.customerId = query.id;
    }
    delete query.id;
    delete query.startDate;
    delete query.endDate;
    delete query.type;

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
    querOptions.select = [
      'id',
      'createdAt',
      'deliveryDate',
      'totalPieces',
      'totalCost',
      'deliveryCharges',
    ];
    querOptions.include = [
      {
        model: customer,
        as: 'customerData',
        attributes: ['id', ['tradingName', 'legalName']],
      },
      {
        model: customerAddress,
        as: 'customerAddressData',
        attributes: [
          [
            Sequelize.fn(
              'CONCAT',
              Sequelize.col('customerAddressData.address1'),
              ' ',
              Sequelize.col('customerAddressData.address2'),
              ' ',
              Sequelize.col('customerAddressData.address3')
            ),
            'full_address',
          ],
        ],
        include: [
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
        ],
      },
      {
        model: cartItem,
        as: 'cartItemData',
        attributes: [
          'id',
          'totalCost',
          'quantity',
          'soQuantity',
          'itemCost',
          'gstPrice',
        ],
        include: [
          {
            model: item,
            as: 'itemData',
            attributes: [
              'id',
              'name',
              'wholeSalePrice',
              'retailPrice',
              'legacyCode',
            ],
          },
          {
            model: itemGroup,
            as: 'itemGroupData',
            attributes: ['id', 'name'],
          },
        ],
      },
    ];
    querOptions.sort = { deliveryDate: -1 };
    foundData = await dbService.paginate(cart, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Cart Order List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getCartOrderDetails = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    const { cartId, customerId } = req.params;
    if (!cartId || !customerId) {
      return res.badRequest({
        message:
          'Insufficient request parameters! cartId, customerId is required.',
      });
    }
    const checkCustomer = await customer.findOne({ where: { id: customerId } });
    if (!checkCustomer) {
      return res.recordNotFound({ message: 'Customer not found..' });
    }

    let where = {
      id: cartId,
      customerId,
    };
    let getData = await cart.findOne({
      where,
      attributes: {
        exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'],
      },
      include: [
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', 'legalName', 'tradingName', 'legacyCode'],
        },
        {
          model: customerAddress,
          as: 'customerAddressData',
          include: [
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
          ],
          attributes: [
            [
              Sequelize.fn(
                'CONCAT',
                Sequelize.col('customerAddressData.address1'),
                ' ',
                Sequelize.col('customerAddressData.address2'),
                ' ',
                Sequelize.col('customerAddressData.address3'),
                ' ',
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.countryData.countryName'),
                  ''
                ),
                ' ',
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.stateData.stateName'),
                  ''
                ),
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.cityName'),
                  ''
                ),
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.postcode'),
                  ''
                )
              ),
              'full_address',
            ],
          ],
        },
        {
          model: cartItem,
          as: 'cartItemData',
        },
      ],
    });
    if (getData) {
      let itemType = false;
      const checkItem = await item.findAll({
        attributes: ['id', 'name'],
        include: [
          {
            required: false,
            where: {
              customerId,
              adminId,
            },
            model: customerItem,
            as: 'customerItemData',
            attributes: [],
          },
        ],
        where: {
          isDeleted: false,
          adminId,
          [Op.or]: [
            {
              '$customerItemData.itemId$': {
                [Op.ne]: Sequelize.col('items.id'),
              },
            },
            { '$customerItemData.itemId$': { [Op.eq]: null } },
          ],
        },
        order: [['name', 'ASC']],
      });
      if (checkItem.length > 0) {
        itemType = true;
      }
      return res.success({
        data: {
          getData,
          itemType,
          orderType: true,
        },
      });
    } else {
      return res.recordNotFound({ message: 'Cart order not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

function getCurrentWeekDates() {
  const today = new Date();
  const startOfWeek = new Date(
    today.setDate(today.getDate() - today.getDay() + 1)
  );
  const currentWeekDates = {};
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    currentWeekDates[day.toLocaleDateString('en-US', { weekday: 'long' })] = day
      .toISOString()
      .split('T')[0];
  }
  return currentWeekDates;
}

// Function to get next week's date for a given day
function getNextWeekDate(dayName) {
  const today = new Date();
  const dayIndex = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ].indexOf(dayName);
  const daysUntilNextWeek = 7 - today.getDay() + 1 + dayIndex; // days until next Monday + dayIndex
  const nextWeekDate = new Date(
    today.setDate(today.getDate() + daysUntilNextWeek)
  );
  return nextWeekDate.toISOString().split('T')[0];
}

// Function to find the matching date
function findMatchingDate(
  weekData,
  currentWeekDates,
  currentTime,
  twelveThirty
) {
  let resultDate = null;

  for (let i = 0; i < weekData.length; i++) {
    const entry = weekData[i];
    const weekDayName = entry.weekData.name;
    const currentDate = new Date(currentWeekDates[weekDayName]);

    if (currentDate.toDateString() === new Date().toDateString()) {
      const nextIndex = currentTime > twelveThirty ? i + 1 : i;
      const nextEntry = weekData[(nextIndex + 1) % weekData.length];
      const nextWeekDayName = nextEntry.weekData.name;
      const nextDate = new Date(currentWeekDates[nextWeekDayName]);
      resultDate =
        nextDate <= currentTime
          ? getNextWeekDate(nextWeekDayName)
          : currentWeekDates[nextWeekDayName];
      break;
    } else if (currentDate > currentTime) {
      resultDate = currentWeekDates[weekDayName];
      break;
    }
  }

  return resultDate;
}

const getCustomerDetails = async (req, res) => {
  try {
    const { customerId, customerAddressId } = req.body;

    if (!customerId || !customerAddressId) {
      return res.badRequest({
        message:
          'Insufficient request parameters! customerId and customerAddressId are required.',
      });
    }

    const customerData = await customer.findOne({
      where: { id: customerId },
      attributes: ['legalName', 'tradingName', 'paymentTerms'],
    });

    if (!customerData) {
      return res.recordNotFound({ message: 'Customer not found' });
    }

    const getData = await customerAddress.findOne({
      where: { id: customerAddressId },
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
        {
          model: customerWeek,
          where: {
            customerAddressId: customerAddressId,
            type: true,
          },
          as: 'weekData',
          include: [
            {
              model: week,
              as: 'weekData',
              attributes: ['name', 'displayOrder'],
            },
          ],
          attributes: ['weekDayId'],
        },
      ],
      attributes: ['deliveryType', 'deliveryPrice'],
      order: [['weekData', 'weekData', 'displayOrder', 'ASC']],
    });

    let orderDate;

    if (getData) {
      const weekData = getData.weekData;
      const currentWeekDates = getCurrentWeekDates();
      const currentTime = new Date();
      const twelveThirty = new Date();
      twelveThirty.setHours(12, 30, 0, 0);
      let resultDate = findMatchingDate(
        weekData,
        currentWeekDates,
        currentTime,
        twelveThirty
      );

      if (!resultDate) {
        for (let i = 0; i < weekData.length; i++) {
          const weekDayName = weekData[i].weekData.name;
          const currentDate = new Date(currentWeekDates[weekDayName]);
          if (currentDate > currentTime) {
            resultDate = currentWeekDates[weekDayName];
            break;
          }
        }
      }

      orderDate = resultDate || getNextWeekDate(weekData[0].weekData.name);
    }

    return res.success({
      data: {
        customerName: customerData.tradingName,
        terms: customerData.paymentTerms,
        getData,
        orderDate,
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const deleteCartOrder = async (req, res) => {
  try {
    const { deleteItem } = req.body;

    if (!deleteItem || deleteItem.length === 0) {
      return res.badRequest({
        message: 'Insufficient request parameters! deleteItem is required.',
      });
    }

    // Check each customer in the deleteItem array
    for (let item of deleteItem) {
      const checkCustomer = await customer.findOne({
        where: { id: item.customerId },
      });
      if (!checkCustomer) {
        return res.recordNotFound({
          message: `Customer with id ${item.customerId} not found.`,
        });
      }
    }
    const whereCondition = {
      [Op.or]: deleteItem.map((item) => ({
        id: item.id,
        customerId: item.customerId,
      })),
    };

    const getData = await cart.findOne({ where: whereCondition });

    if (getData) {
      const currentDate = new Date();
      const orderDate = new Date(getData.deliveryDate);

      if (currentDate >= orderDate) {
        return res.failure({
          message: `Cannot delete order; current date exceeds ${orderDate}`,
        });
      }

      try {
        let type = false;
        // Delete all cart items that match the criteria
        for (let item of deleteItem) {
          type = true;
          await cartItem.destroy({
            where: {
              cartId: item.id,
              customerId: item.customerId,
            },
          });
        }
        if (type) {
          // Delete the carts
          await cart.destroy({ where: whereCondition });
        }

        return res.success({ message: `${deleteItem.length} Order Deleted` });
      } catch (error) {
        return res.failure({
          message: 'This cart order could not be deleted.',
        });
      }
    } else {
      return res.recordNotFound({ message: 'Invalid Id' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getCustomerList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    let where = {
      isActive: true,
      isDeleted: false,
      adminId,
    };
    let getData = await customer.findAll({
      where,
      attributes: ['id', ['tradingName', 'legalName'], 'legacyCode'],
      order: [['tradingName', 'ASC']],
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message: 'Customer not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const checkHoliday = async (req, res) => {
  try {
    const { orderDate } = req.body;
    const adminId = req.headers['admin-id'] || null;
    const checkHoliday = await holiday.findOne({
      where: {
        adminId,
        [Op.or]: [
          {
            startDate: { [Op.lte]: orderDate },
            endDate: { [Op.gte]: orderDate },
          },
          {
            startDate: { [Op.lte]: orderDate },
            endDate: { [Op.gte]: orderDate },
          },
        ],
      },
    });

    return res.success({
      data: { holidayType: checkHoliday ? true : undefined },
      message: 'This day is a holiday. You cannot add an order.',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getNewLastOrder = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { customerId, orderDate, customerAddressId } = req.body;

    if (!customerId) {
      return res.badRequest({
        message: 'Insufficient request parameters! customerId is required.',
      });
    }

    // Check if customer exists
    const customerData = await customer.findOne({ where: { id: customerId } });
    if (!customerData) return res.failure({ message: 'Customer not found' });

    // Check if customer address exists
    const addressData = await customerAddress.findOne({
      where: { id: customerAddressId },
    });
    if (!addressData)
      return res.failure({ message: 'Customer Address not found' });

    const weekDayShort = new Date(orderDate)
      .toLocaleDateString('en-US', { weekday: 'short' })
      .toLowerCase();

    // Check if order exists
    let orderCheck = await order.findOne({
      where: {
        customerId,
        customerAddressId,
        [weekDayShort]: { [Op.ne]: null }, // Ensure proper use of operators
      },
      attributes: [
        'id',
        `${[weekDayShort]}`,
        'deliveryCharges',
        'totalRetailCost',
        ['rulesPrice', 'deliveryPrice'],
        'deliveryType',
      ],
      include: [
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
        {
          model: orderItem,
          where: { [weekDayShort]: { [Op.ne]: null } },
          as: 'orderItemData',
          attributes: ['id', `${[weekDayShort]}`],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
            {
              model: item,
              as: 'itemData',
              attributes: [
                'id',
                'name',
                'wholeSalePrice',
                'retailPrice',
                'legacyCode',
              ],
            },
          ],
        },
      ],
    });

    // Check if date is within a holiday period
    const checkHoliday = await holiday.findOne({
      where: {
        adminId,
        [Op.and]: [
          { startDate: { [Op.lte]: orderDate } },
          { endDate: { [Op.gte]: orderDate } },
        ],
      },
    });

    let itemType = false;
    const checkItem = await item.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          required: false,
          where: {
            customerId,
            adminId,
          },
          model: customerItem,
          as: 'customerItemData',
          attributes: [],
        },
      ],
      where: {
        isDeleted: false,
        adminId,
        [Op.or]: [
          {
            '$customerItemData.itemId$': { [Op.ne]: Sequelize.col('items.id') },
          },
          { '$customerItemData.itemId$': { [Op.eq]: null } },
        ],
      },
      order: [['name', 'ASC']],
    });

    if (checkItem.length > 0) {
      itemType = true;
    }
    const where = {
      customerId,
      customerAddressId,
    };
    if (orderDate) {
      where.deliveryDate = orderDate;
    }
    let getData = await cart.findOne({
      where,
      attributes: {
        exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'],
      },
      include: [
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', 'legalName', 'tradingName', 'legacyCode'],
        },
        {
          model: customerAddress,
          as: 'customerAddressData',
          include: [
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
          ],
          attributes: [
            [
              Sequelize.fn(
                'CONCAT',
                Sequelize.col('customerAddressData.address1'),
                ' ',
                Sequelize.col('customerAddressData.address2'),
                ' ',
                Sequelize.col('customerAddressData.address3'),
                ' ',
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.countryData.countryName'),
                  ''
                ),
                ' ',
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.stateData.stateName'),
                  ''
                ),
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.cityName'),
                  ''
                ),
                Sequelize.fn(
                  'COALESCE',
                  Sequelize.col('customerAddressData.postcode'),
                  ''
                )
              ),
              'full_address',
            ],
          ],
        },
        {
          model: cartItem,
          as: 'cartItemData',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 1,
    });
    if (!getData && !orderCheck) {
      getData = await cart.findOne({
        where: {
          customerId,
          customerAddressId,
        },
        attributes: {
          exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'],
        },
        include: [
          {
            model: customer,
            as: 'customerData',
            attributes: ['id', 'legalName', 'tradingName', 'legacyCode'],
          },
          {
            model: customerAddress,
            as: 'customerAddressData',
            include: [
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
            ],
            attributes: [
              [
                Sequelize.fn(
                  'CONCAT',
                  Sequelize.col('customerAddressData.address1'),
                  ' ',
                  Sequelize.col('customerAddressData.address2'),
                  ' ',
                  Sequelize.col('customerAddressData.address3'),
                  ' ',
                  Sequelize.fn(
                    'COALESCE',
                    Sequelize.col(
                      'customerAddressData.countryData.countryName'
                    ),
                    ''
                  ),
                  ' ',
                  Sequelize.fn(
                    'COALESCE',
                    Sequelize.col('customerAddressData.stateData.stateName'),
                    ''
                  ),
                  Sequelize.fn(
                    'COALESCE',
                    Sequelize.col('customerAddressData.cityName'),
                    ''
                  ),
                  Sequelize.fn(
                    'COALESCE',
                    Sequelize.col('customerAddressData.postcode'),
                    ''
                  )
                ),
                'full_address',
              ],
            ],
          },
          {
            model: cartItem,
            as: 'cartItemData',
            attributes: [
              'id',
              'totalCost',
              'quantity',
              'gstPercentage',
              'gstPrice',
              'giftType',
              'itemCost',
            ],
            include: [
              {
                model: item,
                as: 'itemData',
                attributes: [
                  'id',
                  'name',
                  'wholeSalePrice',
                  'retailPrice',
                  'legacyCode',
                  'gstPercentage',
                  'maxOrder',
                ],
              },
              {
                model: itemGroup,
                as: 'itemGroupData',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      if (getData) {
        getData = getData.toJSON();
        delete getData.id;
      }
    }
    let data = {
      getData: orderCheck && !getData ? orderCheck : getData,
      itemType,
      orderType: getData ? true : false,
      holidayType: checkHoliday ? true : undefined,
      soStatus: orderCheck && !getData ? true : false,
    };
    const oldDate = orderDate ? new Date(orderDate) : null;
    const currentDate = new Date();

    currentDate.setHours(0, 0, 0, 0);
    if (!getData && oldDate && oldDate < currentDate) {
      data = {
        getData: null,
        itemType: false,
        orderType: false,
        soStatus: false,
      };
    }
    return res.success({ data });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getCustomerAddress,
  getItemList,
  addItem,
  submitCartOrder,
  getOrderDate,
  getLastOrder,
  getCartOrderList,
  getCartOrderDetails,
  getCustomerDetails,
  deleteCartOrder,
  checkHoliday,
  getCustomerList,
  getNewLastOrder,
};
