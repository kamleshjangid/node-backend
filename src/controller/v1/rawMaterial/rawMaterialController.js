
const {
  rawMaterial, rawMaterialProduct, countries, supplier, stock, batch 
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const { SIZE_TYPE } = require('@constants/authConstant');

const createRawProduct = async (productDetails, rawMaterialId, adminId) => {
  try {
    if (!productDetails || productDetails.length === 0) return false;

    const dataArray = [];

    for (const data of productDetails) {
      const getSupplier = await supplier.findOne({
        where:{ id:(data.supplierData) ? data.supplierData.id : data.supplierId },
        attributes:['companyName'] 
      });

      let where = {
        rawMaterialId, 
        adminId 
      };
      if (data.id){
        where.id = data.id; 
      }
      const existingRecord = await rawMaterialProduct.findOne({ where });
      if (existingRecord && data.id) {
        await rawMaterialProduct.update({
          supplierId: (data.supplierData) ? data.supplierData.id : data.supplierId,
          supplierName:getSupplier?.companyName,
          purchasedBy: data.purchasedBy,
          purchaseCartonQty: data.purchaseCartonQty,
          buyPrice: data.buyPrice,
          buyTax: data.buyTax,
          supplierSKU: data.supplierSKU,
        }, { where });
      } else {
        dataArray.push({
          rawMaterialId,
          adminId,
          supplierName:getSupplier?.companyName,
          supplierId: (data.supplierData) ? data.supplierData.id : data.supplierId,
          purchasedBy: data.purchasedBy,
          purchaseCartonQty: data.purchaseCartonQty,
          buyPrice: data.buyPrice,
          buyTax: data.buyTax,
          supplierSKU: data.supplierSKU,
        });
      }
    }

    const idsToKeep = productDetails.map(data => data.id).filter(Boolean);
    await rawMaterialProduct.destroy({
      where: {
        rawMaterialId,
        adminId,
        id: { [Op.notIn]: idsToKeep }
      }
    });

    if (dataArray.length > 0) {
      await dbService.createMany(rawMaterialProduct, dataArray);
    }

    return true;
  } catch (error) {
    console.error('Error in createRawProduct:', error.message);
    return false;
  }
};

async function checkDuplicateItems (productDetails) {
  const seenItems = new Map();
  for (let i = 0; i < productDetails.length; i++) {
    const { supplierId } = productDetails[i];
    const supplierData = await supplier.findOne({ where: { id: supplierId } });

    /* Construct key using item and item group IDs */
    const key = `${supplierId}`;

    /* Check for duplicates */
    if (seenItems.has(key)) {
      const prevIndex = seenItems.get(key);
      return {
        duplicate: true,
        supplierId: supplierData.companyName,
        currentIndex: i + 1,
        prevIndex: prevIndex + 1
      };
    }
    seenItems.set(key, i);
  }
  return { duplicate: false };
}
async function generateUniqueId () {
  const now = new Date();
  
  // Get year, month, and day
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() returns month from 0-11
  const day = String(now.getDate()).padStart(2, '0');
  
  // Get the current timestamp in milliseconds and take the last two digits
  const timestamp = Date.now();
  const uniqueTwoDigit = String(timestamp).slice(-2);
  
  // Combine year, month, day, and the unique two-digit number into a unique identifier
  const uniqueId = `${year}${month}${day}${uniqueTwoDigit}`;

  return uniqueId;
}

async function generateUniqueBatchCode () {
  const batchCode = await generateUniqueId();
  const checkId = await rawMaterial.findOne({ where: { batchCode } });

  if (checkId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }

  return batchCode;
}
const addRawMaterial = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam =  req.body;

    let where = {
      name:requestParam.name,
      productType:requestParam.productType 
    };
    where.adminId = adminId;
    if (requestParam?.id) where.id = { [Op.ne]: requestParam?.id };

    if (await rawMaterial.findOne({ where })) {
      return res.failure({ message: 'Name already exists' });
    }
    const dataToCreate = { ...requestParam };
    const messageType = requestParam?.id ? 'update' : 'insert';
    let token = '';
    if (dataToCreate.countryId == '') dataToCreate.countryId = null;
    const duplicateItems = await checkDuplicateItems(requestParam?.productDetails);
    if (duplicateItems.duplicate) {
      return res.failure({ message: `Duplicate supplier detected: ${duplicateItems.supplierId} at row ${duplicateItems.currentIndex}. Previous occurrence at row ${duplicateItems.prevIndex}.` });
    }
    if (requestParam?.id) {
      let checkId = await rawMaterial.findOne({ where:{ id:requestParam?.id } });
      if (!checkId){
        return res.recordNotFound({ message:'Invalid id' });
      }
      if (dataToCreate.unitType === 'Grams'){
        dataToCreate.shortNameType = 'g';
      } else if (requestParam.unitType === 'Kilograms' ){
        dataToCreate.shortNameType = 'kg';
      } else {
        dataToCreate.shortNameType = 'lt';
      }
      await dbService.update(rawMaterial, { id:requestParam?.id }, dataToCreate);
      const updateProduct = await createRawProduct(requestParam?.productDetails, requestParam?.id, adminId);
      if (!updateProduct){
        return res.failure({ message: 'failed to update product details' });
      }

    } else {
      dataToCreate.batchCode = await generateUniqueBatchCode();
      if (dataToCreate.unitType === 'Grams'){
        dataToCreate.shortNameType = 'g';
      } else if (dataToCreate.unitType === 'Kilograms' ){
        dataToCreate.shortNameType = 'kg';
      } else {
        dataToCreate.shortNameType = 'lt';
      }

      let getData = await dbService.createOne(rawMaterial, dataToCreate);
      if (getData){
        const createProduct = await createRawProduct(requestParam?.productDetails, getData.id, adminId);
        if (!createProduct){
          await rawMaterial.destroy({ where: { id: getData.id } });
          return res.failure({ message: 'Something went wrong in raw material' });
        }
        token = getData.id;
      } 
    }
    return res.success({
      message: `Raw Material ${requestParam?.id ? 'Updated' : 'Added'} Successfully`,
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
    let getData = await rawMaterial.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: rawMaterialProduct,
          as: 'productDetails',
          attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
          include: [
            {
              model: supplier,
              as: 'supplierData',
              attributes: ['id', 'companyName'],
            },
          ]  
        },
        {
          model: countries,
          as: 'countryData',
          attributes: ['id', 'countryName'],
        },
      ]
    });
    if (getData) {
      const obj = getData.toJSON();
      const getStockDate = await stock.findOne({
        where: { rawMaterialId: getData.id },
        attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
        include: [
          {
            model: batch,
            as: 'batchData',
            attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
          },
        ]         
      });
      obj.stockData = getStockDate ? getStockDate.toJSON() : null;
      return res.success({ data: obj });
    } else {
      return res.recordNotFound({ message: 'Raw material not found.' });
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
      let getData = await rawMaterial.findOne({ where });
      if (getData) {
        await dbService.update(rawMaterial, { id }, { isActive: status });
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

const getRawMaterialList = async (req, res) => {
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
        'brandName': { [Op.like]: '%' + dataToFind.search + '%' },
        'name': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }
    query.adminId = adminId;
    query.productType = 'Standard';
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
    querOptions.select = ['id', 'brandName', 'name', 'sku', 'categoryName', 'isActive', 'createdAt','batchCode'];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'createdAt': -1 };

    foundData = await dbService.paginate(rawMaterial, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Raw Material List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = { 
  addRawMaterial,
  getDetails, 
  manageStatus,
  getRawMaterialList
};