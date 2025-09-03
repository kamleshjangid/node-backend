const {
  stock, batch  
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
  
function generateBatchId () {
  const timestamp = Date.now().toString().slice(-5); 
  const randomPart = Math.floor(Math.random() * 10).toString();
  return timestamp + randomPart;
}
const addBatch = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body; 
    const {
      rawMaterialId, stockId, countryId, batchCode, id, costOfGoods, productionDate, expiryDate, expiryType,
    } = requestParam;
  
    if (!rawMaterialId || !stockId || !countryId || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! rawMaterialId, stockId, countryId, adminId is required.' });
    }
  
    const dataToCreate = {
      rawMaterialId,
      stockId,
      countryId,
      batchCode,
      costOfGoods,
      productionDate,
      expiryDate,
      expiryType
    };
    let checkId = null;
    if (id){
      checkId = await batch.findOne({ where:{ id } });
      dataToCreate.batchId = checkId.batchId;
    } else {
      dataToCreate.batchId = generateBatchId();
    }
    let where  = { batchId: dataToCreate.batchId };
    if (id) where.id = { [Op.ne]: id };
    const checkBatchId = await batch.findOne({ where });
    if (checkBatchId) {
      return res.failure({ message: 'Batch already exists' });
    }
  
    const messageType = id ? 'update' : 'insert';
    let token = '';
  
    if (id) {
      await dbService.update(batch, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(batch, dataToCreate);
      if (getData) token = getData.id;
    }
  
    return res.success({
      message: `Batch ${id ? 'Updated' : 'Added'} Successfully`,
      data: { 
        messageType,
        token
      }
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
    let getData = await batch.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] }
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message:'Batch not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
  
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
      let getData = await batch.findOne({ where });
      if (getData) {
        await dbService.update(batch, { id }, { isActive: status });
        return res.success({ message: `${status == 0 ? 'Inactive' : 'Active'} successfully` });
      } else {
        return res.recordNotFound({ message: 'Batch not found' });
      }
  
    } else {
      return res.failure({ message: 'Invalid status' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const batchList = async (req, res) => {
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
      query[Op.or] = { 'batchCode': { [Op.like]: '%' + dataToFind.search + '%' }, };
    }
    if (!dataToFind.rawMaterialId) {
      query.rawMaterialId = null;
    }
    if (!dataToFind.stockId) {
      query.stockId = null;
    }
  
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(batch, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'batchId', 'batchCode','costOfGoods','stockOnHand', 'isActive', 'createdAt'];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'batchCode': 1 };
  
    foundData = await dbService.paginate(batch, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Batch List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
  
module.exports = { 
  addBatch,
  getDetails, 
  manageStatus,
  batchList
};