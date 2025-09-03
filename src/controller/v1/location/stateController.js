/**
 * stateController.js
 * @description :: exports state methods
 */
const authService = require('@services/auth');
const { 
  state, 
  countries 
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const userSchemaKey = require('@utils/validation/superAdminValidation');
const validation = require('@utils/validateRequest');
const authConstant = require('@constants/authConstant');

/**
 * @description : add state 
 * @param {Object} req : request for state
 * @param {Object} res : response for state
 * @return {Object} : response for state {status, message, data}
 */
const getCountryList = async (req, res) => {
  try {
    const { id } = req.body;
    let where = {
      isDeleted: false,
      isActive: true,
    };  
    if (id){
      where = { isDeleted: false, };
    }
    const getData = await countries.findAll({
      where: where,
      attributes: ['id', 'countryName'],
      order: [
        ['countryName', 'ASC'],
      ],
    });
    return res.success({
      data: getData,
      message: 'Country List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : add state 
 * @param {Object} req : request for state
 * @param {Object} res : response for state
 * @return {Object} : response for state {status, message, data}
 */
const addState = async (req, res) => {
  try {
    const {
      stateName, stateUrl, countryId, id
    } = req.body;

    if (!stateName || !stateUrl || !countryId) {
      return res.badRequest({ message: 'Insufficient request parameters! stateName, stateUrl and countryId is required.' });
    }
    if (!await countries.findOne({ where:{ id:countryId } })) {
      return res.failure({ message: 'Invalid country id' });
    }
  
    let where = { 
      countryId:countryId, 
      stateName
    };

    if (id) where.id = { [Op.ne]: id };

    if (await state.findOne({ where })) {
      return res.failure({ message: 'State name already exists' });
    }
    if (!id) {
      where = { stateUrl: stateUrl.toLowerCase() };
      if (await state.findOne({ where })) {
        return res.failure({ message: 'State url already exists' });
      }
    }

    const dataToCreate = id ? {
      stateName,
      countryId 
    } : {
      stateName,
      stateUrl: stateUrl.toLowerCase(),
      countryId,
    };
    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(state, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(state, dataToCreate);
      if (getData) token = getData.id;

    }

    return res.success({
      message: `State ${id ? 'Updated' : 'Added'} Successfully`,
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
 * @description : view state data
 * @param {Object} req : request for state
 * @param {Object} res : response for state
 * @return {Object} : response for state {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await state.findOne({
      include:[
        {
          model: countries,
          as: 'countryData',
          attributes: ['id','countryName']
        },
      ],
      where,
      attributes: ['id', 'stateName', 'stateUrl', 'isActive', 'isDeleted', 'createdAt', 'updatedAt']
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
 * @description : manage state status
 * @param {Object} req : request for state
 * @param {Object} res : response for state
 * @return {Object} : response for state {status, message, data}
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
      let getData = await state.findOne({ where });
      if (getData) {
        await dbService.update(state, { id }, { isActive: status });
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
 * @description handles state list requests.
 * @param {Object} req - The request object for the state.
 * @param {Object} res - The response object for the state.
 * @return {Object} - The response object for the state {status, message, data}.
 */
const stateList = async (req, res) => {
  try {
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
        'stateName': { [Op.like]: '%' + dataToFind.search + '%' },
        'stateUrl': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(state, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'stateName', 'stateUrl', 'isActive', 'createdAt'];
    querOptions.include = [{
      model: countries,
      as: 'countryData',
      attributes: ['countryName']
    }];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
      if (options.sortBy.orderBy == 'countryName'){
        querOptions.order  = [[{
          model: countries,
          as: 'countryData' 
        }, options.sortBy.orderBy, options.sortBy.order == 'asc' ? 1 : -1 ]];
      } else {
        querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };      }
    } else { querOptions.sort = { 'stateName': 1 }; }

    foundData = await dbService.paginate(state, query, querOptions);
    return res.success({
      data: foundData,
      message: 'State List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getCountryList,
  addState,
  getDetails,
  manageStatus,
  stateList,
};