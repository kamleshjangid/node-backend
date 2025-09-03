const {
    stock, batch  
  } = require('@model/index');
  const dbService = require('@utils/dbService');
  const {
    Op, Sequelize 
  } = require('sequelize');
  function generateBatchId () {
    const timestamp = Date.now().toString().slice(-5); 
    const randomPart = Math.floor(Math.random() * 10).toString();
    return timestamp + randomPart;
  }
  
  const createBatch = async (dataToCreate, stockId, adminId) => {
    try {
      if (!dataToCreate.batchDetails || dataToCreate.batchDetails.length === 0) return false;
  
      const dataArray = [];
      let stockValue = 0;
      for (const data of dataToCreate.batchDetails) {
        let where = {
          rawMaterialId: dataToCreate.rawMaterialId,
          stockId,
          adminId,
        };
  
        if (data.id) {
          where.id = data.id; 
        }
  
        const existingRecord = await batch.findOne({ where });
  
        if (existingRecord && data.id) {
          await batch.update({
            rawMaterialId: dataToCreate.rawMaterialId,
            stockId,
            adminId,
            countryId: dataToCreate.countryId,
            batchCode: data.batchCode,
            costOfGoods: data.costOfGoods,
            productionDate: data.productionDate,
            expiryDate: data.expiryDate,
            expiryType: data.expiryType,
            stockOnHand:data?.stockOnHand,
          }, { where });
        } else {
          let batchId = generateBatchId();
          let checkBatchId = await batch.findOne({ where: { batchId } });
  
          while (checkBatchId) {
            batchId = generateBatchId();
            checkBatchId = await batch.findOne({ where: { batchId } });
          }
  
          dataArray.push({
            rawMaterialId: dataToCreate.rawMaterialId,
            stockId,
            adminId,
            batchId,
            countryId: dataToCreate.countryId,
            batchCode: data.batchCode,
            costOfGoods: data.costOfGoods,
            productionDate: data.productionDate,
            expiryDate: data.expiryDate,
            expiryType: data.expiryType,
            stockOnHand:data?.stockOnHand,
          });
        }
        stockValue += +(data?.stockOnHand == 'NaN' ? 0 : data?.stockOnHand);
      }
  
      const idsToKeep = dataToCreate.batchDetails.map(data => data.id).filter(Boolean);
  
      await batch.destroy({
        where: {
          rawMaterialId: dataToCreate.rawMaterialId,
          stockId,
          adminId,
          id: { [Op.notIn]: idsToKeep }
        }
      });
  
      if (dataArray.length > 0) {
        await dbService.createMany(batch, dataArray);
      }
      // Update stockOnHand in stock table
      const stockData = await stock.findByPk(stockId);
      if (stockData) {
        const updatedStockOnHand = +stockData.stockOnHand + stockValue;
        const updatedStockAvailable = +stockData.stockAvailable + stockValue;
        await stock.update({
          stockOnHand: updatedStockOnHand,
          stockAvailable:updatedStockAvailable 
        }, { where: { id: stockId } });
      } else {
        console.error(`Stock with ID ${stockId} not found.`);
      }
      return true;
    } catch (error) {
      console.error('Error in createRawProduct:', error);
      return false;
    }
  };
  
  const addStock = async (req, res) => {
    try {
      const adminId = req.headers['admin-id'] || null;
      const requestParam = req.body; 
      const {
        countryId, manageStock, id, stockStatus, rawMaterialId, stockOnHand, stockAvailable, onOrder, toBePicked, minimumStockHold
      } = requestParam;
  
      if (!countryId || !manageStock || !rawMaterialId || !adminId) {
        return res.badRequest({ message: 'Insufficient request parameters! countryId, manageStock, rawMaterialId, adminId is required.' });
      }
      if (manageStock.toLocaleLowerCase() == 'yes') {
        if (minimumStockHold == undefined) {
          return res.badRequest({ message: 'Insufficient request parameters! minimumStockHold is required.' });
        }
      }
      let where = { rawMaterialId  };
      where.adminId = adminId;
      if (id) where.id = { [Op.ne]: id };
  
      if (await stock.findOne({ where })) {
        return res.failure({ message: 'Stock already exists' });
      }
      const dataToCreate = {
        countryId,
        manageStock,
        stockStatus,
        rawMaterialId,
      };
      if (manageStock.toLocaleLowerCase() == 'yes') {
        // dataToCreate.stockOnHand = stockOnHand;
        // dataToCreate.stockAvailable = stockAvailable;
        dataToCreate.onOrder = onOrder;
        dataToCreate.toBePicked =  toBePicked;
        dataToCreate.minimumStockHold = minimumStockHold; 
      }
  
      const messageType = id ? 'update' : 'insert';
      let token = '';
  
      if (id) {
        await dbService.update(stock, { id }, dataToCreate);
        if (requestParam.batchDetails.length > 0){
          const insertBatch = await createBatch(requestParam, id, adminId);
          if (!insertBatch){
          // await batch.destroy({ where: { stockId: id } });
            return res.failure({ message: 'Something went wrong in batch' });
          }
        }
      } else {
        let getData = await dbService.createOne(stock, dataToCreate);
        if (getData){
          token = getData.id;
        };
      }
  
      return res.success({
        message: `Stock ${id ? 'Updated' : 'Added'} Successfully`,
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
      let where = { rawMaterialId:id };
      let getData = await stock.findOne({
        where,
        attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] }
      });
      if (getData) {
        return res.success({ data: getData });
      } else {
        return res.recordNotFound({ message:'Stock not found' });
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
        let getData = await stock.findOne({ where });
        if (getData) {
          await dbService.update(stock, { id }, { isActive: status });
          return res.success({ message: `${status == 0 ? 'Inactive' : 'Active'} successfully` });
        } else {
          return res.recordNotFound({ message: 'Stock not found' });
        }
  
      } else {
        return res.failure({ message: 'Invalid status' });
      }
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
  };
  const stockList = async (req, res) => {
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
        query[Op.or] = { 'manageStock': { [Op.like]: '%' + dataToFind.search + '%' }, };
      }
      if (!dataToFind.rawMaterialId) {
        query.rawMaterialId = null;
      }
  
      query.adminId = adminId;
      let foundData;
      if (dataToFind && dataToFind.isCountOnly) {
        foundData = await dbService.count(stock, query);
        if (!foundData) {
          return res.recordNotFound();
        }
        foundData = { totalRecords: foundData };
        return res.success({ data: foundData });
      }
      if (dataToFind && dataToFind.querOptions !== undefined) {
        querOptions = dataToFind.querOptions;
      }
      querOptions.select = ['id', 'manageStock', 'stockStatus','stockOnHand','stockAvailable', 'isActive', 'createdAt'];
      if (options.sortBy) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
      else querOptions.sort = { 'createdAt': -1 };
  
      foundData = await dbService.paginate(stock, query, querOptions);
      return res.success({
        data: foundData,
        message: 'Stock List'
      });
    } catch (error) {
      return res.internalServerError({ message: error.message });
    }
  };
  
  module.exports = { 
    addStock,
    getDetails, 
    manageStatus,
    stockList
  };