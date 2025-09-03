/**
 * countryController.js
 * @description :: exports country methods
 */
const { route } = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');

/**
 * @description : add route
 * @param {Object} req : request for route
 * @param {Object} res : response for route
 * @return {Object} : response for route {status, message, data}
 */
const addRoute = async (req, res) => {
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

    if (await route.findOne({ where })) {
      return res.failure({ message: 'Name already exists' });
    }
    const dataToCreate = {
      name,
      description
    };
    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(route, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(route, dataToCreate);
      if (getData) token = getData.id;
    }

    return res.success({
      message: `Route ${id ? 'Updated' : 'Added'} Successfully`,
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
 * @description : view route data
 * @param {Object} req : request for route
 * @param {Object} res : response for route
 * @return {Object} : response for route {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await route.findOne({
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
      let getData = await route.findOne({ where });
      if (getData) {
        await dbService.update(route, { id }, { isActive: status });
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
const routeList = async (req, res) => {
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
      foundData = await dbService.count(route, query);
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
    /*
     * if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
     * else 
     */
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
      querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    } else {
      querOptions.sort = { 'name': 1 };
    }

    foundData = await dbService.paginate(route, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Route List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  addRoute,
  getDetails,
  manageStatus,
  routeList
};