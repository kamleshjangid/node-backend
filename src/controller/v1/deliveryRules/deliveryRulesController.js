/**
 * deliveryRulesController.js
 * @description :: exports deliveryRules methods
 */

const { deliveryRules } = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');

const addDeliveryRules = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    const {
      ruleName, rulesData, id
    } = req.body;

    if (!ruleName || !rulesData) {
      return res.badRequest({ message: 'Insufficient request parameters! ruleName, rulesData are required.' });
    }
    if (rulesData.length == 0) {
      return res.badRequest({ message: 'Insufficient request parameters! rulesData are required.' });
    }

    let where = {
      ruleName,
      adminId
    };
    if (id) {
      where.id = { [Op.ne]: id };
    }

    if (await deliveryRules.findOne({ where })) {
      return res.failure({ message: 'Rule name already exists' });
    }
    const dataToCreate = {
      ruleName,
      rules: rulesData
    };

    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(deliveryRules, { id }, dataToCreate);
    } else {
      try {
        const created = await dbService.createOne(deliveryRules, dataToCreate);
        if (created) {
          token = created.id;
        }
      } catch (createError) {
        return res.internalServerError({ message: createError.message });
      }
    }

    return res.success({
      message: `Delivery Rules ${id ? 'Updated' : 'Added'} Successfully`,
      data: {
        messageType,
        token
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await deliveryRules.findOne({
      where,
      attributes: ['id', 'ruleName', 'rules', 'createdAt']
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message: 'Rule data not found.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const deliveryRulesList = async (req, res) => {
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
    query.adminId = adminId;
    if (dataToFind.search) {
      query[Op.or] = { 'ruleName': { [Op.like]: '%' + dataToFind.search + '%' }, };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(deliveryRules, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'ruleName', 'rules', 'isActive', 'createdAt'];
    /*
     * if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
     * else 
     */
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
      querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    } else {
      querOptions.sort = { 'ruleName': 1 };
    }

    foundData = await dbService.paginate(deliveryRules, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Delivery Rules List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const deleteDeliveryRules = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await deliveryRules.findOne({ where });
    if (getData) {
      try {
        await deliveryRules.destroy({ where: where });
      } catch (error) {
        return res.failure({ message: 'Delivery Rules not delete' });
      }
      return res.success({ message: 'Delivery Rules Deleted' });
    } else {
      return res.recordNotFound({ message: 'Delivery Rules not foundd.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  addDeliveryRules,
  getDetails,
  deliveryRulesList,
  deleteDeliveryRules
};