/**
 * stateController.js
 * @description :: exports state methods
 */
const authService = require('@services/auth');
const { 
  city,
  state, 
  countries 
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize 
} = require('sequelize');

/**
 * @description : add city 
 * @param {Object} req : request for city
 * @param {Object} res : response for city
 * @return {Object} : response for city {status, message, data}
 */
const mangeCity = async (req, res) => {
  try {
    const {
      cityName, cityUrl, countryId, stateId, id
    } = req.body;

    if (!cityName || !cityUrl || !countryId || !stateId) {
      return res.badRequest({ message: 'Insufficient request parameters! cityName, cityUrl and countryId, stateId is required.' });
    }
    if (!await countries.findOne({ where:{ id:countryId } })) {
      return res.failure({ message: 'Invalid country id' });
    }
    if (!await state.findOne({ where:{ id:stateId } })) {
      return res.failure({ message: 'Invalid state id' });
    }
  
    let where = { 
      countryId:countryId, 
      stateId:stateId, 
      cityName
    };

    if (id) where.id = { [Op.ne]: id };

    if (await city.findOne({ where })) {
      return res.failure({ message: 'City name already exists' });
    }
    if (!id) {
      where = {
        countryId,
        stateId,
        cityUrl: cityUrl.toLowerCase() 
      };
      if (await city.findOne({ where })) {
        return res.failure({ message: 'City url already exists' });
      }
    }

    const dataToCreate = id ? {
      cityName,
      countryId,
      stateId 
    } : {
      cityName,
      cityUrl: cityUrl.toLowerCase(),
      countryId,
      stateId,
    };
    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(city, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(city, dataToCreate);
      if (getData) token = getData.id;

    }

    return res.success({
      message: `City ${id ? 'Updated' : 'Added'} Successfully`,
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
 * @description : view city data
 * @param {Object} req : request for city
 * @param {Object} res : response for city
 * @return {Object} : response for city {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await city.findOne({
      include:[
        {
          model: countries,
          as: 'countryData',
          attributes: ['id','countryName']
        },
        {
          model: state,
          as: 'stateData',
          attributes: ['id','stateName']
        },
      ],
      where,
      attributes: ['id', 'cityName', 'cityUrl', 'isActive', 'isDeleted', 'createdAt', 'updatedAt']
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
 * @description : manage city status
 * @param {Object} req : request for city
 * @param {Object} res : response for city
 * @return {Object} : response for city {status, message, data}
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
      let getData = await city.findOne({ where });
      if (getData) {
        await dbService.update(city, { id }, { isActive: status });
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
 * @description handles city list requests.
 * @param {Object} req - The request object for the city.
 * @param {Object} res - The response object for the city.
 * @return {Object} - The response object for the city {status, message, data}.
 */
const cityList = async (req, res) => {
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
        'cityName': { [Op.like]: '%' + dataToFind.search + '%' },
        'cityUrl': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(city, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'cityName', 'cityUrl', 'isActive', 'createdAt'];
    querOptions.include = [{
      model: countries,
      as: 'countryData',
      attributes: ['countryName']
    }, {
      model: state,
      as: 'stateData',
      attributes: ['stateName']
    }];  
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
      if (options.sortBy.orderBy == 'countryName'){
        querOptions.order  = [[{
          model: countries,
          as: 'countryData' 
        }, options.sortBy.orderBy, options.sortBy.order == 'asc' ? 'ASC' : 'DESC' ]];
      } else if (options.sortBy.orderBy == 'stateName'){
        querOptions.order  = [[{
          model: state,
          as: 'stateData' 
        }, options.sortBy.orderBy, options.sortBy.order == 'asc' ? 1 : -1 ]];
      } else {
        querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
      }
    } else { querOptions.sort = { 'cityName': 1 }; }

    foundData = await dbService.paginate(city, query, querOptions);
    return res.success({
      data: foundData,
      message: 'City List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  mangeCity,
  getDetails,
  manageStatus,
  cityList,
};