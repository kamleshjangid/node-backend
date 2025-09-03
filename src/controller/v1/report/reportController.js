const {
  route,
  cart,
  customerAddress,
  customer,
  countries,
  state,
  cartItem, admin,
  order,
  orderItem,
  itemGroup,
  item,
  deliveryRules,
  customerWeek,
  week,
} = require('@model/index');
const {
  Op, Sequelize, fn, col, literal, cast
} = require('sequelize');

const getDriverReport = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { reportDate, routeId } = req.body;
    if (!adminId || !reportDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }
    const curDate = new Date(reportDate);
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const weekDaysShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekDayIndex = curDate.getDay();

    const shortWeekDayName = weekDaysShort[weekDayIndex];
    const capitalizedWeekDay = weekDaysFull[weekDayIndex];

    let where = { adminId };
    if (Array.isArray(routeId) && routeId.length > 0) {
      where.id = { [Op.in]: routeId };
    }
    const getRoute = await route.findAll({
      where,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    let getReport = [];

    for (const routeData of getRoute) {
      const routeId = routeData.id;

      // Fetch cart data
      const getCart = await cart.findAll({
        where: {
          deliveryDate: { [Op.eq]: formattedDate },
          routeId: routeId,
        },
        attributes: ['id', ['routeName', 'name']],
        include: [
          {
            model: customer,
            as: 'customerData',
            attributes: [['tradingName', 'legalName'], 'note', 'deliveryInstructions'],
          },
          {
            model: customerAddress,
            as: 'customerAddressData',
            attributes: [
              'postcode',
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
                attributes: [],
              },
              {
                model: state,
                as: 'stateData',
                attributes: [],
              },
            ],
          },
        ],
      });

      // Fetch order data
      const orders = await order.findAll({
        where: {
          [Op.and]: [
            Sequelize.literal(`CAST("order"."${shortWeekDayName}"->>'quantity' AS INTEGER) > 0`),
            { '$customerAddressData.weekData.weekData.name$': capitalizedWeekDay }
          ]
        },
        attributes: ['id', 'customerId', 'customerAddressId'],
        include: [
          {
            model: customer,
            as: 'customerData',
            attributes: [['tradingName', 'legalName'], 'note', 'deliveryInstructions'],
          },
          {
            model: customerAddress,
            as: 'customerAddressData',
            attributes: [
              'postcode',
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
                attributes: [],
              },
              {
                model: state,
                as: 'stateData',
                attributes: [],
              },
              {
                model: customerWeek,
                as: 'weekData',
                attributes: ['weekDayId', 'type'],
                where: { type: true },
                include: [
                  {
                    model: route,
                    as: 'routeData',
                    attributes: ['id', 'name'],
                    where: { id: routeId }
                  },
                  {
                    model: week,
                    as: 'weekData',
                    attributes: ['name', 'displayOrder'],
                    order: [['displayOrder', 'ASC']],
                  },
                ],
              },
            ],
          },
        ],
      });

      // Format the cart data
      const formattedCartData = getCart.map(cart => {
        const _Obj = cart.toJSON();  // Cart data ko plain object mein convert karna
        return {
          id: _Obj.id,
          customerData: {
            legalName: _Obj.customerData?.legalName,
            note: _Obj.customerData?.note,
            deliveryInstructions: _Obj.customerData?.deliveryInstructions,
          },
          customerAddressData: {
            postcode: _Obj.customerAddressData?.postcode,
            fullAddress: _Obj.customerAddressData?.fullAddress,
          },
        };
      });

      // Format the order data
      const formattedOrders = await Promise.all(
        orders.map(async (order) => {
          const _Obj = order.toJSON();
          const checkCartOrder = await cart.findOne({
            where: {
              customerId: _Obj.customerId,
              customerAddressId: _Obj.customerAddressId,
              deliveryDate: formattedDate
            },
          });

          if (!checkCartOrder) {
            return {
              id: _Obj.id,
              customerData: {
                legalName: _Obj.customerData?.legalName,
                note: _Obj.customerData?.note,
                deliveryInstructions: _Obj.customerData?.deliveryInstructions,
              },
              customerAddressData: {
                postcode: _Obj.customerAddressData?.postcode,
                fullAddress: _Obj.customerAddressData?.fullAddress,
              },
            };
          }
        })
      );

      // Filter out null values from `formattedOrders`
      const filteredFormattedOrders = formattedOrders.filter(Boolean);
      if (formattedCartData.length > 0 || filteredFormattedOrders.length > 0) {
        let existingRoute = getReport.find(report => report.id === routeData.id);

        if (existingRoute) {
          const sortedCartData = [...formattedCartData, ...filteredFormattedOrders].sort((a, b) =>
            a.customerData.legalName.localeCompare(b.customerData.legalName, undefined, { sensitivity: 'base' })
          );

          existingRoute.cartData.push(...sortedCartData);
        } else {
          getReport.push({
            id: routeData.id,
            name: routeData.name,
            cartData: [...formattedCartData, ...filteredFormattedOrders].sort((a, b) =>
              a.customerData.legalName.localeCompare(b.customerData.legalName, undefined, { sensitivity: 'base' })
            ),
          });
        }
      }
    }

    return res.success({
      data: getReport,
      message: 'Driver Report',
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getPackingSlipReport = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      reportDate, routeId
    } = req.body;
    if (!adminId || !reportDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }
    const curDate = new Date(reportDate);
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const weekDaysShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekDayIndex = curDate.getDay();

    const shortWeekDayName = weekDaysShort[weekDayIndex];
    const capitalizedWeekDay = weekDaysFull[weekDayIndex];

    let where = {
      adminId,
      deliveryDate: formattedDate
    };
    let whereRouteId = {};
    if (Array.isArray(routeId) && routeId.length > 0) {
      where.routeId = { [Op.in]: routeId };
      whereRouteId.id = { [Op.in]: routeId };
    }
    const orders = await order.findAll({
      where: {
        [Op.and]: [
          Sequelize.literal(`CAST("order"."${shortWeekDayName}"->>'quantity' AS INTEGER) > 0`), ,
          { '$customerAddressData.weekData.weekData.name$': capitalizedWeekDay }
        ]
      },
      attributes: ['id', 'customerId', 'customerAddressId'],
      include: [
        {
          model: customer,
          as: 'customerData',
          attributes: ['id', ['tradingName', 'legalName'], 'legacyCode', 'mobileNumber'],
        },
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
            {
              required: false,
              model: customerWeek,
              as: 'weekData',
              attributes: ['weekDayId', 'type'],
              where: { type: true },
              include: [
                {
                  model: route,
                  as: 'routeData',
                  where: whereRouteId,
                  attributes: ['name']
                },
                {
                  model: week,
                  as: 'weekData',
                  attributes: ['name', 'displayOrder'],
                  order: [['displayOrder', 'ASC']],
                },
              ],
            },
          ]
        },
        {
          model: deliveryRules,
          as: 'deliveryRulesData',
          attributes: ['id', 'ruleName', 'rules'],
        },
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', [`${shortWeekDayName}`, 'quantity']],
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
    const transformedOrders = await Promise.all(
      orders.map(async order => {
        const _Obj = order.toJSON();

        const fullAddress = `${_Obj.customerAddressData.address1 || ''}`;

        const totalQuantity = _Obj.orderItemData.reduce((total, item) => {
          return total + (item.quantity || 0);
        }, 0);

        const totalCost = _Obj.orderItemData.reduce((total, item) => {
          const price = parseFloat(item.itemData.wholeSalePrice) || 0;
          const quantity = item.quantity || 0;
          return total + price * quantity;
        }, 0).toFixed(2);

        const deliveryDate = formattedDate;

        const checkCartOrder = await cart.findOne({
          where: {
            customerId: _Obj.customerId,
            customerAddressId: _Obj.customerAddressId,
            deliveryDate: deliveryDate,
          },
        });

        if (!checkCartOrder) {
          let deliveryCharges = 0;
          let data = {
            id: _Obj.id,
            customerName: _Obj.customerData.legalName,
            customerFullAddress: fullAddress,
            deliveryDate: deliveryDate,
            routeName:
              _Obj.customerAddressData.weekData.length > 0
                ? _Obj.customerAddressData.weekData[0].routeData.name
                : '',
            routeId:
              _Obj.customerAddressData.weekData.length > 0
                ? _Obj.customerAddressData.weekData[0].routeData.id
                : null,
            totalQuantity: totalQuantity,
            totalCost: totalCost,
            GST: '0',
            deliveryNumber: `9822-${new Date(formattedDate)
              .toISOString()
              .split('T')[0]
              .replace(/-/g, '')}-${Math.floor(Math.random() * 100)}`,
            cartItemData: _Obj.orderItemData
              .filter(item => item.quantity > 0)
              .map(item => ({
                id: item.id,
                itemName: item.itemData.name,
                quantity: item.quantity || 0,
                lateQuantity: item.lateQuantity || null,
                itemPrice: item.itemData.retailPrice || '0',
                itemCost: (
                  (isNaN(parseFloat(item.itemData.wholeSalePrice)) ? 0 : parseFloat(item.itemData.wholeSalePrice)) *
                  (isNaN(item.quantity) ? 0 : item.quantity)
                ).toFixed(2),
              })),
          };
          if (_Obj.deliveryRulesData) {
            const ruless = _Obj.deliveryRulesData.rules;
            ruless.sort((a, b) => a.largerPrice - b.largerPrice);
            ruless.forEach((rule, index) => {
              if (index === 0) {
                if (ruless[index + 1]) {
                  if (+totalCost >= +rule.largerPrice) {
                    deliveryCharges = rule.price;
                  }
                } else {
                  if (+totalCost >= +rule.largerPrice) {
                    deliveryCharges = rule.price;
                  }
                }
              }
              if (index > 0 && index < ruless.length - 1) {
                if (+totalCost >= +rule.largerPrice && +totalCost < +ruless[index + 1].largerPrice) {
                  deliveryCharges = rule.price;
                }
              }
              if (index === ruless.length - 1) {
                if (+totalCost >= +rule.largerPrice) {
                  deliveryCharges = rule.price;
                }
              }
            });
          }
          data.deliveryCharges = deliveryCharges;
          if (data.cartItemData.length > 0) {
            return data;
          }
        }
        return null; // If checkCartOrder exists, return null to filter it out later.
      })
    );

    // Filter out null values (if any).
    const filteredTransformedOrders = transformedOrders.filter(order => order !== null);

    const getReport = await cart.findAll({
      where: where,
      attributes: [
        'id',
        'customerName',
        'customerFullAddress',
        'deliveryDate',
        'routeName',
        'routeId',
        ['totalPieces', 'totalQuantity'],
        [
          Sequelize.literal('CAST("carts"."totalCost" AS DECIMAL(10, 2))'),
          'totalCost',
        ],
        'deliveryCharges',
        'GST',
        'deliveryNumber',
      ],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: [
            'id',
            'itemName',
            'quantity',
            'lateQuantity',
            'itemPrice',
            'itemCost',
          ],
        },
      ],
      order: [['routeName', 'ASC']],
    });

    const mergedReport = getReport.concat(filteredTransformedOrders);

    const sortedReport = mergedReport.sort((a, b) => {
      const routeComparison = a.routeName.localeCompare(b.routeName, undefined, { sensitivity: 'base' });
      if (routeComparison !== 0) return routeComparison;

      return a.customerName.localeCompare(b.customerName, undefined, { sensitivity: 'base' });
    });

    const getPakingNote = await admin.findOne({
      where: { id: adminId },
      attributes: ['packingNote']
    });
    return res.success({
      data: {
        getReport: sortedReport,
        getPakingNote
      },
      message: 'Packing Slip Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getMatrixReport = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }
    const formattedStartDate = new Date(startDate);
    const formattedEndDate = new Date(endDate);

    // Weekday generator function
    const getWeekDays = (start, end) => {
      const weekDays = [];
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dayName = currentDate.toLocaleString('en-US', { weekday: 'short' }).toLowerCase();
        weekDays.push(dayName);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return weekDays;
    };
    const weekDays = getWeekDays(formattedStartDate, formattedEndDate);

    // Fetching report data
    const getReport = await cart.findAll({
      where: {
        adminId,
        deliveryDate: { [Op.between]: [startDate, endDate] }
      },
      attributes: ['id', 'customerId', 'customerName', 'customerFullAddress'],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: ['id', 'itemGroupName', 'itemName', 'quantity'],
        }
      ]
    });
    // Fetch order data
    const orderData = await order.findAll({
      where: {
        adminId,
        isDeleted: false
      },
      attributes: ['id', 'customerId'],
      include: [
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'itemGroupId', 'itemId', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalQuantity'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name']
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: customer,
          as: 'customerData',
          attributes: ['tradingName']
        }
      ]
    });
    // Transform fetched data into the required format
    const dataSets = [];
    const headers = [];
    const customerMap = new Map();

    getReport.forEach(order => {
      // Use customerId instead of customerName
      if (!customerMap.has(order.customerId)) {
        headers.push({
          name: order.customerName,
          customerId: order.customerId,
          address: order.customerFullAddress
        });
        customerMap.set(order.customerId, order);
      }
    });

    const itemGroupsMap = new Map();
    let headerIndex;
    // Process cart data first (higher priority)
    getReport.forEach(order => {
      order.cartItemData.forEach(item => {
        const groupName = item.itemGroupName || 'Default Group';
        if (!itemGroupsMap.has(groupName)) {
          itemGroupsMap.set(groupName, {
            groupName,
            items: new Map(),
            groupTotal: 0
          });
        }

        const itemsMap = itemGroupsMap.get(groupName).items;
        headerIndex = headers.findIndex(h => h.customerId === order.customerId);

        if (itemsMap.has(item.itemName)) {
          itemsMap.get(item.itemName).quantities[headerIndex] += item.quantity;
        } else {
          const quantitiesArray = Array(headers.length).fill(null);

          if (item.quantity > 0) {
            quantitiesArray[headerIndex] = item.quantity;
          }
          itemsMap.set(item.itemName, {
            name: item.itemName,
            quantities: quantitiesArray
          });
        }
        itemGroupsMap.get(groupName).groupTotal += item.quantity;
      });
    });

    // Process standing orders only if no cart data exists for the same customer and item
    orderData.forEach(order => {
      const hasValidQuantities = order.orderItemData.some(item => {
        return weekDays.some(day => item[day] !== null && item[day] > 0);
      });

      if (!hasValidQuantities) {
        console.log(`Skipping customer: ${order.customerData?.tradingName || 'Unknown Customer'} due to null or zero quantities`);
        return;
      }

      // Add customer to headers if not already added
      if (!customerMap.has(order.customerId)) {
        headers.push({
          name: order.customerData?.tradingName || 'Unknown Customer',
          customerId: order.customerId,
          address: ''
        });
        customerMap.set(order.customerId, order);
      }

      order.orderItemData.forEach(item => {
        const groupName = item.itemGroupData?.name || 'Default Group';
        if (!itemGroupsMap.has(groupName)) {
          itemGroupsMap.set(groupName, {
            groupName,
            items: new Map(),
            groupTotal: 0
          });
        }

        const itemsMap = itemGroupsMap.get(groupName).items;
        headerIndex = headers.findIndex(h => h.customerId === order.customerId);
        weekDays.forEach(day => {
          // Ensure dayQuantity is set to 0 for null, undefined, or 0 values
          let dayQuantity = item[day] !== null && item[day] !== undefined && item[day] > 0 ? item[day] : 0;

          // Convert to number if it's a string
          dayQuantity = typeof dayQuantity === 'string' ? Number(dayQuantity) : dayQuantity;
          if (dayQuantity > 0) {
            if (itemsMap.has(item.itemData.name)) {
              const currentItem = itemsMap.get(item.itemData.name);
              // Update the quantities array, making sure it's always a number
              currentItem.quantities[headerIndex] = +(currentItem.quantities[headerIndex] || 0) + dayQuantity;
            } else {
              const quantitiesArray = Array(headers.length).fill(null);
              quantitiesArray[headerIndex] = dayQuantity;
              itemsMap.set(item.itemData.name, {
                name: item.itemData.name,
                quantities: quantitiesArray,
              });
            }
          }
        });

        // Add total quantity of the item only if it has a valid totalQuantity
        if (item.totalQuantity && item.totalQuantity > 0) {
          itemGroupsMap.get(groupName).groupTotal += item.totalQuantity;
        }
      });
    });
    /*
     *     console.log(JSON.stringify([...itemGroupsMap].map(([key, value]) => ({
     *     [key]: {
     *      ...value,
     *      items: Object.fromEntries(value.items)  // Convert inner Map to an object
     *     }
     *     })), null, 2)); 
     */
    // Split data into multiple pages
    const PAGE_SIZE = 10;
    for (let i = 0; i < headers.length; i += PAGE_SIZE) {
      const currentHeaders = headers.slice(i, i + PAGE_SIZE);
      const dataSet = {
        pageSet: `${Math.floor(i / PAGE_SIZE) + 1} of ${Math.ceil(headers.length / PAGE_SIZE)}`,
        rowCount: 0,
        columnCount: currentHeaders.length,
        headers: currentHeaders,
        itemGroups: [],
        totals: Array(currentHeaders.length).fill(0),
        totalQuantity: 0
      };
      itemGroupsMap.forEach(group => {
        const items = [];
        group.items.forEach(item => {
          // Ensure quantities are numbers (even if they are strings)
          const slicedQuantities = item.quantities.slice(i, i + PAGE_SIZE).map(qty => Number(qty) || '');

          const totalQuantity = slicedQuantities.reduce((acc, curr) => acc + Number(curr), 0);
          items.push({
            name: item.name,
            quantities: slicedQuantities,
            totalQuantity: +totalQuantity
          });

          // Update totals
          slicedQuantities.forEach((qty, index) => {
            const quantity = Number(qty);
            dataSet.totals[index] += quantity;
          });
        });

        dataSet.rowCount += items.length;
        dataSet.itemGroups.push({
          groupName: group.groupName,
          items: items
        });
      });

      dataSet.totalQuantity = dataSet.totals.reduce((acc, curr) => acc + curr, 0);
      dataSets.push(dataSet);

    }

    return res.success({
      data: dataSets,
      message: 'Matrix Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const customerTotalOrderReport = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate, customerId, customerAddressId
    } = req.body;

    if (!adminId || !startDate || !endDate || !customerId || !customerAddressId) {
      return res.badRequest({ message: 'Insufficient request parameters! startDate, endDate, customerId, customerAddressId are required.' });
    }

    const formattedStartDate = new Date(startDate);
    const formattedEndDate = new Date(endDate);

    // Fetch customer and address data
    const customerData = await customer.findOne({
      where: {
        id: customerId,
        adminId
      },
      attributes: ['legalName'],
    });
    if (!customerData) return res.failure({ message: 'Customer not found' });

    const addressData = await customerAddress.findOne({
      where: { id: customerAddressId },
      attributes: ['id'],
      include: [
        {
          model: countries,
          as: 'countryData',
          attributes: ['countryName']
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['stateName']
        }
      ],
    });
    if (!addressData) return res.failure({ message: 'Customer Address not found' });

    // Fetch orders and cart items
    const orders = await order.findAll({
      where: {
        customerAddressId,
        customerId,
        adminId
      },
      attributes: ['id'],
      include: [
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'itemGroupId', 'orderId', 'customerId', 'itemId', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalQuantity', 'itemCost'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name']
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'retailPrice', 'legacyCode', 'weight']
            }
          ]
        },
        {
          model: cart,
          as: 'cartData',
          attributes: ['id', 'deliveryDate'],
          include: [
            {
              model: cartItem,
              as: 'cartItemData',
              attributes: ['id', 'itemGroupName', 'cartId', 'customerId', 'itemName', 'quantity', 'weight']
            }
          ]
        }
      ]
    });

    // Generate delivery dates
    const generateDeliveryDates = (startDate, endDate) => {
      const dates = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const deliveryDates = generateDeliveryDates(formattedStartDate, formattedEndDate);

    // Transformation logic
    const transformedData = orders.reduce((result, order) => {
      const processedItems = new Set();

      // Process items from the order
      order.orderItemData.forEach((item) => {
        let itemGroup = result.find(group => group.itemGroupId === item.itemGroupId);
        if (!itemGroup) {
          itemGroup = {
            itemGroupId: item.itemGroupId,
            itemGroupName: item.itemGroupData.name,
            itemData: [],
            totalCount: 0,
            totalWeight: 0
          };
          result.push(itemGroup);
        }

        const itemName = item.itemData.name;

        // Check if the itemName has already been processed
        if (!processedItems.has(itemName)) {
          const itemData = {
            itemName,
            weight: item.itemData.weight,
            dataByDate: deliveryDates.map((date) => {
              const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
              let quantity = item[dayOfWeek] || 0;

              // Check for cart data
              const cartData = order.cartData?.find(cart => new Date(cart.deliveryDate).toISOString().split('T')[0] === date.toISOString().split('T')[0]);
              if (cartData) {
                const cartItem = cartData.cartItemData.find(ci => ci.itemName === itemName);
                if (cartItem) {
                  quantity = cartItem.quantity; // Use cart quantity
                }
              }

              return {
                deliveryDate: date.toISOString().split('T')[0],
                quantity,
                weight: quantity * item.itemData.weight,
              };
            }),
            totalQuantity: 0,
          };

          // Update total quantity
          itemData.totalQuantity = itemData.dataByDate.reduce((sum, day) => sum + day.quantity, 0);

          itemGroup.itemData.push(itemData);
          processedItems.add(itemName); // Mark item as processed
          itemGroup.totalCount += itemData.totalQuantity;
          itemGroup.totalWeight += itemData.dataByDate.reduce((sum, day) => sum + day.weight, 0);
        }
      });

      // Process cart items
      if (order.cartData) {
        order.cartData.forEach(cart => {
          cart.cartItemData.forEach(cartItem => {
            const deliveryDateMatches = deliveryDates.some(date =>
              new Date(cart.deliveryDate).toISOString().split('T')[0] === date.toISOString().split('T')[0]
            );

            if (deliveryDateMatches) {
              const cartItemName = cartItem.itemName;

              // Check if this cart item has already been processed
              if (!processedItems.has(cartItemName)) {
                let itemGroup = result.find(group => group.itemGroupName === cartItem.itemGroupName);
                if (!itemGroup) {
                  itemGroup = {
                    itemGroupId: null,
                    itemGroupName: cartItem.itemGroupName,
                    itemData: [],
                    totalCount: 0,
                    totalWeight: 0
                  };
                  result.push(itemGroup);
                }

                const itemData2 = {
                  itemName: cartItemName,
                  weight: cartItem.weight,
                  dataByDate: deliveryDates.map(date => {
                    if (new Date(cart.deliveryDate).toISOString().split('T')[0] === date.toISOString().split('T')[0]) {
                      return {
                        deliveryDate: date.toISOString().split('T')[0],
                        quantity: cartItem.quantity,
                        weight: +cartItem.weight,
                      };
                    } else {
                      return {
                        deliveryDate: date.toISOString().split('T')[0],
                        quantity: 0,
                        weight: 0,
                      };
                    }
                  }),
                  totalQuantity: cartItem.quantity,
                };

                itemGroup.itemData.push(itemData2);
                itemGroup.totalCount += cartItem.quantity;
                itemGroup.totalWeight += +cartItem.weight;

                processedItems.add(cartItemName); // Mark cart item as processed
              }
            }
          });
        });
      }

      return result;
    }, []);

    return res.success({
      status: 'SUCCESS',
      message: 'Customer total order report',
      data: {
        reportData: transformedData,
        customerData,
        addressData
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const allCustomerTotalOrderReport = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! startDate, endDate, adminId is required.' });
    }

    const formattedStartDate = new Date(startDate);
    const formattedEndDate = new Date(endDate);

    // Fetch orders
    const orders = await order.findAll({
      where: { adminId },
      attributes: ['id'],
      include: [
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', 'itemGroupId', 'orderId', 'itemId', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'totalQuantity'],
          include: [
            {
              model: itemGroup,
              as: 'itemGroupData',
              attributes: ['id', 'name']
            },
            {
              model: item,
              as: 'itemData',
              attributes: ['id', 'name', 'wholeSalePrice', 'weight']
            }
          ]
        },
        {
          model: cart,
          as: 'cartData',
          attributes: ['id', 'deliveryDate'],
          include: [
            {
              model: cartItem,
              as: 'cartItemData',
              attributes: ['id', 'itemGroupName', 'itemName', 'quantity', 'weight']
            }
          ]
        }
      ]
    });

    // Generate delivery dates
    const generateDeliveryDates = (startDate, endDate) => {
      const dates = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const deliveryDates = generateDeliveryDates(formattedStartDate, formattedEndDate);

    // Transformation logic
    const transformedData = [];
    const processedItems = new Set();

    orders.forEach(order => {
      // Process standing orders
      order.orderItemData.forEach(item => {
        const itemGroupId = item.itemGroupId;
        const itemName = item.itemData.name;
        const itemId = item.itemData.id;
        // Check if the item group already exists
        let itemGroup = transformedData.find(group => group.itemGroupId === itemGroupId);
        if (!itemGroup) {
          itemGroup = {
            itemGroupId: itemGroupId,
            itemGroupName: item.itemGroupData.name,
            itemData: [],
            totalCount: 0,
            totalWeight: 0
          };
          if (item.totalQuantity > 0) {
            transformedData.push(itemGroup);
          }
        }

        // Check if the item already exists in the group
        let itemEntry = itemGroup.itemData.find(i => i.itemName === itemName);
        if (!itemEntry) {
          itemEntry = {
            itemId: itemId,
            itemName: itemName,
            weight: item.itemData.wholeSalePrice,
            dataByDate: deliveryDates.map(date => ({
              deliveryDate: date,
              quantity: 0,
              weight: 0,
            })),
            totalQuantity: 0,
          };
          itemGroup.itemData.push(itemEntry);
        }

        const dayMapping = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        deliveryDates.forEach(date => {
          const dayOfWeek = dayMapping[new Date(date).getDay()];
          let quantity = item[dayOfWeek] || 0;

          const cartData = order.cartData?.find(cart => new Date(cart.deliveryDate).toISOString().split('T')[0] === date);
          if (cartData) {
            const cartItem = cartData.cartItemData.find(ci => ci.itemName === itemName);
            if (cartItem) {
              quantity += cartItem.quantity;
            }
          }

          const dateEntry = itemEntry.dataByDate.find(d => d.deliveryDate === date);
          if (dateEntry) {
            dateEntry.quantity += quantity;
            dateEntry.weight += quantity * item.itemData.weight;
          }
        });

        itemEntry.totalQuantity = itemEntry.dataByDate.reduce((sum, day) => sum + day.quantity, 0);
        itemGroup.totalCount += itemEntry.totalQuantity;
        itemGroup.totalWeight += itemEntry.dataByDate.reduce((sum, day) => sum + day.weight, 0);
        processedItems.add(itemName);
      });

      // Process cart items only if they are not in standing orders
      order.cartData.forEach(cart => {
        cart.cartItemData.forEach(cartItem => {
          const cartItemName = cartItem.itemName;
          const cartItemId = cartItem.id;

          if (!processedItems.has(cartItemName)) {
            let itemGroup = transformedData.find(group => group.itemGroupName === cartItem.itemGroupName);
            if (!itemGroup) {
              itemGroup = {
                itemGroupId: null,
                itemGroupName: cartItem.itemGroupName,
                itemData: [],
                totalCount: 0,
                totalWeight: 0
              };
              transformedData.push(itemGroup);
            }

            const itemData = {
              itemId: cartItemId,
              itemName: cartItemName,
              weight: cartItem.weight,
              dataByDate: deliveryDates.map(date => ({
                deliveryDate: date,
                quantity: date === cart.deliveryDate ? cartItem.quantity : 0,
                weight: date === cart.deliveryDate ? cartItem.weight : 0,
              })),
              totalQuantity: cartItem.quantity,
            };

            // Add item only if it has quantity in the date range
            const hasQuantityInDateRange = itemData.dataByDate.some(d => d.quantity > 0);
            if (hasQuantityInDateRange) {
              itemGroup.itemData.push(itemData);
              itemGroup.totalCount += cartItem.quantity;
              itemGroup.totalWeight += cartItem.weight;
              processedItems.add(cartItemName);
            }
          }
        });
      });
    });

    // Filter out items that have no quantity in the date range
    transformedData.forEach(group => {
      group.itemData = group.itemData.filter(item => item.totalQuantity > 0);
    });

    return res.success({
      status: 'SUCCESS',
      message: 'Customer total order report',
      data: { reportData: transformedData }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getPublishedInvoice = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    const getReport = await cart.findAll({
      attributes: [
        'deliveryDate',
        [fn('COUNT', fn('DISTINCT', col('customerAddressId'))), 'totalInvoice'],
        [fn('SUM', cast(col('deliveryCharges'), 'INTEGER')), 'totalDelivery'],
        [fn('SUM', cast(col('totalCost'), 'FLOAT')), 'totalCost'],
        [fn('SUM', cast(col('GST'), 'FLOAT')), 'totalGST'],
        [fn('SUM', cast(col('discountPrice'), 'FLOAT')), 'discountPrice'],
        [
          fn('SUM', literal('COALESCE(CAST("totalCost" AS FLOAT), 0) - COALESCE(CAST("deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("GST" AS FLOAT), 0)')),
          'itemCost'
        ]
      ],
      where: {
        publishedStatus: 1,
        adminId: adminId,
        deliveryDate: { [Op.between]: [formattedStartDate, formattedEndDate] }
      },
      group: ['deliveryDate'],
      order: [['deliveryDate', 'DESC']],
    });

    return res.success({
      data: getReport,
      message: 'Published Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getCustomerInvoice = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate, customerId is required.' });
    }
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    const getReport = await cart.findAll({
      attributes: [
        'id',
        'purchaseOrder',
        'invoiceNumber',
        'deliveryDate',
        'customerName',
        'customerFullAddress',
        'customerId',
        'customerAddressId',
        'discountPrice',
        [fn('COALESCE', literal('CAST("totalCost" AS FLOAT)'), 0), 'totalCost'],
        [fn('COALESCE', literal('CAST("deliveryCharges" AS FLOAT)'), 0), 'deliveryCharges'],
        [fn('COALESCE', literal('CAST("GST" AS FLOAT)'), 0), 'GST'],
        [fn('COALESCE', literal('CAST("discountPrice" AS FLOAT)'), 0), 'discountPrice'],
        'deliveryStatus',
        [
          fn('SUM', literal('COALESCE(CAST("totalCost" AS FLOAT), 0) - COALESCE(CAST("deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("GST" AS FLOAT), 0)')),
          'itemCost'
        ]
      ],
      where: {
        publishedStatus: 1,
        adminId,
        deliveryDate: { [Op.between]: [formattedStartDate, formattedEndDate] }
      },
      group: ['id', 'deliveryDate', 'customerId', 'customerAddressId', 'customerName', 'customerFullAddress', 'totalCost', 'deliveryCharges', 'GST', 'deliveryStatus', 'discountPrice',],
      order: [['invoiceNumber', 'ASC']],
    });
    const invoiceTotal = getReport.reduce(
      (totals, record) => {
        const recordData = record.toJSON(); // Convert each record to JSON

        return {
          totalCost: totals.totalCost + (isNaN(recordData.totalCost) ? 0 : recordData.totalCost),
          deliveryCharges: totals.deliveryCharges + (isNaN(recordData.deliveryCharges) ? 0 : recordData.deliveryCharges),
          GST: totals.GST + (isNaN(recordData.GST) ? 0 : recordData.GST),
          discountPrice: totals.discountPrice + (isNaN(recordData.discountPrice) ? 0 : recordData.discountPrice),
          itemCost: totals.itemCost + (isNaN(recordData.itemCost) ? 0 : recordData.itemCost),
        };
      },
      {
        totalCost: 0,
        deliveryCharges: 0,
        GST: 0,
        discountPrice: 0,
        itemCost: 0,
      }
    );
    return res.success({
      data: {
        data: getReport,
        invoiceTotal
      },
      message: 'Customer Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCustomerInvoicePdf = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      reportDate, customerId, customerAddressId
    } = req.body;
    if (!adminId || !reportDate || !customerId || !customerAddressId) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate, customerId, customerAddressId is required.' });
    }
    const curDate = new Date(reportDate);
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    let where = {
      adminId,
      deliveryDate: formattedDate,
      customerId,
      customerAddressId
    };
    const getReport = await cart.findAll({
      where,
      attributes: [
        'id',
        'customerName',
        'invoiceNumber',
        'customerFullAddress',
        ['customerTerms', 'paymentTerms'],
        'deliveryDate',
        'routeName',
        ['totalPieces', 'totalQuantity'],
        'totalCost',
        'deliveryCharges',
        'GST',
        'deliveryNumber',
        'customerId',
        'customerAddressId',
        'discountPrice',
        'discountPer',

        [
          fn('SUM', literal('COALESCE(CAST("carts"."totalCost" AS FLOAT), 0) - COALESCE(CAST("carts"."deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("carts"."GST" AS FLOAT), 0)')),
          'itemSubTotal'
        ]
      ],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: [
            'id',
            'itemGroupName',
            'itemName',
            'itemCode',
            'quantity',
            'itemPrice',
            'itemCost',
            'gstPercentage',
            'gstPrice'
          ],
        }
      ],
      group: [
        'carts.id',
        'carts.customerName',
        'carts.customerFullAddress',
        'carts.customerTerms',
        'carts.deliveryDate',
        'carts.routeName',
        'carts.totalPieces',
        'carts.totalCost',
        'carts.deliveryCharges',
        'carts.GST',
        'carts.invoiceNumber',
        'carts.discountPrice',
        'carts.discountPer',
        'carts.customerId',
        'carts.customerAddressId',
        'carts.deliveryNumber',
        'cartItemData.id',
        'cartItemData.itemGroupName',
        'cartItemData.itemName',
        'cartItemData.itemCode',
        'cartItemData.quantity',
        'cartItemData.itemPrice',
        'cartItemData.itemCost',
        'cartItemData.gstPercentage',
        'cartItemData.gstPrice'
      ],
      order: [['routeName', 'ASC']]
    });
    if (!getReport) {
      return res.recordNotFound({ message: 'Invoice not found' });
    }
    return res.success({
      data: getReport,
      message: 'Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getAllCustomerInvoicePdf = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { reportDate } = req.body;
    if (!adminId || !reportDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }
    const curDate = new Date(reportDate);
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    let where = {
      adminId,
      deliveryDate: formattedDate,
    };
    const getReport = await cart.findAll({
      where,
      attributes: [
        'id',
        'invoiceNumber',
        'customerName',
        'customerFullAddress',
        ['customerTerms', 'paymentTerms'],
        'deliveryDate',
        'routeName',
        ['totalPieces', 'totalQuantity'],
        'totalCost',
        'deliveryCharges',
        'GST',
        'deliveryNumber',
        'discountPrice',
        'discountPer',
        [
          fn('SUM', literal('COALESCE(CAST("carts"."totalCost" AS FLOAT), 0) - COALESCE(CAST("carts"."deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("carts"."GST" AS FLOAT), 0)')),
          'itemSubTotal'
        ]
      ],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: [
            'id',
            'itemGroupName',
            'itemName',
            'itemCode',
            'quantity',
            'itemPrice',
            'itemCost',
            'gstPercentage',
            'gstPrice'
          ],
        }
      ],
      group: [
        'carts.id',
        'carts.customerName',
        'carts.customerFullAddress',
        'carts.customerTerms',
        'carts.deliveryDate',
        'carts.routeName',
        'carts.totalPieces',
        'carts.totalCost',
        'carts.deliveryCharges',
        'carts.GST',
        'carts.invoiceNumber',
        'carts.discountPrice',
        'carts.discountPer',
        'carts.deliveryNumber',
        'cartItemData.id',
        'cartItemData.itemGroupName',
        'cartItemData.itemName',
        'cartItemData.itemCode',
        'cartItemData.quantity',
        'cartItemData.itemPrice',
        'cartItemData.itemCost',
        'cartItemData.gstPercentage',
        'cartItemData.gstPrice'
      ],
      order: [['routeName', 'ASC']]
    });

    return res.success({
      data: getReport,
      message: 'Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getInvoiceItemReport = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate, customerId is required.' });
    }
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    const getReport = await cart.findAll({
      attributes: [
        'id',
        'deliveryDate',
        'customerName',
        'customerFullAddress',
        'customerId',
        'customerAddressId',
        [fn('COALESCE', literal('CAST("totalCost" AS FLOAT)'), 0), 'totalCost'],
        [fn('COALESCE', literal('CAST("deliveryCharges" AS FLOAT)'), 0), 'deliveryCharges'],
        [fn('COALESCE', literal('CAST("GST" AS FLOAT)'), 0), 'GST'],
        [fn('COALESCE', literal('CAST("discountPrice" AS FLOAT)'), 0), 'discountPrice'],
        'deliveryStatus',
        [
          fn('SUM', literal('COALESCE(CAST("totalCost" AS FLOAT), 0) - COALESCE(CAST("deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("GST" AS FLOAT), 0)')),
          'itemCost'
        ]
      ],
      where: {
        adminId,
        deliveryDate: { [Op.between]: [formattedStartDate, formattedEndDate] }
      },
      group: ['id', 'deliveryDate', 'customerId', 'customerAddressId', 'customerName', 'customerFullAddress', 'totalCost', 'deliveryCharges', 'GST', 'deliveryStatus', 'discountPrice']
    });

    return res.success({
      data: getReport,
      message: 'Customer Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getPublishedInvoiceExcel = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate, id
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }

    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    let where = {
      adminId,
      deliveryDate: { [Op.between]: [formattedStartDate, formattedEndDate] }
    };
    if (id) {
      where.id = { [Op.in]: id };
    }
    const getReport = await cart.findAll({
      attributes: [
        'invoiceNumber',
        'deliveryDate',
        'customerLegacyCode',
        'customerName',
        'customerFullAddress',
        'discountPrice',
        [fn('COALESCE', literal('CAST("discountPrice" AS FLOAT)'), 0), 'discountPrice'],

        [fn('COALESCE', literal('CAST("totalCost" AS FLOAT)'), 0), 'gross'],
        [fn('COALESCE', literal('CAST("GST" AS FLOAT)'), 0), 'tax'],
        [
          fn('SUM', literal('COALESCE(CAST("totalCost" AS FLOAT), 0) - COALESCE(CAST("discountPrice" AS FLOAT), 0) - COALESCE(CAST("GST" AS FLOAT), 0)')),
          'net'
        ]
      ],
      where,
      group: ['invoiceNumber', 'deliveryDate', 'customerLegacyCode', 'customerName', 'customerFullAddress', 'totalCost', 'deliveryCharges', 'GST', 'discountPrice']
    });

    return res.success({
      data: getReport,
      message: 'Published Invoice Excel'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getPublishedAccountingExcel = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate, id
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }

    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    let where = {
      adminId,
      deliveryDate: { [Op.between]: [formattedStartDate, formattedEndDate] }
    };
    if (id) {
      where.id = { [Op.in]: id };
    }
    const getReport = await cart.findAll({
      attributes: [
        ['customerName', 'contactName'],
        'customerEmail',
        'address1',
        'address2',
        'address3',
        'cityName',
        'postcode',
        'countryName',
        'stateName',
        'invoiceNumber',
        ['deliveryDate', 'invoiceDate'],
        'dueDate',
        'discountPrice',
        'discountPer',
      ],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: [['itemCode', 'inventoryItemCode'], 'itemName', 'quantity', ['itemPrice', 'UnitAmount'], 'accountingCode', 'taxType'],
        }
      ],
      where,
      raw: true,
    });

    return res.success({
      data: getReport,
      message: 'Published Accounting Excel Data'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getUnprocessedInvoiceList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { reportDate } = req.body;
    if (!adminId || !reportDate) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId, reportDate is required.' });
    }
    const curDate = new Date(reportDate);
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    let where = {
      adminId,
      publishedStatus: 0,
      deliveryDate: formattedDate
    };
    if (curDate >= today) {
      where.publishedStatus = 123;
    }

    const getReport = await cart.findAll({
      attributes: [
        'id',
        'invoiceNumber',
        'deliveryDate',
        'customerName',
        'customerFullAddress',
        'customerId',
        'customerAddressId',
        'discountPrice',
        [fn('ROUND', literal('CAST("totalCost" AS NUMERIC)'), 2), 'totalCost'],
        [fn('COALESCE', literal('CAST("deliveryCharges" AS FLOAT)'), 0), 'deliveryCharges'],
        [fn('COALESCE', literal('CAST("GST" AS FLOAT)'), 0), 'GST'],
        [fn('COALESCE', literal('CAST("discountPrice" AS FLOAT)'), 0), 'discountPrice'],
        'deliveryStatus',
        [
          fn('SUM', literal('COALESCE(CAST("totalCost" AS FLOAT), 0) - COALESCE(CAST("deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("GST" AS FLOAT), 0)')),
          'itemCost'
        ]
      ],
      where,
      group: ['id', 'deliveryDate', 'customerId', 'customerAddressId', 'customerName', 'customerFullAddress', 'totalCost', 'deliveryCharges', 'GST', 'deliveryStatus', 'discountPrice'],
      order: [['deliveryDate', 'DESC']],
    });

    return res.success({
      data: getReport,
      message: 'Customer Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getUnprocessedTotalInvoice = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const curDate = new Date();
    // curDate.setHours(11, 30, 0, 0);
    const isAfter12_30PM = (curDate.getHours() > 12) || (curDate.getHours() === 12 && curDate.getMinutes() > 30);
    if (isAfter12_30PM) {
      curDate.setDate(curDate.getDate() + 1);
    }

    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    if (!adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! adminId is required.' });
    }

    const getReport = await cart.findAll({
      attributes: [
        'deliveryDate',
        [fn('COUNT', fn('DISTINCT', col('customerAddressId'))), 'totalInvoice'],
        [fn('SUM', cast(col('deliveryCharges'), 'INTEGER')), 'totalDelivery'],
        [fn('SUM', cast(col('totalCost'), 'FLOAT')), 'totalCost'],
        [fn('SUM', cast(col('GST'), 'FLOAT')), 'totalGST'],
        [fn('SUM', cast(col('discountPrice'), 'FLOAT')), 'discountPrice'],
        [
          fn('SUM', literal('COALESCE(CAST("totalCost" AS FLOAT), 0) - COALESCE(CAST("deliveryCharges" AS FLOAT), 0) - COALESCE(CAST("GST" AS FLOAT), 0)')),
          'itemCost'
        ]
      ],
      where: {
        publishedStatus: 0,
        adminId: adminId,
        // Compare deliveryDate with current date plus 12:30 PM
        deliveryDate: { [Op.lte]: formattedDate }
      },
      group: ['deliveryDate'],
      order: [['deliveryDate', 'DESC']],
    });

    return res.success({
      data: getReport,
      message: 'Published Invoice Report'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const submitPublishedCustomer = async (req, res) => {
  try {
    const { id, } = req.body;

    if (!id || id.length === 0) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }

    try {
      const futureInvoice = await cart.findOne({
        where: {
          publishedStatus: 0,
          id: { [Sequelize.Op.in]: id },
        },
        attributes: ['deliveryDate'],
      });
      const earliestInvoice = await cart.findOne({
        where: { publishedStatus: 0 },
        attributes: ['deliveryDate'],
        order: [['deliveryDate', 'ASC']],
      });

      if (earliestInvoice && earliestInvoice.deliveryDate) {
        if (earliestInvoice.deliveryDate !== futureInvoice.deliveryDate) {
          return res.failure({ message: 'You can only update orders with today or earlier delivery dates.' });
        }
        const deliveryDate = new Date(futureInvoice.deliveryDate);
        const todayDate = new Date();
        todayDate.setDate(todayDate.getDate() + 1);
        if (deliveryDate > todayDate) {
          return res.failure({ message: 'Cannot publish future invoices. Publish earlier dates first.' });
        }
      }
      const result = await cart.update(
        { publishedStatus: 1 },
        {
          where: {
            id: { [Sequelize.Op.in]: id },
            publishedStatus: 0,
          }
        }
      );

      if (result[0] > 0) {
        return res.success({ message: 'Customer(s) Published Successfully' });
      } else {
        return res.failure({ message: 'No customers found with the provided IDs' });
      }
    } catch (error) {
      console.error('Failed to update:', error);
      return res.failure({ message: 'Failed to update customers' });
    }
  } catch (error) {
    console.error('Internal server error:', error);
    return res.internalServerError({ message: 'Internal server error' });
  }
};

const getOrderByCustomer = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      startDate, endDate
    } = req.body;

    if (!adminId || !startDate || !endDate) {
      return res.badRequest({ message: 'Insufficient request parameters! startDate, endDate, adminId is required.' });
    }

    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    const where = {
      adminId,
      deliveryDate: { [Op.between]: [formattedStartDate, formattedEndDate] }
    };

    const getReport = await cart.findAll({
      where,
      attributes: ['id', 'deliveryDate'],
      include: [
        {
          model: cartItem,
          as: 'cartItemData',
          attributes: ['id', 'itemId', 'itemGroupId', 'itemGroupName', 'cartId', 'customerId', 'itemName', 'quantity', 'weight'],
        },
        {
          model: customer,
          as: 'customerData',
          attributes: ['legalName'],
        },
      ]
    });

    // Collect all distinct delivery dates within the range
    const allDeliveryDates = [];
    for (let date = new Date(startDate); date <= new Date(endDate); date.setDate(date.getDate() + 1)) {
      allDeliveryDates.push(new Date(date).toISOString().split('T')[0]);
    }

    const transformedData = getReport.reduce((acc, order) => {
      const customerName = order.customerData.legalName;

      let customer = acc.find(c => c.customerName === customerName);
      if (!customer) {
        customer = {
          customerName,
          items: [],
          totalCount: 0,
          totalWeight: 0
        };
        acc.push(customer);
      }

      order.cartItemData.forEach(item => {
        let group = customer.items.find(g => g.itemGroupName === item.itemGroupName);
        if (!group) {
          group = {
            itemGroupName: item.itemGroupName,
            itemData: [],
            totalCount: 0,
            totalWeight: 0
          };
          customer.items.push(group);
        }

        let itemEntry = group.itemData.find(i => i.itemName === item.itemName);
        if (!itemEntry) {
          itemEntry = {
            itemName: item.itemName,
            weight: +item.weight,
            dataByDate: allDeliveryDates.map(date => ({
              deliveryDate: date,
              quantity: 0,
              weight: 0,
              itemId: item.itemId,
              itemGroupId: item.itemGroupId
            })),
            totalQuantity: 0,
          };
          group.itemData.push(itemEntry);
        }

        const dateEntry = itemEntry.dataByDate.find(d => d.deliveryDate === order.deliveryDate);
        if (dateEntry) {
          dateEntry.quantity += item.quantity;
          dateEntry.weight += +item.weight * item.quantity;
          itemEntry.totalQuantity += item.quantity;
        }

        group.totalCount += item.quantity;
        group.totalWeight += +item.weight * item.quantity;
        customer.totalCount += item.quantity;
        customer.totalWeight += +item.weight * item.quantity;
      });

      return acc;
    }, []);

    return res.success({
      data: { reportData: transformedData },
      message: 'Get Order By Customer'
    });

  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getDriverReport,
  getPackingSlipReport,
  getMatrixReport,
  customerTotalOrderReport,
  getPublishedInvoice,
  getCustomerInvoice,
  getCustomerInvoicePdf,
  getAllCustomerInvoicePdf,
  getInvoiceItemReport,
  getPublishedInvoiceExcel,
  getPublishedAccountingExcel,
  getUnprocessedInvoiceList,
  getUnprocessedTotalInvoice,
  submitPublishedCustomer,
  allCustomerTotalOrderReport,
  getOrderByCustomer,

};