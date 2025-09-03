/**
 * itemGroupController.js
 * @description :: exports itemGroup methods
 */
const {
  itemGroup,
  item
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
/**
 * @description : add itemGroup 
 * @param {Object} req : request for itemGroup
 * @param {Object} res : response for itemGroup
 * @return {Object} : response for itemGroup {status, message, data}
 */
const addItemGroup = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    const {
      name, description, id
    } = req.body;

    if (!name) {
      return res.badRequest({ message: 'Insufficient request parameters! name and description is required.' });
    }
    let where = { name };
    where.adminId = adminId;
    if (id) where.id = { [Op.ne]: id };

    if (await itemGroup.findOne({ where })) {
      return res.failure({ message: 'Name already exists' });
    }
    const dataToCreate = {
      name,
      description
    };
    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(itemGroup, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(itemGroup, dataToCreate);
      if (getData) token = getData.id;
    }

    return res.success({
      message: `Item Group ${id ? 'Updated' : 'Added'} Successfully`,
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
 * @description : view itemGroup data
 * @param {Object} req : request for itemGroup
 * @param {Object} res : response for itemGroup
 * @return {Object} : response for itemGroup {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await itemGroup.findOne({
      where,
      attributes: ['id', 'name', 'description', 'isActive', 'isDeleted', 'createdAt', 'updatedAt']
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
 * @description : manage itemGroup status
 * @param {Object} req : request for itemGroup
 * @param {Object} res : response for itemGroup
 * @return {Object} : response for itemGroup {status, message, data}
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
      let getData = await itemGroup.findOne({ where });
      if (getData) {
        await dbService.update(itemGroup, { id }, { isActive: status });
        if (await item.findOne({ where: { itemGroupId: id } })) {
          await dbService.update(item, { itemGroupId: id }, { isActive: false });
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
 * @description handles itemGroup list requests.
 * @param {Object} req - The request object for the itemGroup.
 * @param {Object} res - The response object for the itemGroup.
 * @return {Object} - The response object for the itemGroup {status, message, data}.
 */
const itemGroupList = async (req, res) => {
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
      foundData = await dbService.count(itemGroup, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'name', 'description', 'isActive', 'createdAt'];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };

    else querOptions.sort = { 'name': 1 };
    foundData = await dbService.paginate(itemGroup, query, querOptions);
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
const deleteItemGroup = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await itemGroup.findOne({ where });
    if (getData) {
      if (await item.findOne({ where: { itemGroupId: id } })) {
        await item.destroy({ where: { itemGroupId: id } });
        await itemGroup.destroy({ where: where });
      } else {
        await itemGroup.destroy({ where: where });
      }

      return res.success({ message: 'Items Group Deleted ' });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getMasterCatalogue = async (req, res) => {
  try {
    // Fetch adminId from headers, default to null if not provided
    const adminId = req.headers['admin-id'] || null;

    // Define the query conditions based on adminId
    let where = {};
    if (adminId) {
      where.adminId = adminId;
    }

    // Fetch data from the database
    const getData = await itemGroup.findAll({
      where,
      attributes: ['id', 'name'],
      include: [
        {
          model: item,
          as: 'itemData',
          attributes:{ exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
        },
      ],
      order: [['name', 'ASC']],
    });
    getData.forEach(group => {
      group.itemData = group.itemData.sort((a, b) => a.name.localeCompare(b.name));
    });
    // Send response
    return res.success({
      data: getData,
      message: 'Get Item Master Catalogue'
    });
  } catch (error) {
    // Handle errors
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  addItemGroup,
  getDetails,
  manageStatus,
  itemGroupList,
  deleteItemGroup,
  getMasterCatalogue
};