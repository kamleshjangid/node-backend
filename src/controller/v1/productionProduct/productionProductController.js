
const {
  rawMaterial, rawMaterialProduct, countries, supplier, stock, batch, fineProductItem, productionProduct 
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, fn, col, literal 
} = require('sequelize');
const addProductionProduct = async (req, res) => {
  try {
    const curDate = new Date();

    const adminId = req.headers['admin-id'] || null;
    const requestParam =  req.body;
    const {
      fineProductId, batchQty, batchCode
    } =  requestParam;
    if (!fineProductId || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! fineProductId is required.' });
    }

    let where = { 
      adminId, 
      batchCode,
    };

    if (requestParam?.id) where.id = { [Op.ne]: requestParam?.id };

    if (await productionProduct.findOne({ where })) {
      return res.failure({ message: 'Batch Code already exists' });
    }

    const dataToCreate = { ...requestParam };

    if (batchQty){
      const getRawData = await rawMaterial.findOne({
        where: {
          id:fineProductId,
          adminId 
        }, 
        attributes:['id','expiryYield',['shortNameType','unitType'],'batchShelfLife','batchShelfLifeType','expiryType'],
      });
      const getProductItem = await fineProductItem.findOne({
        where: {
          fineProductId:fineProductId,
          adminId 
        },
        attributes: [
          [fn('SUM', literal(`CAST("measurement" AS numeric)`)), 'measurement'],
          [fn('SUM', literal(`CAST("ingredientCost" AS numeric)`)), 'ingredientCost'],
        ],
      });
      dataToCreate.expectedYield = +batchQty * +getRawData?.expiryYield;
      dataToCreate.totalSize = +batchQty * +getProductItem?.measurement;
      dataToCreate.totalCost = +batchQty * +getProductItem?.ingredientCost;
      dataToCreate.expiryType = getRawData?.expiryType;
    }

    const messageType = requestParam?.id ? 'update' : 'insert';
    let token = '';  
    if (requestParam.assignedTo){
      const string = requestParam.assignedTo.join(', ');
      dataToCreate.assignedTo = string;
    }
    if (dataToCreate.currentStage == 'Mixing'){
      dataToCreate.mixingTime = curDate;
    } else if (dataToCreate.currentStage == 'Baking'){
      dataToCreate.bakingTime = curDate;
      dataToCreate.bakingTime = curDate;
    } else {
      dataToCreate.bakingTime = curDate;
      dataToCreate.mixingTime = curDate;
      dataToCreate.packingTime = curDate;
    }
    dataToCreate.actualYield = dataToCreate.expectedYield;
    if (requestParam?.id) {
      let checkId = await productionProduct.findOne({ where:{ id:requestParam?.id } });
      if (!checkId){
        return res.recordNotFound({ message:'Invalid id' });
      }
      await dbService.update(productionProduct, { id:requestParam?.id }, dataToCreate);
    } else {  
      let getData = await dbService.createOne(productionProduct, dataToCreate);
      if (getData){
        token = getData.id;
      } 
    }
    return res.success({
      message: `Production Product  ${requestParam?.id ? 'Updated' : 'Added'} Successfully`,
      data: { 
        messageType,
        token,
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getFineProductDetails = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.body;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    const getProductionProductData = await productionProduct.findOne({
      where: { adminId }, 
      attributes:['batchCode'],
      order:[['createdAt','DESC']]
    });
    const getRawData = await rawMaterial.findOne({
      where: {
        id,
        adminId 
      }, 
      attributes:['id','expiryYield',['shortNameType','unitType'],'batchShelfLife','batchShelfLifeType','expiryType'],
    });
    const getProductItem = await fineProductItem.findOne({
      where: {
        fineProductId:id,
        adminId 
      },
      attributes: [
        [fn('SUM', literal(`CAST("measurement" AS numeric)`)), 'measurement'],
        [fn('SUM', literal(`CAST("ingredientCost" AS numeric)`)), 'ingredientCost'],
      ],
    });

    if (!getRawData){
      return res.failure({ message:'Invalid id' });
    }
    let currentDate = new Date();
    const daysToAdd = +getRawData?.batchShelfLife;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    let futureDate = currentDate.toISOString().split('T')[0];
    const obj = getRawData.toJSON();
    obj.totalSize = getProductItem?.measurement;
    obj.ingredientCost = getProductItem?.ingredientCost;
    obj.expiryType = getRawData?.expiryType;
    obj.expireDate = futureDate;
    obj.batchCode = getProductionProductData ? getProductionProductData.batchCode + 1 : 1;

    return res.success({
      data: { getData:obj },
      message: 'Fine Product Raw Item Details'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getProductionProductDetails = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    const getData = await productionProduct.findOne({
      where: {
        id,
        adminId 
      },
      include: [
        {
          model: rawMaterial,
          as: 'rawMaterialData',
          attributes: ['id', 'brandName','name','sku','size',['shortNameType','unitType']],
          include: [
            {
              model: fineProductItem,
              as: 'fineProductItemData',
              attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
              include: [
                {
                  model: rawMaterial,
                  as: 'rawMaterialData',
                  attributes: ['id', 'brandName','name','sku','size',['shortNameType','unitType']],
                }
              ],    
    
            }
          ],    
        }
      ],
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
    });   
    if (!getData){
      return res.failure({ message:'Invalid id' });
    }
    const getRawData = await rawMaterial.findOne({
      where: {
        id:getData.fineProductId,
        adminId 
      }, 
      attributes:['id','expiryYield',['shortNameType','unitType']],
    });
    const getProductItem = await fineProductItem.findOne({
      where: {
        fineProductId:getData.fineProductId,
        adminId 
      },
      attributes: [
        [fn('SUM', literal(`CAST("measurement" AS numeric)`)), 'measurement'],
        [fn('SUM', literal(`CAST("ingredientCost" AS numeric)`)), 'ingredientCost'],
      ],
    });     
    const obj = getData.toJSON();
    obj.assignedTo = getData.assignedTo ? getData.assignedTo.split(',') : [];
    obj.totalMeasurement = getProductItem?.measurement;
    obj.ingredientCost = getProductItem?.ingredientCost;
    obj.getRawData = getRawData;
    return res.success({
      data: { getData:obj },
      message: 'Production Product Details'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const deleteProductionProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await productionProduct.findOne({ where });
    if (getData) {
      try {
        await productionProduct.destroy({ where }); 
      } catch (error) {
        return res.failure({ message: 'This production product not delete' });
      }
      return res.success({ message: 'Product Deleted' });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const updateStatus = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam =  req.body;
    const {
      id, actualYield, statusNotes
    } =  requestParam;
    if (!id || !actualYield || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! id, actualYield, statusNotes is required.' });
    }    
    if (id) {
      let checkId = await productionProduct.findOne({ where:{ id } });
      if (!checkId){
        return res.recordNotFound({ message:'Invalid id' });
      }
      const getRawData = await rawMaterial.findOne({
        where: {
          id:checkId.fineProductId,
          adminId 
        }, 
        attributes:['expiryYield'],
      });

      const updateData = {
        actualYield,
        statusNotes,
      };
      updateData.batchQty = actualYield / +getRawData.expiryYield;
      const curDate = new Date();
      if (checkId.currentStage == 'Mixing'){
        updateData.bakingTime = curDate;
        updateData.bakingActualYield = actualYield;
        updateData.currentStage = 'Baking';
      } else if (checkId.currentStage == 'Baking'){
        updateData.packingTime = curDate;
        updateData.packingActualYield = actualYield;
        updateData.currentStage = 'Packing';
      } else {
        updateData.completedTime = curDate;
        updateData.completedActualYield = actualYield;
        updateData.currentStage = 'Completed';
        const getRawMaterialData = await rawMaterial.findOne({
          where:{
            id: checkId.fineProductId,
            inventoryType: 1 
          } 
        });
        const stockUpdate = {
          inventoryType: 1,
          stockStatus:'IN STOCK',
          onHand: actualYield,
          available: actualYield
        };
        if (getRawMaterialData) {
          stockUpdate.onHand = +actualYield + (+getRawMaterialData.onHand);
          stockUpdate.available = +actualYield + (+getRawMaterialData.available);
        }
        await rawMaterial.update(stockUpdate, { where: { id: checkId.fineProductId, } });
      }    
      await dbService.update(productionProduct, { id }, updateData);
    } else {  
      return res.recordNotFound({ message:'Invalid id' });
    }
    return res.success({ message: `Update Status Successfully` });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getProductionProductList = async (req, res) => {
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
        // 'productionDate': { [Op.like]: '%' + dataToFind.search + '%' },
        'batchQty': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(productionProduct, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'productionDate', 'batchCode', 'batchQty','currentStage'];
    querOptions.include = [{
      model: rawMaterial,
      as: 'rawMaterialData',
      attributes: ['id', 'brandName','name','sku','size',['shortNameType','unitType']],
    }];

    if (options.sortBy && Object.keys(options.sortBy).length !== 0) {
     
      if (options.sortBy.orderBy == 'name'){
        querOptions.order  = [[{
          model: rawMaterial,
          as: 'rawMaterialData' 
        }, 'name', options.sortBy.order == 'asc' ? 1 : -1 ]];
      } else {
        querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };      }
    } else { querOptions.sort = { 'batchCode': 1 }; }
  
    foundData = await dbService.paginate(productionProduct, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Production Product List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  addProductionProduct,
  getFineProductDetails ,
  deleteProductionProduct,
  getProductionProductDetails,
  updateStatus,
  getProductionProductList
};