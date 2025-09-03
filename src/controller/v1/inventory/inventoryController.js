const {
  purchaseOrder, purchaseOrderItem, rawMaterialProduct, rawMaterial, supplier
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize 
} = require('sequelize');
const getInventoryList = async (req, res) => {
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
        // 'orderNumber': { [Op.like]: '%' + dataToFind.search + '%' },
        // 'total': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }
    query.adminId = adminId;
    query.inventoryType = 1;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(rawMaterial, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'brandName', 'name', 'size',['shortNameType','unitType'],'stockStatus','onHand','available'];
    if (options.sortBy) {
      querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    } else { querOptions.sort = { 'createdAt': -1 }; }
    foundData = await dbService.paginate(rawMaterial, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Inventory List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = { getInventoryList };