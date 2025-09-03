
const {
  fineRawMaterial, fineRawItem, rawMaterial, rawMaterialProduct, countries, supplier, stock, batch 
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');

const getRawMaterialList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    let where = {
      isDeleted: false,
      isActive: true,
      adminId,
    };
    const getData = await rawMaterial.findAll({
      attributes: ['id', 'brandName','name','sku','size'],
      where:{
        adminId,
        productType:'Standard' 
      },
      /*
       * include: [
       *   {
       *     required:true,
       *     model: rawMaterialProduct,
       *     where,
       *     as: 'singleProductDetails',
       *     attributes: ['id','purchaseCartonQty','purchasedBy','buyPrice'],
       *   },
       * ],
       */
      order: [
        ['brandName', 'ASC'],
      ],
    });
    return res.success({
      data: getData,
      message: 'Raw Material List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const createFineRawItem = async (productDetails, fineRawMaterialId, adminId) => {
  try {
    if (!productDetails || productDetails.length === 0) return false;

    const dataArray = [];
    let quantity = 0;
    for (const data of productDetails) {
      let where = {
        fineRawMaterialId,
        adminId
      };
      if (data.id){
        where.id = data.id; 
      }
      const existingWawMaterialRecord = await rawMaterial.findOne({ where:{ id: data.rawMaterialId } });
      const existingRecord = await fineRawItem.findOne({ where });
      if (existingRecord && data.id) {
        await fineRawItem.update({
          fineRawMaterialId:fineRawMaterialId,
          rawMaterialId:data.rawMaterialId,
          rawMaterialBatchCode:existingWawMaterialRecord?.batchCode,
          quantity:data.quantity,
        }, { where });
      } else {
        dataArray.push({
          fineRawMaterialId:fineRawMaterialId,
          rawMaterialId:data.rawMaterialId,
          rawMaterialBatchCode:existingWawMaterialRecord?.batchCode,
          quantity:data.quantity,
        });
      }
      quantity += data.quantity;
    }

    const idsToKeep = productDetails.map(data => data.id).filter(Boolean);
    await fineRawItem.destroy({
      where: {
        fineRawMaterialId:fineRawMaterialId,
        adminId,
        id: { [Op.notIn]: idsToKeep }
      }
    });

    if (dataArray.length > 0) {
      await dbService.createMany(fineRawItem, dataArray);
    }
    await dbService.update(fineRawMaterial, { id:fineRawMaterialId }, { totalQty:quantity });
    return true;
  } catch (error) {
    console.error('Error in fineRawItem:', error.message);
    return false;
  }
};
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
  const checkId = await fineRawMaterial.findOne({ where: { batchCode } });
  if (checkId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }
  const checkRawId = await rawMaterial.findOne({ where: { batchCode } }); 
  if (checkRawId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }
  return batchCode;
}
const addFineRawMaterial = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam =  req.body;
    const { materialName } = req.body;

    if (!materialName || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! materialName is required.' });
    }

    let where = { materialName:materialName };
    where.adminId = adminId;
    if (requestParam?.id) where.id = { [Op.ne]: requestParam?.id };
  
    if (await fineRawMaterial.findOne({ where })) {
      return res.failure({ message: 'Material Name already exists' });
    }
    const dataToCreate = { ...requestParam };
    const messageType = requestParam?.id ? 'update' : 'insert';
    let token = '';
  
    if (requestParam?.id) {
      let checkId = await fineRawMaterial.findOne({ where:{ id:requestParam?.id } });
      if (!checkId){
        return res.recordNotFound({ message:'Invalid id' });
      }
      await dbService.update(fineRawMaterial, { id:requestParam?.id }, dataToCreate);
      const updateProduct = await createFineRawItem(requestParam?.productDetails, requestParam?.id, adminId);
      if (!updateProduct){
        return res.failure({ message: 'failed to update FineRawItem details' });
      }
    } else {
      dataToCreate.batchCode = await generateUniqueBatchCode();
      let getData = await dbService.createOne(fineRawMaterial, dataToCreate);
      if (getData){
        const createProduct = await createFineRawItem(requestParam?.productDetails, getData.id, adminId);
        if (!createProduct){
          await fineRawMaterial.destroy({ where: { id: getData.id } });
          return res.failure({ message: 'Something went wrong in raw material item' });
        }
        token = getData.id;
      } 
    }
    return res.success({
      message: `Fine Raw Material ${requestParam?.id ? 'Updated' : 'Added'} Successfully`,
      data: { 
        messageType,
        token
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
  
const getFineRawMaterialDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await fineRawMaterial.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          model: fineRawItem,
          as: 'productDetails',
          attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
          include: [
            {
              model: rawMaterial,
              as: 'rawMaterialData',
              attributes: ['id', 'brandName','name'],
            },
          ]  
        },
      ]
    });
    if (getData) {
      return res.success({ data: { getData } });
    } else {
      return res.recordNotFound({ message: 'Fine Raw material not found.' });
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
      let getData = await fineRawMaterial.findOne({ where });
      if (getData) {
        await dbService.update(fineRawMaterial, { id }, { isActive: status });
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
  
const getFineRawMaterialList = async (req, res) => {
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
      query[Op.or] = { 'materialName': { [Op.like]: '%' + dataToFind.search + '%' }, };
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(fineRawMaterial, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'materialName', 'isActive', 'createdAt','batchCode'];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'createdAt': -1 };
  
    foundData = await dbService.paginate(fineRawMaterial, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Fine Raw Material List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = { 
  addFineRawMaterial,
  getFineRawMaterialDetails, 
  manageStatus,
  getRawMaterialList,
  getFineRawMaterialList
};