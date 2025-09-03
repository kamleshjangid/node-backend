
const {
  rawMaterial, rawMaterialProduct, countries, supplier, stock, batch, fineProductItem, item
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, fn, col, literal 
} = require('sequelize');
const createProductItem = async (productItem, fineProductId, adminId) => {
  try {  
    const dataArray = [];
  
    for (const data of productItem) {  
      let where = {
        fineProductId,
        adminId
      };
      if (data.id){
        where.id = data.id; 
      }
      const existingRecord = await fineProductItem.findOne({ where });
      const getData = await rawMaterial.findOne({ where: { id: data.rawMaterialId } });
      if (existingRecord && data.id) {
        let number = data.measurement.replace('g', '');    
        await fineProductItem.update({
          fineProductId:fineProductId,
          rawMaterialId:data.rawMaterialId,
          stageName: data.stageName,
          quantity: data.quantity,
          measurement: number,
          ingredientCost: data.ingredientCost,
          costPerg: data.costPerg,
          rawMaterialBatchCode: getData?.batchCode,
        }, { where });
      } else {
        let number = data.measurement.replace('g', '');
        dataArray.push({
          fineProductId:fineProductId,
          rawMaterialBatchCode: getData?.batchCode,
          rawMaterialId:data.rawMaterialId,
          stageName: data.stageName,
          quantity: data.quantity,
          measurement: number,
          ingredientCost: data.ingredientCost,
          costPerg: data.costPerg,  
        });
      }
    }
  
    const idsToKeep = productItem.map(data => data.id).filter(Boolean);
    await fineProductItem.destroy({
      where: {
        fineProductId,
        adminId,
        id: { [Op.notIn]: idsToKeep }
      }
    });
  
    if (dataArray.length > 0) {
      await dbService.createMany(fineProductItem, dataArray);
    }
  
    return true;
  } catch (error) {
    console.error('Error in Create fine product Item:', error.message);
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
  const checkId = await rawMaterial.findOne({ where: { batchCode } });

  if (checkId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }

  return batchCode;
}
const addFineProduct = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam =  req.body;
    let data = null;
    let where = {
      name:requestParam.name,
      productType:requestParam.productType 
    };
    where.adminId = adminId;
    if (requestParam?.id) where.id = { [Op.ne]: requestParam?.id };
  
    if (await rawMaterial.findOne({ where })) {
      return res.failure({ message: 'Name already exists' });
    }
    let where2 = {
      itemId:requestParam?.itemId,
      adminId,
    };
    if (requestParam?.id) where2.id = { [Op.ne]: requestParam?.id };
    if (await rawMaterial.findOne({ where:where2 })) {
      return res.failure({ message: 'This item already exists' });
    }
    const dataToCreate = { ...requestParam };
    const messageType = requestParam?.id ? 'update' : 'insert';
    let token = '';
    if (dataToCreate.unitType === 'Grams'){
      dataToCreate.shortNameType = 'g';
    } else if (requestParam.unitType === 'Kilograms' ){
      dataToCreate.shortNameType = 'kg';
    } else {
      dataToCreate.shortNameType = 'lt';
    }

    if (requestParam?.id) {
      let checkId = await rawMaterial.findOne({ where:{ id:requestParam?.id } });
      if (!checkId){
        return res.recordNotFound({ message:'Invalid id' });
      }
      await dbService.update(rawMaterial, { id:requestParam?.id }, dataToCreate);
    } else {  
      dataToCreate.batchCode = await generateUniqueBatchCode();
      let getData = await dbService.createOne(rawMaterial, dataToCreate);
      if (getData){
        data = getData;
        token = getData.id;
      } 
    }
    return res.success({
      message: `Fine Product  ${requestParam?.id ? 'Updated' : 'Added'} Successfully`,
      data: { 
        messageType,
        token,
        getData:data
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const addFineProductItem = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      id, productItem, recipeCost, recipeSize, recipeUnitCost, recipeUnitSize 
    } =  req.body;
    if (!id || !productItem || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! id, productItem is required.' });
    }
    if (!productItem || productItem.length == 0) {
      return res.badRequest({ message: 'At least 1 order item is required to place an order., key: productItems' });
    }
    const getRawMaterial = await rawMaterial.findOne({
      where:{
        id,
        adminId,
        productType:'Production'
      } 
    });
    if (!getRawMaterial){
      return res.failure({ message: 'Invalid product id' });
    }
    const insertItem = await createProductItem(productItem, id, adminId);
    if (!insertItem){
      return res.failure({ message: 'Something went wrong in product item' });
    }
    await dbService.update(rawMaterial, { id }, {
      recipeCost,
      recipeSize,
      recipeUnitCost,
      recipeUnitSize 
    });  
    return res.success({ message: 'Product Item Added Successfully ' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getProductItemDetails = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    const getRawMaterial = await rawMaterial.findOne({
      where:{
        id,
        adminId,
        productType:'Production'
      },
      attributes: ['id', 'brandName','name','sku','size',['shortNameType','unitType'],'expiryYield','recipeSize','recipeCost','recipeUnitSize','recipeUnitCost'],
    });
    let where = { fineProductId:id };
    let getData = await fineProductItem.findAll({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include: [
        {
          required:true,
          model: rawMaterial,
          as: 'rawMaterialData',
          attributes: ['id', 'brandName','name','sku','size',['shortNameType','unitType']],
        }
      ],
    });
    return res.success({
      data: {
        getData,
        fineProductData:getRawMaterial 
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
      include:[
        {
          model: fineProductItem,
          as: 'fineProductItemData',
          attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] }, 
          include: [
            {
              model: rawMaterial,
              as: 'rawMaterialData',
              attributes:['id','brandName','name','sku','size',['shortNameType','unitType']]
            }
          ],    
        },
        {
          model: item,
          as: 'itemData',
          attributes:['id','name']
        }

      ]
    });
    if (getData) {
      return res.success({ data: { getData } });
    } else {
      return res.recordNotFound({ message: 'Fine Product not found.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getFineProductList = async (req, res) => {
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
    query.productType = 'Production';
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
    querOptions.select = ['id', 'brandName', 'name', 'sku', 'size', ['shortNameType','unitType'], 'productType', 'categoryName', 'isActive', 'createdAt','batchCode'];
    if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    else querOptions.sort = { 'brandName': 1 };
  
    foundData = await dbService.paginate(rawMaterial, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Fine Product List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getMaterialDetails = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.body;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    const getRawData = await rawMaterial.findOne({
      where: {
        id,
        adminId 
      }, 
      attributes:['brandName','name','sku','size',['shortNameType','unitType']]
    });
    if (!getRawData){
      return res.failure({ message:'Invalid id' });
    }
    const getData = await rawMaterialProduct.findOne({
      where: {
        rawMaterialId: id,
        adminId
      },
      attributes: [
        [fn('SUM', literal(`CAST("buyPrice" AS numeric)`)), 'buyPriceSum'],
        [fn('COUNT', col('*')), 'noOfSupplier']
      ],
      raw: true
    });
    return res.success({
      data: {
        getData,
        rawData: getRawData
      },
      message: 'Fine Product Raw Item Details'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getItemList  = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { id } = req.body;
    let where = {
      isDeleted: false,
      isActive: true,
    };
    where.adminId = adminId;
    if (id){
      where = { isDeleted: false, };
    }
    const getData = await item.findAll({
      where: where,
      attributes: ['id', 'name'],
      order: [
        ['name', 'ASC'],
      ],
    });
    return res.success({
      data: getData,
      message: 'Item Group List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  addFineProduct,
  getDetails,
  getFineProductList,
  addFineProductItem,
  getProductItemDetails,
  getMaterialDetails,
  getItemList
};