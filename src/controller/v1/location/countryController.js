/**
 * countryController.js
 * @description :: exports country methods
 */
const authService = require('@services/auth');
const {
  countries, state
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const userSchemaKey = require('@utils/validation/superAdminValidation');
const validation = require('@utils/validateRequest');
const authConstant = require('@constants/authConstant');
const FUNC = require('@utils/common');

/**
 * @description: Add or update a country.
 * @param {Object} req: Request object containing country information.
 * @param {Object} res: Response object for the country.
 * @return {Object}: Response for the country {status, message, data}.
 */
const addCountry = async (req, res) => {
  const functionName = 'addCountry';
  try {
    const {
      countryName, countryUrl, id
    } = req.body;
    if (!countryName || !countryUrl) {
      // Log an error message for insufficient request parameters
      return res.badRequest({ message: 'Insufficient request parameters! countryName and countryUrl are required.' });
    }

    let where = { countryName };

    if (id) {
      where.id = { [Op.ne]: id };
    }

    if (await countries.findOne({ where })) {
      return res.failure({ message: 'Country name already exists' });
    }

    if (!id) {
      where = { countryUrl: countryUrl.toLowerCase() };
      if (await countries.findOne({ where })) {
        return res.failure({ message: 'Country URL already exists' });
      }
    }

    const dataToCreate = id ? { countryName } : {
      countryName,
      countryUrl: countryUrl.toLowerCase()
    };

    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(countries, { id }, dataToCreate);
    } else {
      try {
        const createdCountry = await dbService.createOne(countries, dataToCreate);
        if (createdCountry) {
          token = createdCountry.id;
        }
      } catch (createError) {
        return res.internalServerError({ message: createError.message });
      }
    }

    return res.success({
      message: `Country ${id ? 'Updated' : 'Added'} Successfully`,
      data: {
        messageType,
        token
      },
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
/**
 * @description : view country data
 * @param {Object} req : request for country
 * @param {Object} res : response for country
 * @return {Object} : response for country {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await countries.findOne({
      where,
      attributes: ['id', 'countryName', 'countryUrl', 'isActive', 'isDeleted', 'createdAt', 'updatedAt']
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
 * @description : manage country status
 * @param {Object} req : request for country
 * @param {Object} res : response for country
 * @return {Object} : response for country {status, message, data}
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
      let getData = await countries.findOne({ where });
      if (getData) {
        await dbService.update(countries, { id }, { isActive: status });
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
 * @description handles country list requests.
 * @param {Object} req - The request object for the country.
 * @param {Object} res - The response object for the country.
 * @return {Object} - The response object for the country {status, message, data}.
 */
const countryList = async (req, res) => {
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
        'countryName': { [Op.like]: '%' + dataToFind.search + '%' },
        'countryUrl': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(countries, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'countryName', 'countryUrl', 'isActive', 'createdAt'];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    else querOptions.sort = { 'countryName': 1 };
    foundData = await dbService.paginate(countries, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Country List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  addCountry,
  getDetails,
  manageStatus,
  countryList
};