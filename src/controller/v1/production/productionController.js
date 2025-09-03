/**
 * productiocController.js
 * @description :: exports production methods
 */
const authService = require('@services/auth');
const {
  customer, cart, cartItem, item, itemGroup, customerAddress, countries, state, order, orderItem
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize, fn, col, literal, cast
} = require('sequelize');
const moment = require('moment');
const deliveryOrderList = async (req, res) => {
  try {
    let {
      startDate, endDate
    } = req.body;
    const adminId = req.headers['admin-id'] || null;

    const parsedStartDate = moment(startDate, 'YYYY-MM-DD').startOf('day');
    const parsedEndDate = moment(endDate, 'YYYY-MM-DD').endOf('day');

    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      return res.badRequest({ message: 'Invalid startDate or endDate format. Please provide dates in YYYY-MM-DD format.' });
    }

    const dateGroupedData = new Map();
    let currentDate = parsedStartDate.clone();

    while (currentDate.isSameOrBefore(parsedEndDate)) {
      const deliveryDate = currentDate.format('YYYY-MM-DD');
      const dayOfWeek = currentDate.format('ddd').toLowerCase();

      dateGroupedData.set(deliveryDate, {
        dayOfWeek: dayOfWeek,
        items: new Map(),
      });

      currentDate.add(1, 'days');
    }

    let orders = await order.findAll({
      where: {
        adminId,
        isDeleted: false,
      },
      attributes:['id','customerId'],
      include: [
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'itemGroupId', 'itemId', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalQuantity', 'itemCost'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'weight'],
            },
          ],
        },
      ],
    });

    let carts = await cart.findAll({
      where: {
        adminId,
        deliveryDate: { [Op.between]: [parsedStartDate.toDate(), parsedEndDate.toDate()], },
        submitBy: 'cart'
      },
      attributes:['id','deliveryDate','customerId'],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: ['id', 'itemGroupId', 'itemId', 'itemGroupName', 'lateType', 'itemName', 'quantity', 'weight', [Sequelize.fn('COALESCE', Sequelize.col('cartItemData.lateQuantity'), 0), 'lateQuantity']],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name'],
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'weight'],
            },
          ],
        },
      ],
    });
    // Process `cart` data for the specified delivery dates
    carts.forEach(cart => {
      const deliveryDate = moment(cart.deliveryDate).format('YYYY-MM-DD');

      cart.cartItemData.forEach(cartItem => {
        const itemGroupKey = cartItem.itemGroupData?.id;

        // Check if the deliveryDate exists in dateGroupedData
        if (dateGroupedData.has(deliveryDate)) {
          const data = dateGroupedData.get(deliveryDate);

          // Ensure itemGroup doesn't exist already in the map
          if (!data.items.has(itemGroupKey)) {
            data.items.set(itemGroupKey, {
              itemGroupId: itemGroupKey,
              itemGroupName: cartItem.itemGroupData?.name || null,
              items: [],
            });
          }

          const itemGroup = data.items.get(itemGroupKey);
          const existingItem = itemGroup.items.find(item => item.itemId === cartItem.itemId);

          // Add quantity if item already exists, else create a new entry
          if (existingItem) {
            existingItem.totalQuantity += cartItem.quantity;
            existingItem.totalLateQuantity += cartItem.lateQuantity;
          } else {
            itemGroup.items.push({
              itemId: cartItem.itemId,
              itemName: cartItem.itemName,
              weight: cartItem.weight,
              totalQuantity: cartItem.quantity,
              totalLateQuantity: cartItem.lateQuantity,
              lateType: cartItem.lateType,
            });
          }
        }
      });
    });

    /*
     * Process `order` data for the specified delivery dates (After cart data)
     * Ensure standing order quantity is added only if cart data is absent
     */
    orders.forEach(order => {
      order.orderItemData.forEach(orderItem => {
        const itemGroupKey = orderItem.itemGroupData?.id;

        dateGroupedData.forEach((data, deliveryDate) => {
          const itemQuantity = orderItem[data.dayOfWeek];

          if (itemQuantity > 0) {
            // Check if cart data for the same delivery date and customer already exists
            const cartExists = carts.some(cart => {
              return cart.customerId === order.customerId && moment(cart.deliveryDate).format('YYYY-MM-DD') === deliveryDate;
            });

            // Add order item only if no cart exists for the same customer and delivery date
            if (!cartExists) {
              if (!data.items.has(itemGroupKey)) {
                data.items.set(itemGroupKey, {
                  itemGroupId: itemGroupKey,
                  itemGroupName: orderItem.itemGroupData?.name || null,
                  items: [],
                });
              }

              const itemGroup = data.items.get(itemGroupKey);
              const existingItem = itemGroup.items.find(item => item.itemId === orderItem.itemId);

              if (existingItem) {
                existingItem.totalQuantity += itemQuantity;
              } else {
                itemGroup.items.push({
                  itemId: orderItem.itemId,
                  itemName: orderItem.itemData?.name || '',
                  weight: orderItem.itemData?.weight || 0,
                  totalQuantity: itemQuantity,
                  totalLateQuantity: 0,
                  lateType: '',
                });
              }
            }
          }
        });
      });
    });

    const transformedData = [];
    dateGroupedData.forEach((data, date) => {
      const itemsArray = [];

      // Sort items by itemGroupName in ascending order
      const sortedItemGroups = Array.from(data.items.values()).sort((a, b) => {
        return a.itemGroupName.localeCompare(b.itemGroupName);
      });

      sortedItemGroups.forEach(itemGroup => {
        if (itemGroup.items.length > 0) {
          // Sort the items inside each item group by itemName in ascending order
          itemGroup.items.sort((a, b) => a.itemName.localeCompare(b.itemName));

          itemsArray.push({
            itemGroupId: itemGroup.itemGroupId,
            itemGroupName: itemGroup.itemGroupName,
            items: itemGroup.items,
          });
        }
      });

      if (itemsArray.length > 0) {
        transformedData.push({
          deliveryDate: date,
          items: itemsArray,
        });
      }
    });
    return res.success({
      message: 'Delivery Order List',
      data: transformedData,
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getOrderCustomerList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      itemGroupId, itemId, orderDate 
    } = req.body;

    if (!itemGroupId || !itemId || !orderDate || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! itemGroupId, itemId, orderDate, adminId is required.' });
    }

    const curDate = new Date(orderDate);
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const dayOfWeek = curDate.getDay();
    const weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const selectedDay = weekDays[dayOfWeek];

    // Fetch Orders Data
    const orders = await order.findAll({
      attributes: ['id', 'totalPieces', 'totalCost', 'deliveryCharges', 'deliveryType', 'customerId'],
      where: {
        adminId,
        isActive: true,
        isDeleted: false,
      },
      include: [
        {
          model: orderItem,
          as: 'orderItemData',
          where: {
            itemId,
            itemGroupId,
            [selectedDay]: { [Sequelize.Op.ne]: null }
          },
          required: true,
          attributes: ['totalQuantity', selectedDay],
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
        {
          model: customer,
          as: 'customerData',
          attributes: ['tradingName'],
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
          attributes: [[
            Sequelize.fn(
              'CONCAT',
              Sequelize.col('customerAddressData.address1'),
              ' ',
              Sequelize.col('customerAddressData.address2'),
              ' ',
              Sequelize.col('customerAddressData.address3'),
              ' ',
              Sequelize.fn('COALESCE', Sequelize.col('customerAddressData.countryData.countryName'), ''),
              ' ',
              Sequelize.fn('COALESCE', Sequelize.col('customerAddressData.stateData.stateName'), ''),
              ' ',
              Sequelize.fn('COALESCE', Sequelize.col('customerAddressData.cityName'), ''),
              ' ',
              Sequelize.fn('COALESCE', Sequelize.col('customerAddressData.postcode'), ''),
            ),
            'address1'
          ]],
        },
      ],
    });

    // Fetch Cart Data
    const carts = await cart.findAll({
      attributes: ['id', 'deliveryDate', 'customerName', 'customerId', 'customerFullAddress'],
      where: {
        adminId,
        deliveryDate: formattedDate
      },
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          where: {
            itemId,
            itemGroupId
          },
          required: true,
          attributes: ['quantity', [Sequelize.fn('COALESCE', Sequelize.col('cartItemData.lateQuantity'), 0), 'lateQuantity'], 'itemName', 'itemGroupName'],
        },
      ],
    });

    // Combine Orders and Cart Data into the required format
    const combinedData = [];

    // Process Orders Data
    if (orders.length > 0) {
      orders.forEach(order => {
        const orderItems = order.orderItemData.map(orderData => ({
          quantity: orderData[selectedDay],
          lateQuantity: 0, // Assuming lateQuantity is always 0 for orders
          itemName: orderData.itemData.name,
          itemGroupName: orderData.itemGroupData.name
        }));

        // Add order to combinedData if no matching cart data
        const cartDataExists = carts.some(cart => cart.customerId === order.customerId && cart.deliveryDate === formattedDate);
        
        if (!cartDataExists) {
          combinedData.push({
            id: order.id,
            deliveryDate: orderDate,
            customerName: order.customerData.tradingName,
            customerId: order.customerId,
            customerFullAddress: order.customerAddressData.address1,
            cartItemData: orderItems, // Assigning order items directly here
          });
        }
      });
    }

    // Process Carts Data
    if (carts.length > 0) {
      carts.forEach(cart => {
        const existingCustomerIndex = combinedData.findIndex(data => data.customerId === cart.customerId && data.deliveryDate === formattedDate);
        if (existingCustomerIndex === -1) {
          combinedData.push({
            id: cart.id,
            deliveryDate: cart.deliveryDate,
            customerName: cart.customerName,
            customerId: cart.customerId,
            customerFullAddress: cart.customerFullAddress,
            cartItemData: cart.cartItemData,
          });
        } else {
          // If customer already exists and delivery date is the same, only add cart item data, not order data
          const existingCustomer = combinedData[existingCustomerIndex];
          existingCustomer.cartItemData = [...existingCustomer.cartItemData, ...cart.cartItemData];
        }
      });
    }

    // Extract unique customers from combined data
    const uniqueCustomers = Array.from(new Set(combinedData.map(item => item.customerId)))
      .map(customerId => {
        const customer = combinedData.find(item => item.customerId === customerId);
        return {
          customerId,
          customerName: customer.customerName || null
        };
      });

    return res.success({
      data: {
        getData: combinedData,
        customerList: uniqueCustomers
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  deliveryOrderList,
  getOrderCustomerList
};

//besst code and running code