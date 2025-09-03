/**
 * commonController.js
 * @description :: exports customer methods
 */
const { PAYMENT_TERMS } = require('@constants/authConstant');
const {
  customer,
  route,
  countries,
  customerWeek,
  state,
  user,
  itemGroup,
  role,
  cart,
  cartItem,
  order,
  orderItem,
  menu,
  supplier,
  rawMaterial,
  rawMaterialProduct,
  customerItem,
  item,
  customerAddress,
  week,
} = require('@model/index');
const dbService = require('@utils/dbService');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Op, Sequelize, fn, col, literal } = require('sequelize');

const { capitalize, toLowerCase } = require('@helpers/function');
const Item = require('../../model/item');
const ItemGroup = require('../../model/itemGroup');
const Customer = require('../../model/customer');
const CustomerAddress = require('../../model/customerAddress');
const OrderItem = require('../../model/orderItem');
const Order = require('../../model/order');
const Route = require('../../model/route');
const CustomerWeek = require('../../model/customerWeek');
// const { route } = require('../../model');

/**
 * @description : get country list
 * @param {Object} req : request for country
 * @param {Object} res : response for country
 * @return {Object} : response for country { data}
 */
const getCountryList = async (req, res) => {
  try {
    const { id } = req.body;
    let where = {
      isDeleted: false,
      isActive: true,
    };
    if (id) {
      where = { isDeleted: false };
    }
    const getData = await countries.findAll({
      where: where,
      attributes: ['id', 'countryName'],
      order: [['countryName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Country List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get state list
 * @param {Object} req : request for state
 * @param {Object} res : response for state
 * @return {Object} : response for state {data}
 */
const getStateList = async (req, res) => {
  try {
    const { id, countryId } = req.body;
    let where = {
      isDeleted: false,
      isActive: true,
      countryId: countryId,
    };
    if (id) {
      where = { isDeleted: false };
    }
    const getData = await state.findAll({
      where: where,
      attributes: ['id', 'stateName'],
      order: [['stateName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'State List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get route list
 * @param {Object} req : request for route
 * @param {Object} res : response for route
 * @return {Object} : response for route {data}
 */
const getRouteList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.body;
    let where = {
      isDeleted: false,
      isActive: true,
    };
    where.adminId = adminId;
    if (id) {
      where = { isDeleted: false };
    }
    const getData = await route.findAll({
      where: where,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Route List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getDateRouteList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { date } = req.body;
    if (!adminId || !date) {
      return res.badRequest({
        message: 'Insufficient request parameters! adminId, date is required.',
      });
    }
    const curDate = new Date(date);
    const formattedDate = curDate.toISOString().split('T')[0]; // Format date to YYYY-MM-DD
    const weekDaysShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekDaysFull = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const weekDayIndex = curDate.getDay();
    const shortWeekDayName = weekDaysShort[weekDayIndex];
    const capitalizedWeekDay = weekDaysFull[weekDayIndex];

    const where = {
      adminId,
      deliveryDate: formattedDate,
    };
    const orders = await order.findAll({
      where: {
        [Op.and]: [
          Sequelize.literal(
            `CAST("order"."${shortWeekDayName}"->>'quantity' AS INTEGER) > 0`
          ),
          ,
          {
            '$customerAddressData.weekData.weekData.name$': capitalizedWeekDay,
          },
        ],
      },
      attributes: ['id'],
      include: [
        {
          model: customerAddress,
          as: 'customerAddressData',
          include: [
            {
              model: customerWeek,
              as: 'weekData',
              where: { type: true },
              include: [
                {
                  model: route,
                  as: 'routeData',
                  attributes: ['id', 'name'],
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
        {
          model: orderItem,
          as: 'orderItemData',
          attributes: ['id', [`${shortWeekDayName}`, 'quantity']],
        },
      ],
    });
    const transformedOrders = orders.map((order) => {
      const _Obj = order.toJSON();
      const route = _Obj.customerAddressData.weekData[0]?.routeData || {};
      return {
        id: _Obj.id,
        routeName: route.name || '',
        routeId: route.id || null,
      };
    });
    const getReport = await cart.findAll({
      where: where,
      attributes: ['id', 'routeId', 'routeName'],
      group: ['routeId', 'routeName', 'carts.id'],
      order: [['routeName', 'ASC']],
    });

    const mergedReport = [...getReport, ...transformedOrders];
    const sortedReport = mergedReport.sort((a, b) => {
      if (a.routeName < b.routeName) {
        return -1;
      }
      if (a.routeName > b.routeName) {
        return 1;
      }
      return 0;
    });
    const seen = new Set();
    const data = sortedReport
      .filter((route) => {
        const identifier = `${route.routeId}-${route.routeName}`;
        if (!seen.has(identifier)) {
          seen.add(identifier);
          return true;
        }
        return false;
      })
      .map((route) => ({
        id: route.routeId,
        name: route.routeName,
      }));

    return res.success({
      data,
      message: 'Route List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get itemGroup list
 * @param {Object} req : request for itemGroup
 * @param {Object} res : response for itemGroup
 * @return {Object} : response for itemGroup { data}
 */
const getItemGroupList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.body;
    let where = {
      isDeleted: false,
      isActive: true,
    };
    where.adminId = adminId;
    if (id) {
      where = { isDeleted: false };
    }
    const getData = await itemGroup.findAll({
      where: where,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Item Group List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get country list
 * @param {Object} req : request for country
 * @param {Object} res : response for country
 * @return {Object} : response for country { data}
 */
const getFilterCountryList = async (req, res) => {
  try {
    const getData = await countries.findAll({
      attributes: ['id', 'countryName'],
      order: [['countryName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Country List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get state list
 * @param {Object} req : request for state
 * @param {Object} res : response for state
 * @return {Object} : response for state {data}
 */
const getFilterStateList = async (req, res) => {
  try {
    const { countryId } = req.body;
    let where = { countryId: countryId };
    const getData = await state.findAll({
      where: where,
      attributes: ['id', 'stateName'],
      order: [['stateName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'State List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get route list
 * @param {Object} req : request for route
 * @param {Object} res : response for route
 * @return {Object} : response for route {data}
 */
const getFilterRouteList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await route.findAll({
      where: { adminId },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Route List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get itemGroup list
 * @param {Object} req : request for itemGroup
 * @param {Object} res : response for itemGroup
 * @return {Object} : response for itemGroup { data}
 */
const getFilterItemGroupList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await itemGroup.findAll({
      where: { adminId },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Item Group List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : get customer list
 * @param {Object} req : request for customer
 * @param {Object} res : response for customer
 * @return {Object} : response for customer { data}
 */
const getFilterCustomerList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await customer.findAll({
      where: { adminId },
      attributes: ['id', ['tradingName', 'legalName']],
      order: [['tradingName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Customer List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCustomerBySearch = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    // const requestParams = req.body;
    const requestParams = req.query;
    const customerName = requestParams['customer-name'];
    if (!customerName) {
      return res.recordNotFound({ message: 'Customer not found..' });
    }
    const getData = await customer.findAll({
      attributes: ['id', 'tradingName'],
      where: {
        adminId,
        searchTradingName: { [Op.like]: `%${customerName}%` },
      },
      limit: 10,
    });
    if (getData.length === 0) {
      return res.recordNotFound({ message: 'Customer not found..' });
    }
    return res.success({
      data: getData,
      message: 'Get Customer List By Search',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getRoleList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await role.findAll({
      where: {
        adminId,
        isActive: true,
      },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Role List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getFilterRoleList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await role.findAll({
      where: { adminId },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Filter Role List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getMenuList = async (req, res) => {
  try {
    const getData = await menu.findOne({ attributes: ['id', 'menuKeys'] });
    return res.success({
      data: getData,
      message: 'Menu List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getSupplierList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await supplier.findAll({
      where: {
        adminId,
        isActive: true,
      },
      attributes: ['id', 'companyName'],
      order: [['companyName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Supplier List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getFilterSupplierList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await supplier.findAll({
      where: { adminId },
      attributes: ['id', 'companyName'],
      order: [['companyName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Filter Supplier List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getRawMaterialList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { supplierId } = req.body;
    let where = {
      supplierId: supplierId ? supplierId : null,
      adminId,
    };
    const getData = await rawMaterial.findAll({
      where: {
        productType: 'Standard',
        adminId,
      },
      attributes: [
        'id',
        'brandName',
        'name',
        'sku',
        'size',
        ['shortNameType', 'unitType'],
      ],
      include: [
        {
          // required:false,
          model: rawMaterialProduct,
          where,
          as: 'singleProductDetails',
          attributes: ['id', 'purchaseCartonQty', 'purchasedBy', 'buyPrice'],
        },
      ],
      order: [['brandName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Raw Material List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const productRawMaterialList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    let where = {
      isDeleted: false,
      isActive: true,
      adminId,
      productType: 'Standard',
    };
    const getData = await rawMaterial.findAll({
      where,
      attributes: [
        'id',
        'brandName',
        'name',
        'sku',
        'size',
        ['shortNameType', 'unitType'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.cast(Sequelize.col('productDetails.buyPrice'), 'NUMERIC')
          ),
          'buyPriceSum',
        ],
        [
          Sequelize.fn('COUNT', Sequelize.col('productDetails.id')),
          'noOfSupplier',
        ],
      ],
      include: [
        {
          model: rawMaterialProduct,
          as: 'productDetails',
          attributes: [],
        },
      ],
      order: [['brandName', 'ASC']],
      group: ['rawMaterial.id'],
    });
    return res.success({
      data: getData,
      message: 'Raw Material List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const productionRawMaterialList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    let where = {
      isDeleted: false,
      isActive: true,
      adminId,
      productType: 'Production',
    };
    const getData = await rawMaterial.findAll({
      where,
      attributes: [
        'id',
        'brandName',
        'name',
        'sku',
        'size',
        ['shortNameType', 'unitType'],
      ],
      order: [['brandName', 'ASC']],
    });
    return res.success({
      data: getData,
      message: 'Raw Material List',
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const uploadItemExcel = async (req, res) => {
  try {
    if (!req.file) return res.failure({ message: 'No file uploaded.' });

    const adminId = req.headers['admin-id'];
    console.log('====================================');
    console.log('adminId', adminId);
    console.log('====================================');
    const filePath = path.join(__dirname, '../../excel', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const formattedData = XLSX.utils.sheet_to_json(sheet);

    // Step 1: Extract unique item groups
    const uniqueItemGroups = new Map();
    formattedData.forEach((row) => {
      const itemGroupName = row['Item Group*']?.trim();
      if (itemGroupName && !uniqueItemGroups.has(itemGroupName)) {
        uniqueItemGroups.set(itemGroupName, {
          name: itemGroupName,
          description: '', // optional if available
          isActive: true,
          isDeleted: false,
          adminId,
        });
      }
    });

    // Step 2: Bulk create item groups
    const itemGroupsToCreate = Array.from(uniqueItemGroups.values());

    /*
     * Check if item groups already exist to avoid duplicates (optional)
     * You can do a findAll with { where: { name: [...itemGroupNames], adminId } }
     * and remove existing from itemGroupsToCreate.
     */

    const createdItemGroups = await ItemGroup.bulkCreate(itemGroupsToCreate, {
      returning: true,
    });

    // Step 3: Map item group names to IDs
    const itemGroupNameToIdMap = new Map();
    createdItemGroups.forEach((group) => {
      itemGroupNameToIdMap.set(group.name, group.id);
    });

    // Step 4: Prepare items for bulk insert
    const itemsToCreate = [];
    formattedData.forEach((row) => {
      if (!row['Name*'] || !row['Item Group*']) return;

      const itemGroupName = row['Item Group*'].trim();
      const itemGroupId = itemGroupNameToIdMap.get(itemGroupName);
      if (!itemGroupId) return;

      itemsToCreate.push({
        name: row['Name*'],
        description: row['Description'] || '',
        wholeSalePrice: parseFloat(row['Price*']) || 0,
        retailPrice: parseFloat(row['Retail price*']) || 0,
        taxStructure: row['Tax*'] > 0 ? 'GST' : 'No GST',
        gstPercentage: row['Tax*'] || 0,
        weight: row['Weight*'] || 0,
        legacyCode: row['Item Code*'] || '',
        itemGroupId,
        accountingCode: row['Accounting Code'] || '',
        barcodeType: row['Barcode type'] || '',
        barcodeValue: row['Barcode value'] || '',
        adminId,
      });
    });

    // Step 5: Bulk insert items
    await Item.bulkCreate(itemsToCreate);

    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete file: ${err.message}`);
    });

    return res.success({
      message: `Item groups and items imported successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.internalServerError({ message: error.message });
  }
};

const DAY_MAP = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  7: 'sun',
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
  sunday: 'sun',
};

const uploadOrderExcel = async (req, res) => {
  try {
    if (!req.file) return res.failure({ message: 'No file uploaded.' });

    const adminId = req.headers['admin-id'];
    const filePath = path.join(__dirname, '../../excel', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Grouped data structure
    const groupedOrders = new Map();

    for (const row of rows) {
      const dayRaw = (row['Day'] || '').toString().toLowerCase();
      const day = DAY_MAP[dayRaw];
      const quantity = Number(row['Quantity']) || 0;
      const itemName = row['ItemName']?.trim();
      const customerName = row['CustomerName']?.trim();
      const addressLine = row['Address'];
      const itemGroupName = row['ItemGroup']?.trim();
      const price = Number(row['Price']) || 0;

      if (
        !day ||
        !quantity ||
        !itemName ||
        !customerName ||
        !addressLine ||
        !itemGroupName
      )
        continue;

      const customer = await Customer.findOne({
        where: {
          legalName: customerName,
          adminId,
        },
      });
      if (!customer) continue;

      const address = await CustomerAddress.findOne({
        where: {
          customerId: customer.id,
          address1: { [Op.iLike]: `%${addressLine}%` },
        },
      });
      if (!address) continue;

      const item = await Item.findOne({
        where: {
          name: itemName,
          adminId,
        },
      });
      if (!item) continue;

      const itemGroup = await ItemGroup.findOne({
        where: {
          name: itemGroupName,
          adminId,
        },
      });
      if (!itemGroup) continue;

      const orderKey = `${customer.id}_${address.id}`;
      const itemKey = `${itemGroup.id}_${item.id}`;

      if (!groupedOrders.has(orderKey)) {
        groupedOrders.set(orderKey, new Map());
      }

      const itemMap = groupedOrders.get(orderKey);

      if (!itemMap.has(itemKey)) {
        itemMap.set(itemKey, {
          customerId: customer.id,
          customerAddressId: address.id,
          itemId: item.id,
          itemGroupId: itemGroup.id,
          price,
          mon: 0,
          tue: 0,
          wed: 0,
          thu: 0,
          fri: 0,
          sat: 0,
          sun: 0,
        });
      }

      itemMap.get(itemKey)[day] += quantity;
    }

    // Insert into DB
    for (const [orderKey, itemMap] of groupedOrders.entries()) {
      const sampleItem = [...itemMap.values()][0];

      const daySummary = {
        mon: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
        tue: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
        wed: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
        thu: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
        fri: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
        sat: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
        sun: {
          quantity: 0,
          costPerDay: 0,
          deliveryType: false,
          costPerDayWithDelivery: 0,
          retailValuePerDay: 0,
        },
      };

      const orderItemsPayload = [];
      let totalPieces = 0;
      let itemCost = 0;

      for (const itemData of itemMap.values()) {
        const totalQty =
          itemData.mon +
          itemData.tue +
          itemData.wed +
          itemData.thu +
          itemData.fri +
          itemData.sat +
          itemData.sun;

        const totalItemCost = totalQty * itemData.price;
        itemCost += totalItemCost;
        totalPieces += totalQty;

        orderItemsPayload.push({
          adminId,
          orderId: 0, // temporarily 0, will update later
          customerId: itemData.customerId,
          customerAddressId: itemData.customerAddressId,
          itemId: itemData.itemId,
          itemGroupId: itemData.itemGroupId,
          mon: itemData.mon,
          tue: itemData.tue,
          wed: itemData.wed,
          thu: itemData.thu,
          fri: itemData.fri,
          sat: itemData.sat,
          sun: itemData.sun,
          totalQuantity: totalQty,
          itemCost: totalItemCost,
        });

        // Fill daily summary
        for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
          if (itemData[day] > 0) {
            daySummary[day].quantity += itemData[day];
            daySummary[day].costPerDay += itemData[day] * itemData.price;
          }
        }
      }

      // Finalize delivery flags and calculated fields
      for (const day of Object.keys(daySummary)) {
        const d = daySummary[day];
        if (d.quantity > 0) {
          d.deliveryType = true;
          d.costPerDayWithDelivery = d.costPerDay; // add delivery if any
          d.retailValuePerDay = parseFloat((d.costPerDay * 1.54).toFixed(2)); // example markup
        }
      }

      // Create Order
      const order = await Order.create({
        adminId,
        customerId: sampleItem.customerId,
        customerAddressId: sampleItem.customerAddressId,
        deliveryType: 'Free delivery',
        deliveryCharges: 0,
        itemCost,
        totalPieces,
        totalCost: itemCost,
        ...daySummary,
      });

      // Update orderId in all order items and bulk insert
      const finalItems = orderItemsPayload.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await OrderItem.bulkCreate(finalItems);
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err.message}`);
    });

    return res.success({ message: 'Orders imported successfully.' });
  } catch (error) {
    console.error(error);
    return res.internalServerError({ message: error.message });
  }
};

const uploadExel = async (req, res) => {
  try {
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(100);
    const adminId = req.headers['admin-id'] || null;
    if (!req.file) return res.failure({ message: 'No file uploaded.' });

    const filePath = path.join(__dirname, '../../excel', req.file.filename);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rawData.length === 0)
      return res.failure({ message: 'Excel data is empty' });

    const headers = rawData[0];
    const requiredHeaders = ['Name', 'EmailAddress', 'POAddressLine1'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.failure({
        message: `Missing headers: ${missingHeaders.join(', ')}`,
      });
    }

    const formattedData = XLSX.utils.sheet_to_json(sheet);
    const customerMap = new Map();

    formattedData.forEach((row) => {
      const email = row['EmailAddress']?.toLowerCase().trim();
      const poAddress = row['POAddressLine1']?.trim();
      if (!email || !row['Name'] || !poAddress) return;

      const uniqueCustomerKey = `${email}__${poAddress}`;
      const mobile = row['PhoneNumber']
        ? String(row['PhoneNumber']).replace(/\s+/g, '')
        : null;

      // सिर्फ़ PO address
      const addresses = [];
      if (row['POAddressLine1']) {
        addresses.push({
          type: 'PO',
          address1: row['POAddressLine1'],
          address2: row['POAddressLine2'],
          address3: row['POAddressLine3'],
          cityName: row['POCity'],
          postcode: row['POPostalCode'],
          availabilityCode: row['POAvailability'],
        });
      }

      if (customerMap.has(uniqueCustomerKey)) {
        const existing = customerMap.get(uniqueCustomerKey);
        existing.addresses.push(...addresses);
      } else {
        customerMap.set(uniqueCustomerKey, {
          requestParam: {
            legalName: row['Name'],
            tradingName: row['Name'],
            email,
            paymentTerms: 'COD',
            mobileNumber: mobile,
            websiteUrl: null,
            gstReg: null,
            discount: null,
            note: null,
            deliveryInstructions: null,
          },
          addresses,
        });
      }
    });

    let processedRowCount = 0;
    const tasks = Array.from(customerMap.values()).map((customer, i) =>
      limit(async () => {
        const mockReq = {
          body: customer.requestParam,
          headers: { 'admin-id': adminId },
        };
        const result = await addCustomer(
          mockReq,
          res,
          i + 2,
          customer.addresses
        );
        if (result.success) processedRowCount++;
        return result;
      })
    );

    const results = await Promise.all(tasks);

    fs.unlink(filePath, (err) => {
      if (err)
        console.error(`Failed to delete file ${filePath}: ${err.message}`);
    });

    const successCount = results.filter((r) => r.success).length;
    const errors = results.filter((r) => !r.success).map((r) => r.message);

    return res.success({
      message: `File processed: ${successCount} rows succeeded, ${errors.length} rows failed.`,
      data: { errors },
    });
  } catch (error) {
    console.error('error', error);
    return res.internalServerError({ message: error.message });
  }
};
async function addCustomer(mockReq, res, rowNumber, addressRequestParam) {
  try {
    const requestParam = mockReq.body;
    const adminId = mockReq.headers['admin-id'];
    // Mandatory Fields Check
    if (!requestParam.legalName || !requestParam.email || !adminId) {
      return {
        success: false,
        message: `Row ${rowNumber}: Missing required fields.`,
      };

      /*
       * return res.badRequest({
       *   message: `Row ${rowNumber}: Insufficient request parameters! 'legalName', 'email', and 'admin-id' are required.`,
       * });
       */
    }

    // Check if Email Already Exists for the Admin
    const where = {
      email: requestParam.email.toLowerCase(),
      adminId,
    };

    if (await customer.findOne({ where })) {
      return {
        success: false,
        message: `Row ${rowNumber}: Email already exists.`,
      };
      // return res.failure({ message: `Row ${rowNumber}: Email '${requestParam.email}' already exists.`, });
    }

    const dataToCreate = { ...requestParam };
    dataToCreate.email = requestParam.email.toLowerCase();
    dataToCreate.legalName = capitalize(requestParam.legalName);
    dataToCreate.tradingName = requestParam.legalName.toLowerCase();
    dataToCreate.searchTradingName = toLowerCase(requestParam.legalName);

    // Discount Validation (Optional)
    if (
      requestParam.discount !== undefined &&
      requestParam.discount !== null &&
      requestParam.discount !== ''
    ) {
      if (isNaN(requestParam.discount)) {
        return {
          success: false,
          message: `Row ${rowNumber}: Discount must be a valid number.`,
        };
        /*
         * return res.failure({
         *   message: `Row ${rowNumber}: Discount must be a valid number.`,
         * });
         */
      }
      const discountValue = parseFloat(requestParam.discount);
      if (discountValue < 0 || discountValue > 100) {
        return {
          success: false,
          message: `Row ${rowNumber}: Discount amount must be between 0 and 100.`,
        };
        /*
         * return res.failure({
         *   message: `Row ${rowNumber}: Discount amount must be between 0 and 100.`,
         * });
         */
      }
      dataToCreate.discount = discountValue;
    }

    // Mobile Number Formatting (Optional)
    if (requestParam.mobileNumber) {
      dataToCreate.mobileNumber = requestParam.mobileNumber
        .trim()
        .replace(/\s+/g, '')
        .toString();
    }

    // Website URL Formatting (Optional)
    if (requestParam.websiteUrl) {
      dataToCreate.websiteUrl = requestParam.websiteUrl.trim();
    }

    dataToCreate.adminId = adminId;

    // Proceed to Create Customer
    const createdCustomer = await dbService.createOne(customer, dataToCreate);
    if (!createdCustomer) {
      return {
        success: false,
        message: `Row ${rowNumber}: Failed to create customer.`,
      };
      /*
       * return res.failure({
       *   message: `Row ${rowNumber}: Failed to create customer.`,
       * });
       */
    }

    const items = await item.findAll({
      where: {
        isDeleted: false,
        adminId,
      },
      attributes: [['id', 'itemId'], 'itemGroupId'],
    });

    const customerItems = items.map((itemRecord) => ({
      ...itemRecord.toJSON(),
      customerId: createdCustomer.id,
      adminId,
    }));
    const allCreatedAddresses = [];

    for (const addr of addressRequestParam) {
      const customerAddressObj = {
        customerId: createdCustomer.id,
        adminId,
        address1: addr.address1,
        address2: addr.address2,
        address3: addr.address3,
        cityName: addr.cityName,
        postcode: addr.postcode,
        countryId: '67b0ae40-0fd4-4f25-9c17-0c99460fd72d',
        stateId: '6872e1a6-1d8b-41a9-9eac-e6db3a53868b',
        deliveryType: 'Free delivery',
        defaultAddress: addr.type === 'PO', // only PO marked as default
      };

      const createdAddress = await dbService.createOne(
        customerAddress,
        customerAddressObj
      );
      allCreatedAddresses.push({
        ...createdAddress.toJSON(),
        availabilityCode: addr.availabilityCode,
      });
    }
    /*
     * const customerAddressObj = {
     *   customerId: createdCustomer.id,
     *   adminId,
     *   address1: addressRequestParam.address1,
     *   address2: addressRequestParam.address2,
     *   address3: addressRequestParam.address3,
     *   cityName: addressRequestParam.cityName,
     *   postcode: addressRequestParam.postcode,
     *   countryId: '67b0ae40-0fd4-4f25-9c17-0c99460fd72d',
     *   stateId: '6872e1a6-1d8b-41a9-9eac-e6db3a53868b',
     *   deliveryType: 'Free delivery',
     *   defaultAddress: true,
     * };
     */

    await dbService.createMany(customerItem, customerItems);
    // const getAddressData = await dbService.createOne(customerAddress, customerAddressObj);

    const getWeekData = await week.findAll({
      where: {
        isDeleted: false,
        // type: true,
        adminId,
      },
      attributes: ['id', 'type', 'displayOrder'],
      order: [['displayOrder', 'ASC']],
    });
    const routeData = await route.findOne({
      where: { adminId },
      attributes: ['id'],
    });
    const routeId = routeData?.id || null;
    // 🧠 Sorted week by displayOrder: [Monday (1), ..., Sunday (7)]
    const sortedWeekDays = [...getWeekData].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    for (const addr of allCreatedAddresses) {
      let rawCode = String(addr.availabilityCode || '').trim();
      if (rawCode.length === 6) rawCode = rawCode + '0';
      if (rawCode.length < 7) rawCode = rawCode.padStart(7, '0');

      // console.log('🏠 Address:', addr.id, 'Code:', rawCode);

      const weekData = [];

      for (let i = 0; i < 7; i++) {
        const weekDay = sortedWeekDays[i];
        if (!weekDay) continue;

        if (rawCode[i] === '1') {
          weekData.push({
            adminId,
            customerId: createdCustomer.id,
            customerAddressId: addr.id,
            weekDayId: weekDay.id,
            // type: weekDay.type,
            type: true,
            routeId,
            routeType: true,
          });
        } else {
          weekData.push({
            adminId,
            customerId: createdCustomer.id,
            customerAddressId: addr.id,
            weekDayId: weekDay.id,
            type: false,
            routeId: null,
            routeType: false,
          });
        }
      }

      // console.log('✅ Final weekData to insert:', weekData);

      if (weekData.length) {
        await dbService.createMany(customerWeek, weekData);
      }
    }
    return { success: true };

    // return true;
    /*
     * return res.success({
     *   message: `Row ${rowNumber}: Customer created successfully.`
     * });
     */
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: `Row ${rowNumber}: Unexpected error.`,
    };
    // return res.internalServerError({ message: `Row ${rowNumber}: An unexpected error occurred.`, });
  }
}

const insertDeliveryDays = async (
  body,
  customerAddressId,
  customerId,
  adminId
) => {
  if (!body.weekData || body.weekData.length === 0) return;
  const dataArray = [];
  for (const data of body.weekData) {
    const existingRecord = await customerWeek.findOne({
      where: {
        customerAddressId,
        customerId,
        weekDayId: data.weekDayId,
        adminId,
      },
      include: [
        {
          model: week,
          as: 'weekData',
          attributes: ['id', 'name'],
        },
      ],
    });
    if (existingRecord) {
      await dbService.update(
        customerWeek,
        {
          customerAddressId,
          customerId,
          weekDayId: data.weekDayId,
          adminId,
        },
        {
          type: data.type,
          routeId: data.routeId ? data.routeId : null,
          routeType: data.routeType ? data.routeType : false,
        }
      );
    } else {
      dataArray.push({
        adminId,
        customerAddressId,
        customerId,
        weekDayId: data.weekDayId,
        type: data.type,
        routeId: data.routeId ? data.routeId : null,
        routeType: data.routeType ? data.routeType : false,
      });
    }
  }
  dataArray.length > 0 && (await dbService.createMany(customerWeek, dataArray));
  return true;
};

/*
 * const uploadRouteExcel = async (req, res) => {
 *   try {
 *     if (!req.file) return res.failure({ message: 'No file uploaded.' });
 */

/*
 *     const adminId = req.headers['admin-id'];
 *     const filePath = path.join(__dirname, '../../excel', req.file.filename);
 */

/*
 *     // Step 1: Read Excel file
 *     const workbook = XLSX.readFile(filePath);
 *     const sheet = workbook.Sheets[workbook.SheetNames[0]];
 *     const formattedData = XLSX.utils.sheet_to_json(sheet);
 */

/*
 *     if (!formattedData.length) {
 *       return res.failure({ message: 'Excel file is empty.' });
 *     }
 */

/*
 *     // Step 2: Clean & deduplicate within Excel itself
 *     const excelRoutes = new Set(); // unique names only
 *     const routesToInsert = [];
 */

/*
 *     formattedData.forEach((row) => {
 *       const routeName = row['Route']?.trim();
 *       if (routeName && !excelRoutes.has(routeName)) {
 *         excelRoutes.add(routeName);
 *         routesToInsert.push({
 *           name: routeName,
 *           description: row['Description'] || '',
 *           adminId,
 *           isActive: true,
 *           isDeleted: false,
 *         });
 *       }
 *     });
 */

/*
 *     if (!routesToInsert.length) {
 *       return res.failure({ message: 'No valid routes found in Excel.' });
 *     }
 */

/*
 *     // Step 3: Remove duplicates already in DB
 *     const existingRoutes = await Route.findAll({
 *       where: {
 *         name: { [Op.in]: routesToInsert.map((r) => r.name) },
 *         adminId,
 *         isDeleted: false,
 *       },
 *     });
 */

/*
 *     const existingNames = new Set(existingRoutes.map((r) => r.name));
 *     const finalRoutes = routesToInsert.filter((r) => !existingNames.has(r.name));
 */

/*
 *     if (!finalRoutes.length) {
 *       return res.failure({ message: 'All routes are already present.' });
 *     }
 */

/*
 *     // Step 4: Bulk insert unique routes
 *     await Route.bulkCreate(finalRoutes);
 */

/*
 *     // Step 5: Delete uploaded file
 *     fs.unlink(filePath, (err) => {
 *       if (err) console.error(`Failed to delete file: ${err.message}`);
 *     });
 */

/*
 *     return res.success({ message: `${finalRoutes.length} new routes imported successfully.`, });
 *   } catch (error) {
 *     console.error(error);
 *     return res.internalServerError({ message: error.message });
 *   }
 * };
 */

const uploadRouteExcel = async (req, res) => {
  try {
    if (!req.file) return res.failure({ message: 'No file uploaded.' });

    const adminId = req.headers['admin-id'];
    const filePath = path.join(__dirname, '../../excel', req.file.filename);

    // Step 1: Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const formattedData = XLSX.utils.sheet_to_json(sheet);

    if (!formattedData.length) {
      return res.failure({ message: 'Excel file is empty.' });
    }

    // Step 2: Collect all unique routes across days
    const excelRoutes = new Set();
    const routesToInsert = [];

    formattedData.forEach((row) => {
      // Columns expected like: Tue-Route, Wed-Route, Thu-Route, ...
      Object.keys(row).forEach((key) => {
        if (key.endsWith('-Route')) {
          const routeName = row[key]?.trim();
          if (routeName && !excelRoutes.has(routeName)) {
            excelRoutes.add(routeName);
            routesToInsert.push({
              name: routeName,
              description: '', // आप चाहो तो Excel से description column भी ला सकते हो
              adminId,
              isActive: true,
              isDeleted: false,
            });
          }
        }
      });
    });

    if (!routesToInsert.length) {
      return res.failure({ message: 'No valid routes found in Excel.' });
    }

    // Step 3: Remove duplicates already in DB
    const existingRoutes = await Route.findAll({
      where: {
        name: { [Op.in]: routesToInsert.map((r) => r.name) },
        adminId,
        isDeleted: false,
      },
    });

    const existingNames = new Set(existingRoutes.map((r) => r.name));
    const finalRoutes = routesToInsert.filter(
      (r) => !existingNames.has(r.name)
    );

    if (!finalRoutes.length) {
      return res.failure({ message: 'All routes are already present.' });
    }

    // Step 4: Bulk insert unique routes
    await Route.bulkCreate(finalRoutes);

    // Step 5: Delete uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete file: ${err.message}`);
    });

    return res.success({
      message: `${finalRoutes.length} new routes imported successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.internalServerError({ message: error.message });
  }
};

const uploadCustomerRouteExcel = async (req, res) => {
  try {
    if (!req.file) return res.failure({ message: 'No file uploaded.' });

    const adminId = req.headers['admin-id'];
    const filePath = path.join(__dirname, '../../excel', req.file.filename);

    // 1. Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const formattedData = XLSX.utils.sheet_to_json(sheet);

    if (!formattedData.length) {
      return res.failure({ message: 'Excel file is empty.' });
    }
    const dayShortMap = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun',
    };
    // ✅ Get Week Data from DB
    const getWeekData = await week.findAll({
      where: {
        isDeleted: false,
        adminId,
      },
      attributes: ['id', 'type', 'displayOrder', 'name'],
      order: [['displayOrder', 'ASC']],
    });

    const sortedWeekDays = [...getWeekData].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    // 2. Process each row
    for (const row of formattedData) {
      const customerName = row['Customers']
        ? String(row['Customers']).trim()
        : null;
      const addressText = row['Address 1']
        ? String(row['Address 1']).trim()
        : null;
      if (!customerName || !addressText) continue;

      const customerData = await Customer.findOne({
        where: {
          legalName: customerName,
          adminId,
          isDeleted: false,
        },
        attributes: ['id'],
      });
      console.log('====================================');
      console.log('customerData', customerData);
      console.log('====================================');
      if (!customerData) continue;
      console.log('addressText', addressText);
      const address = await CustomerAddress.findOne({
        where: {
          customerId: customerData.id,
          address1: addressText,
          isDeleted: false,
        },
      });
      if (!address) continue;

      // ✅ Iterate sorted week days (Mon → Sun)
      for (const weekDay of sortedWeekDays) {
        const shortName = dayShortMap[weekDay.name] || weekDay.name;
        console.log('====================================');
        console.log('dayShortMap[weekDay.name]',dayShortMap[weekDay.name]);
        console.log('shortName',shortName);
        console.log('====================================');
        const deliveryCol = `${shortName}-Delivery`;
        const routeCol = `${shortName}-Route`;

        const delivery = row[deliveryCol];
        const routeName = row[routeCol]?.trim();
        console.log('====================================');
        console.log('kdldl', {
          adminId,
          customerId: customerData.id,
          customerAddressId: address.id,
          weekDayId: weekDay.id,
        });
        console.log('====================================');
        console.log('delivery',delivery);
        console.log('routeName',routeName);
        if (delivery === true && routeName) {
          console.log('====================================');
          console.log('oppp');
          console.log('====================================');
          const route = await Route.findOne({
            where: {
              name: routeName,
              adminId,
              isDeleted: false,
            },
          });
          console.log('====================================');
          console.log('route',JSON.stringify(route));
          console.log('====================================');

          if (route) {
            await dbService.update(
              customerWeek,
              {
                adminId,
                customerId: customerData.id,
                customerAddressId: address.id,
                weekDayId: weekDay.id,
              },
              {
                routeId: route.id,
                routeType: true,
                type: weekDay.type,
              }
            );
          }
        } else {
          // ❌ Remove mapping if exists

          await dbService.update(
            customerWeek,
            {
              adminId,
              customerId: customerData.id,
              customerAddressId: address.id,
              weekDayId: weekDay.id,
            },
            {
              routeId: null,
              routeType: false,
              type: false,
            }
          );
        }
      }
    }

    fs.unlink(filePath, () => {}); // delete uploaded file
    return res.success({
      message: 'Customer-Route mapping updated successfully.',
    });
  } catch (error) {
    console.error(error);
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getCountryList,
  getStateList,
  getRouteList,
  getItemGroupList,
  getRoleList,
  getFilterRoleList,
  getMenuList,
  getSupplierList,
  getRawMaterialList,

  getFilterCountryList,
  getFilterStateList,
  getFilterRouteList,
  getFilterItemGroupList,
  getFilterCustomerList,
  getCustomerBySearch,
  getFilterSupplierList,
  productRawMaterialList,
  productionRawMaterialList,
  uploadExel,
  getDateRouteList,
  uploadItemExcel,
  uploadOrderExcel,
  uploadRouteExcel,
  uploadCustomerRouteExcel,
};
