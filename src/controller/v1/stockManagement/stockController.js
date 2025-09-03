const {
  stock, batch, rawMaterial
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize 
} = require('sequelize');
const getDetails = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;

    const { id } = req.params;
    if (!id || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! id, adminId is required.' });
    }
    let where = { id };
    let getData = await rawMaterial.findOne({
      where,
      attributes: ['id', 'brandName', 'name', 'size', 'sku', ['shortNameType', 'unitType'],'manageStock','onHand','available','onOrder','toBePicked','minimumStockHold'],
      include: [
        {
          model: batch,
          as: 'batchData',
          attributes:['id', 'batchId', 'batchCode', 'costOfGoods','stockOnHand'],
        },
      ]
    });
    if (getData) {
      return res.success({ data:{ getData } });
    } else {
      return res.recordNotFound({ message: 'Raw material not found.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getBatchDetails = async (req, res) => {
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
  const checkId = await batch.findOne({ where: { batchId:batchCode } });  
  if (checkId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }
  
  return batchCode;
}
const addBatch = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body; 
    const {
      rawMaterialId, batchCode, id, costOfGoods, productionDate, expiryDate, expiryType,
    } = requestParam;
    
    if (!rawMaterialId || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! rawMaterialId, stockId, countryId, adminId is required.' });
    }
    
    const dataToCreate = {
      rawMaterialId,
      batchCode,
      costOfGoods,
      productionDate,
      expiryDate,
      expiryType
    };  
    const messageType = id ? 'update' : 'insert';
    let token = '';    
    if (id) {
      await dbService.update(batch, { id }, dataToCreate);      
    } else {
      dataToCreate.batchId = await generateUniqueBatchCode();
      let getData = await dbService.createOne(batch, dataToCreate);
      if (getData) token = getData.id;
    }
    const result = await batch.findOne({
      where:{ rawMaterialId },
      attributes: [
        [
          Sequelize.fn('SUM', Sequelize.cast(Sequelize.col('stockOnHand'), 'INTEGER')),
          'stockOnHand'
        ]
      ]
    });  
    await dbService.update(rawMaterial, { id:rawMaterialId }, {
      onHand:result.stockOnHand,
      available:result.stockOnHand
    });    
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
const removeBatch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await batch.findOne({ where });
    if (getData) {
      try {
        await batch.destroy({ where }); 
        const result = await batch.findOne({
          where:{ rawMaterialId:getData.rawMaterialId },
          attributes: [
            [
              Sequelize.fn('SUM', Sequelize.cast(Sequelize.col('stockOnHand'), 'INTEGER')),
              'stockOnHand'
            ]
          ]
        });  
        await dbService.update(rawMaterial, { id:getData.rawMaterialId }, {
          onHand:result.stockOnHand,
          available:result.stockOnHand
        });    
      } catch (error) {
        return res.failure({ message: 'This batch not delete' });
      }

      return res.success({ message: 'Batch Deleted' });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const updateStock = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body; 
    const {
      id, manageStock, minimumStockHold
    } = requestParam;
      
    if (!manageStock || !id) {
      return res.badRequest({ message: 'Insufficient request parameters! id, manageStock is required.' });
    }
      
    const updateData = {
      manageStock,
      stockStatus:manageStock.toLowerCase() == 'yes' ? 'IN STOCK' : 'OUT OF STOCK',
      minimumStockHold
    };
    await dbService.update(rawMaterial, { id }, updateData);      
    return res.success({ message: `Stock Updated Successfully` });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  getDetails,
  addBatch,
  getBatchDetails,
  removeBatch,
  updateStock
};