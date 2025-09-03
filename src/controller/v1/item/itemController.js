/**
 * itemContoller.js
 * @description :: exports itemController methods
 */
const {
  itemGroup,
  item,
  itemDay,
  week,
  customerItem,
  customer
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');

const insertItemDays = async (body, itemId) => {
  if (!body.itemDayArray || body.itemDayArray.length === 0) return;

  const dataArray = [];
  for (const data of body.itemDayArray) {
    const existingRecord = await itemDay.findOne({
      where: {
        itemId,
        weekDayId: data.weekDayId
      }
    });
    existingRecord ? await dbService.update(itemDay, {
      itemId,
      weekDayId: data.weekDayId
    }, { type: data.type }) :
      dataArray.push({
        itemId,
        weekDayId: data.weekDayId,
        type: data.type
      });
  }
  dataArray.length > 0 && await dbService.createMany(itemDay, dataArray);
};

/**
 * @description : add item 
 * @param {Object} req : request for item
 * @param {Object} res : response for item
 * @return {Object} : response for item {status, message, data}
 */
const addItem = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      name, itemGroupId, id, ...updateParam
    } = req.body;

    if (!name || !itemGroupId) {
      return res.badRequest({ message: 'name and itemGroupId are required.' });
    }

    const where = {
      name,
      itemGroupId,
      adminId,
      ...(id && { id: { [Op.ne]: id } })
    };
    if (await item.findOne({ where })) {
      return res.failure({ message: 'Name already exists' });
    }
    updateParam.name = name;
    updateParam.itemGroupId = itemGroupId;
    let token;
    if (id) {
      await dbService.update(item, { id }, updateParam);
      token = id;
    } else {
      const newItem = await dbService.createOne(item, updateParam);
      token = newItem.id;
    }

    // Add item for all customers
    const customers = await customer.findAll({
      where: { adminId },
      attributes: ['id']
    });
    await Promise.all(customers.map(customer =>
      addCustomerItem({
        itemId: token,
        customerId: customer.id,
        itemGroupId,
        adminId
      })
    ));

    return res.success({
      message: `Item ${id ? 'Updated' : 'Added'} Successfully`,
      data: { token }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const addCustomerItem = async ({
  itemId, customerId, itemGroupId, adminId
}) => {
  const where = {
    itemId,
    customerId,
    adminId
  };

  const existingCustomerItem = await customerItem.findOne({ where });
  const dataToCreateOrUpdate = {
    itemId,
    customerId,
    itemGroupId
  };

  if (existingCustomerItem) {
    await dbService.update(customerItem, { id: existingCustomerItem.id }, dataToCreateOrUpdate);
  } else {
    await dbService.createOne(customerItem, dataToCreateOrUpdate);
  }
};

/**
 * @description : view item data
 * @param {Object} req : request for item
 * @param {Object} res : response for item
 * @return {Object} : response for item {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await item.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: itemGroup,
          as: 'itemGroupData',
          attributes: ['id', 'name']
        },
        {
          model: itemDay,
          as: 'itemDayData',
          attributes: ['weekDayId', 'type'],
          include: [
            {
              model: week,
              as: 'weekData',
              attributes: ['name']
            },
          ]
        },
      ]

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
 * @description : manage route status
 * @param {Object} req : request for route
 * @param {Object} res : response for route
 * @return {Object} : response for route {status, message, data}
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
      let getData = await item.findOne({ where });
      if (getData) {
        if (await itemGroup.findOne({
          where: {
            id: getData.itemGroupId,
            isActive: true
          }
        })) {
          await dbService.update(item, { id }, { isActive: status });
        } else {
          return res.failure({ message: 'Please update the item group first, and then proceed to update its status.' });
        }
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
 * @description handles route list requests.
 * @param {Object} req - The request object for the route.
 * @param {Object} res - The response object for the route.
 * @return {Object} - The response object for the route {status, message, data}.
 */
const itemList = async (req, res) => {
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
        'name': { [Op.like]: '%' + dataToFind.search + '%' },
        'description': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(item, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'name', 'wholeSalePrice', 'weight', 'bakedWeight', 'isActive', 'createdAt'];

    querOptions.include = [{
      model: itemGroup,
      as: 'itemGroupData',
      attributes: ['name']
    }];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
      if (options.sortBy.orderBy == 'itemGroupName') {
        querOptions.order = [[{
          model: itemGroup,
          as: 'itemGroupData' 
        }, 'name', options.sortBy.order === 'asc' ? 'asc' : 'desc']];
      } else {
        querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
      }
    } else { 
      querOptions.order = [
        [{
          model: itemGroup,
          as: 'itemGroupData' 
        }, 'name', 'ASC'], // Sort itemGroup name ASC
        ['name', 'ASC'] // Sort item name ASC
      ];      
    }

    foundData = await dbService.paginate(item, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Item Group List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : Delete itemGroup data
 * @param {Object} req : request for itemGroup
 * @param {Object} res : response for itemGroup
 * @return {Object} : response for itemGroup {status, message, data}
 */
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await item.findOne({ where });
    if (getData) {
      try {
        await item.destroy({ where: where });
      } catch (error) {
        return res.failure({ message: 'This item not delete' });
      }
      return res.success({ message: 'Item Deleted' });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  addItem,
  getDetails,
  manageStatus,
  itemList,
  deleteItem
};