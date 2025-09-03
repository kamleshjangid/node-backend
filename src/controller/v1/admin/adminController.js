/**
 * adminController.js
 * @description :: exports admin methods
 */
const authService = require('@services/auth');
const {
  user, admin, countries, state, week, adminUser
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const {
  capitalize, toLowerCase, generateStrongPassword, cryptoFUN
} = require('@helpers/function');

/**
 * @description : edit user
 * @param {Object} req : request for user
 * @param {Object} res : response for user
 * @return {Object} : response for user {status, message, data}
 */
const manageAdmin = async (req, res) => {
  try {
    const requestParam = req.body;

    if (!requestParam.companyName || !requestParam.address1 || !requestParam.cityName || !requestParam.postcode || !requestParam.email) {
      return res.badRequest({ message: 'Insufficient request parameters! companyName, address1, cityName, postcode, email is required.' });
    }
    let where = { email: toLowerCase(requestParam.email) };

    if (requestParam.id) where.id = { [Op.ne]: requestParam.id };

    if (await admin.findOne({ where })) {
      return res.failure({ message: 'Email already exists' });
    }
    const dataToCreate = { ...requestParam };
    dataToCreate.email = toLowerCase(requestParam.email);
    dataToCreate.companyName = capitalize(requestParam.companyName);
    let password = generateStrongPassword(8);
    if (!requestParam.id) dataToCreate.password = cryptoFUN(password, 'encrypt');

    const messageType = requestParam.id ? 'update' : 'insert';
    let token = '';
    if (requestParam.id) {
      await dbService.update(admin, { id: requestParam.id }, dataToCreate);
      token = requestParam.id;
    } else {
      const result = await dbService.createOne(admin, { ...dataToCreate, });
      if (result) {
        token = result.id;
        const weekData = [
          {
            adminId: token,
            'name': 'Monday',
            'displayOrder': 1,
            type: false,
          },
          {
            adminId: token,
            'name': 'Tuesday',
            'displayOrder': 2,
            type: true,
          },
          {
            adminId: token,
            'name': 'Wednesday',
            'displayOrder': 3,
            type: true,
          },
          {
            adminId: token,
            'name': 'Thursday',
            'displayOrder': 4,
            type: true,
          },
          {
            adminId: token,
            'name': 'Friday',
            'displayOrder': 5,
            type: true,
          },
          {
            adminId: token,
            'name': 'Saturday',
            'displayOrder': 6,
            type: true,
          },
          {
            adminId: token,
            'name': 'Sunday',
            'displayOrder': 7,
            type: false,
          }
        ];
        await dbService.createMany(week, weekData);
      }
    }
    return res.success({
      message: `Company ${requestParam.id ? 'Updated' : 'Added'} Successfully `,
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
 * @description : view customer data
 * @param {Object} req : request for customer
 * @param {Object} res : response for customer
 * @return {Object} : response for customer {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await admin.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [{
        model: countries,
        as: 'countryData',
        attributes: ['id', 'countryName']
      }, {
        model: state,
        as: 'stateData',
        attributes: ['id', 'stateName']
      }, {
        model: countries,
        as: 'tradingCountryData',
        attributes: ['id', 'countryName']
      }, {
        model: state,
        as: 'tradingStateData',
        attributes: ['id', 'stateName']
      }]
    });
    getData.password = cryptoFUN(getData.password, 'decrypt');
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
 * @description : manage customer status
 * @param {Object} req : request for customer
 * @param {Object} res : response for customer
 * @return {Object} : response for customer {status, message, data}
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
      let getData = await admin.findOne({ where });
      if (getData) {
        await dbService.update(admin, { id }, { isActive: status });
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
 * @description handles customer list requests.
 * @param {Object} req - The request object for the customer.
 * @param {Object} res - The response object for the customer.
 * @return {Object} - The response object for the customer {status, message, data}.
 */
const adminList = async (req, res) => {
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
    query.roleId = null;  
    if (dataToFind.search) {
      query[Op.or] = {
        'companyName': { [Op.like]: '%' + dataToFind.search + '%' },
        'legacyCode': { [Op.like]: '%' + dataToFind.search + '%' },
        'email': { [Op.like]: '%' + dataToFind.search + '%' },
        'mobileNumber': { [Op.like]: '%' + dataToFind.search + '%' },
        'address1': { [Op.like]: '%' + dataToFind.search + '%' },
        'address2': { [Op.like]: '%' + dataToFind.search + '%' },
        'address3': { [Op.like]: '%' + dataToFind.search + '%' },
        'postcode': { [Op.like]: '%' + dataToFind.search + '%' },
        'cityName': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(admin, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'companyName', 'legacyCode', 'email', 'mobileNumber', 'address1', 'address2', 'address3', 'cityName', 'postcode', 'isActive', 'createdAt', 'currentActiveStatus'];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    else querOptions.sort = { 'companyName': 1 };
    querOptions.include = [{
      model: countries,
      as: 'countryData',
      attributes: ['countryName']
    }, {
      model: state,
      as: 'stateData',
      attributes: ['stateName']
    }];
    foundData = await dbService.paginate(admin, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Company List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : Delete admin data
 * @param {Object} req : request for admin
 * @param {Object} res : response for admin
 * @return {Object} : response for admin {status, message, data}
 */
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await admin.findOne({ where });
    if (getData) {
      await admin.destroy({ where: where });
      return res.success({ message: 'Company Deleted' });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
/**
 * @description : update company password
 * @param {Object} req : request for comapany
 * @param {Object} res : response for comapany
 * @return {Object} : response for comapany {status, message, data}
 */
const updateCompanyPassword = async (req, res) => {
  try {
    const {
      id, password
    } = req.body;
    if (!id || !password) {
      return res.badRequest({ message: 'Insufficient request parameters! id, password is required.' });
    }
    let where = { id };
    let getData = await admin.findOne({ where });
    if (!getData) {
      return res.recordNotFound({ message: 'Company user not found !!' });
    }
    let updatePassword = cryptoFUN(password, 'encrypt');
    await dbService.update(admin, { id }, { password: updatePassword });
    return res.success({ message: `Company Password Updated Successfully` });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const adminUserList = async (req, res) => {
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
    if (!query.adminId){
      query.adminId = null;  
    }
    if (dataToFind.search) {
      query[Op.or] = {
        'firstName': { [Op.like]: '%' + dataToFind.search + '%' },
        'lastName': { [Op.like]: '%' + dataToFind.search + '%' },
        'mobileNumber': { [Op.like]: '%' + dataToFind.search + '%' },
        'email': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(admin, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'firstName', 'lastName', 'email', 'mobileNumber', 'isActive', 'createdAt'];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    else querOptions.sort = { 'firstName': 1 };
    foundData = await dbService.paginate(admin, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Admin user List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  getDetails,
  manageStatus,
  adminList,
  manageAdmin,
  deleteCompany,
  updateCompanyPassword,
  adminUserList
};