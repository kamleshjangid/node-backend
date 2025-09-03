/**
 * supplierController.js
 * @description :: exports supplier methods
 */
const {
  supplier, purchaseOrder, rawMaterial, rawMaterialProduct
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const {
  capitalize, toLowerCase
} = require('@helpers/function');
/**
 * @description : add supplier
 * @param {Object} req : request for supplier
 * @param {Object} res : response for supplier
 * @return {Object} : response for supplier {status, message, data}
 */
const addSupplier = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body;
    const {
      email, mobileNumber, companyName, additionalMinimumField
    } = requestParam;

    if (!companyName || !email) {
      return res.badRequest({ message: 'Insufficient request parameters! companyName, email is required.' });
    }

    let where = { email: requestParam.email.toLowerCase() };
    where.adminId = adminId;
    if (requestParam.id) where.id = { [Op.ne]: requestParam.id };

    if (await supplier.findOne({ where })) {
      return res.failure({ message: 'email already exists' });
    }
    
    if (requestParam.orderMinimums == 'Minimum Spends'){
      requestParam.minimumSpend = additionalMinimumField;
    } else if (requestParam.orderMinimums == 'Minimum Carton Qty'){
      requestParam.minimumQuantity = additionalMinimumField;
    }

    requestParam.companyName = capitalize(requestParam.companyName);
    requestParam.email = toLowerCase(requestParam.email);
    const messageType = requestParam.id ? 'update' : 'insert';
    let id = '';

    if (requestParam.id) {
      await dbService.update(supplier, { id: requestParam.id }, requestParam);
    } else {
      let getLastData = await dbService.createOne(supplier, requestParam);
      if (getLastData) {
        id = getLastData.id;
      }
    }

    return res.success({
      message: `Supplier ${requestParam.id ? 'Updated' : 'Added'} Successfully`,
      data: { 
        messageType, 
        token:id
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : view supplier data
 * @param {Object} req : request for supplier
 * @param {Object} res : response for supplier
 * @return {Object} : response for supplier {status, message, data}
 */
const getDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await supplier.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message:'Supplier not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : manage supplier status
 * @param {Object} req : request for supplier
 * @param {Object} res : response for supplier
 * @return {Object} : response for supplier {status, message, data}
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
      let getData = await supplier.findOne({ where });
      if (getData) {
        await dbService.update(supplier, { id }, { isActive: status });
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
const supplierList = async (req, res) => {
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
        'companyName': { [Op.iLike]: '%' + dataToFind.search + '%' },
        'contactName': { [Op.iLike]: '%' + dataToFind.search + '%' },
        'email': { [Op.iLike]: '%' + dataToFind.search + '%' },
        // 'mobileNumber': { [Op.iLike]: '%' + dataToFind.search + '%' },
      };
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(supplier, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'companyName', 'contactName', 'orderMethod', 'email', 'isActive', 'createdAt'];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'companyName': 1 };

    foundData = await dbService.paginate(supplier, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Supplier List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const supplierOrderList = async (req, res) => {
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
        // 'orderNumber':  { [Op.eq]: dataToFind.search },
        'total': { [Op.iLike]: '%' + dataToFind.search + '%' },
      };
    }
    let supplierId = null;
    if (query.supplierId) {
      supplierId = query.supplierId;
    }
    query.supplierId = supplierId;
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(purchaseOrder, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'orderNumber', 'orderPrefix', 'total','orderDate','orderStatus'];
    querOptions.include = [{
      model: supplier,
      as: 'supplierData',
      attributes: ['id','companyName']
    }];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'createdAt': -1 };

    foundData = await dbService.paginate(purchaseOrder, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Get Supplier Order List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const supplierProductList = async (req, res) => {
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
      query[Op.or] = {};
    }
    let supplierId = null;
    if (query.supplierId) {
      supplierId = query.supplierId;
    }
    query.supplierId = supplierId;
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(rawMaterialProduct, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id','supplierName','purchasedBy','purchaseCartonQty','buyPrice','buyTax','supplierSKU'];
    querOptions.include = [{
      model: rawMaterial,
      as: 'rawMaterialData',
      attributes: ['id','brandName','name','size','unitType']
    }];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'createdAt': -1 };

    foundData = await dbService.paginate(rawMaterialProduct, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Get Supplier Product List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  addSupplier,
  getDetails,
  manageStatus,
  supplierList,
  supplierOrderList,
  supplierProductList
};