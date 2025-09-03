const {
  purchaseOrder, purchaseOrderItem, rawMaterialProduct, rawMaterial, supplier, fineRawMaterial, batch
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize
} = require('sequelize');
const { ORDER_STATUS } = require('@constants/authConstant');
const { sendEmail } = require('@helpers/function');
function generateBatchId () {
  const timestamp = Date.now().toString().slice(-5);
  const randomPart = Math.floor(Math.random() * 10).toString();
  return timestamp + randomPart;
}
const createProductItem = async (dataToCreate, purchaseOrderId) => {
  try {
    const dataArray = [];
    const dataToCreateArray = [];
    let subTotal = 0;
    let totalQty = 0;
    for (const data of dataToCreate.productItems) {
      const getMaterialData = await rawMaterialProduct.findOne({ where: { id: data.productId } });
      if (!getMaterialData) return true;
      const getData = await rawMaterial.findOne({ where: { id: getMaterialData.rawMaterialId } });
      if (!getData) return true;
      let itemPrice = getMaterialData.buyPrice;
      let itemTotal = data.quantity * itemPrice;
      subTotal += itemTotal;
      totalQty += +data.quantity;
      let where = { purchaseOrderId: purchaseOrderId };
      if (data.id) {
        where.id = data.id;
      }
      const existingRecord = await purchaseOrderItem.findOne({ where });

      if (existingRecord && data.id) {
        await purchaseOrderItem.update({
          itemPrice: itemPrice,
          quantity: data.quantity,
          itemTotal: itemTotal,
          purchaseOrderId: purchaseOrderId,
          supplierId: dataToCreate.supplierId,
          countryId: dataToCreate.countryId,
          rawMaterialId: getMaterialData.rawMaterialId,
          rawMaterialName: getData?.name,
          brandName: getData?.brandName,
          name: getData?.name,
          size: getData?.size,
          unitType: getData?.unitType,
          shortNameType: getData?.shortNameType,
          sku: getData?.sku,
          rawMaterialBatchCode: getData?.batchCode,

          purchasedBy: getMaterialData.purchasedBy,
          purchaseCartonQty: getMaterialData?.purchaseCartonQty,
          buyPrice: getMaterialData.buyPrice,
          buyTax: getMaterialData.buyTax,
          supplierSKU: getMaterialData.supplierSKU,

        }, { where });
      } else {
        let batchId = generateBatchId();
        let checkBatchId = await purchaseOrderItem.findOne({ where: { batchNumber: batchId } });

        while (checkBatchId) {
          batchId = generateBatchId();
          checkBatchId = await purchaseOrderItem.findOne({ where: { batchNumber: batchId } });
        }
        // dataToCreateArray.push({
        //   rawMaterialId:getMaterialData.rawMaterialId,
        //   batchCode:batchId,
        //   costOfGoods:getMaterialData.buyPrice
        // });
        dataArray.push({
          itemPrice: itemPrice,
          quantity: data.quantity,
          itemTotal: itemTotal,
          purchaseOrderId: purchaseOrderId,
          supplierId: dataToCreate.supplierId,
          countryId: dataToCreate.countryId,
          batchNumber: batchId,
          rawMaterialId: getMaterialData.rawMaterialId,
          rawMaterialName: getData?.name,
          brandName: getData?.brandName,
          name: getData?.name,
          size: getData?.size,
          unitType: getData?.unitType,
          shortNameType: getData?.shortNameType,
          sku: getData?.sku,
          rawMaterialBatchCode: getData?.batchCode,

          purchasedBy: getMaterialData.purchasedBy,
          purchaseCartonQty: getMaterialData?.purchaseCartonQty,
          buyPrice: getMaterialData.buyPrice,
          buyTax: getMaterialData.buyTax,
          supplierSKU: getMaterialData.supplierSKU,
        });
      }
    }
    if (dataToCreateArray.length > 0){
      await dbService.createMany(batch, dataToCreateArray);
    }

    const getOrder = await purchaseOrder.findOne({
      where: { id: purchaseOrderId },
      attributes: ['lastStatus']
    });
    await purchaseOrder.update({
      orderNotes: dataToCreate?.orderNotes,
      subTotal,
      totalQty,
      total: subTotal,
      orderStatus: '2',
      lastStatus: getOrder.lastStatus,
    }, { where: { id: purchaseOrderId } });
    const idsToKeep = dataToCreate.productItems.map(data => data.id).filter(Boolean);

    await purchaseOrderItem.destroy({
      where: {
        purchaseOrderId: purchaseOrderId,
        id: { [Op.notIn]: idsToKeep }
      }
    });

    if (dataArray.length > 0) {
      await dbService.createMany(purchaseOrderItem, dataArray);
    }
    return true;
  } catch (error) {
    console.error('Error in createRawProduct:', error);
    return false;
  }
};
function generateODCode (autoIncrementId) {
  // Generate a random number between 0 and 999
  let number = Math.floor(Math.random() * 1000);

  // Convert the number to a string and pad with leading zeros if necessary
  let threeDigitString = number.toString().padStart(3, '0');

  // Add the prefix "OD"
  let resultString = threeDigitString + autoIncrementId;

  return resultString;
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
  const checkId = await purchaseOrder.findOne({ where: { batchCode } });

  if (checkId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }

  const checkFineId = await fineRawMaterial.findOne({ where: { batchCode } });
  if (checkFineId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }
  const checkRawId = await rawMaterial.findOne({ where: { batchCode } }); 
  if (checkRawId) {
    return generateUniqueBatchCode(); // Recursively call the function if the batch code exists
  }  

  return batchCode;
}
const createPurchaseOrder = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body;
    const {
      supplierId, countryId, id, productItems, orderNotes
    } = requestParam;

    if (!supplierId || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! supplierId, countryId is required.' });
    }
    const curDate = new Date();
    if (id) {
      const existingRecord = await purchaseOrderItem.findOne({ where: { purchaseOrderId: id } });
      if (!productItems || productItems.length == 0) {
        return res.badRequest({ message: 'At least 1 order item is required to place an order., key: productItems' });
      }
      let getData = await purchaseOrder.findOne({
        where: { id: id },
        include: [
          {
            model: purchaseOrderItem,
            as: 'purchaseOrderItemData',
            attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
          },
        ]
      });
      if (getData.orderStatus == ORDER_STATUS.COMPLETED || getData.orderStatus == ORDER_STATUS.CANCELLED) {
        let message = 'Order is not updated because the order is completed.';
        if (getData.orderStatus == ORDER_STATUS.CANCELLED) {
          message = 'Order is not updated because the order is canceled.';
        }
        return res.failure({ message: message });
      }
      const insertItem = await createProductItem(requestParam, id);
      if (!insertItem) {
        return res.failure({ message: 'Something went wrong in batch' });
      }
      /*
       * if (!existingRecord){
       * const success = await sendEmail('muditjain1934@gmail.com', 'Test Subject', 'Hello, this is a test email body!');
       * if (success) {
       *   console.log('okk');
       *   await purchaseOrder.update({ orderStatus:'5' }, { where: { id:id } });
       *   console.log('Email sent successfully!');
       * }
       * }
       */
      getData = await purchaseOrder.findOne({
        where: { id: id },
        attributes: ['id', 'supplierName', 'orderDate', 'orderStatus', 'supplierId', 'total', 'subTotal', 'orderPrefix'],
        include: [
          {
            model: purchaseOrderItem,
            as: 'purchaseOrderItemData',
            attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
            include: [
              {
                model: rawMaterial,
                as: 'rawMaterialData',
                attributes: ['brandName', 'name', 'size', 'unitType'],
                include: [
                  {
                    model: rawMaterialProduct,
                    as: 'productDetails',
                    attributes: ['purchaseCartonQty', 'purchasedBy', 'supplierSKU'],
                  },
                ]
              },
            ]
          },
        ]
      });
      if (getData) {
        const obj = getData.toJSON();
        const supplierData = await supplier.findOne({
          where: { id: getData?.supplierId },
          attributes: ['orderMethod', 'mobileNumber'],
        });
        let orderStatus = {};
        orderStatus.orderMethod = supplierData?.orderMethod;
        orderStatus.mobileNumber = supplierData?.mobileNumber;
        orderStatus.sendStatus = getData?.orderStatus;
        obj.orderStatusObj = orderStatus;
        return res.success({
          message: `Order has been placed`,
          data: { getData: obj }
        });
      }
    } else {
      let autoIncrementId = 1;
      const getOrder = await purchaseOrder.findOne({
        attributes: ['autoIncrementId', 'createdAt'],
        order: [
          ['createdAt', 'DESC'],
          ['autoIncrementId', 'DESC']
        ]
      });
      if (getOrder) {
        autoIncrementId = getOrder.autoIncrementId + 1;
      }
      const orderNumber = generateODCode(autoIncrementId);
      let supplierData = await supplier.findOne({
        where: { id: supplierId },
        attributes: ['companyName'],
      });

      const dataToCreate = {
        supplierName: supplierData?.companyName,
        supplierId,
        countryId,
        orderNumber,
        autoIncrementId,
      };
      if (orderNotes) {
        dataToCreate.orderNotes = orderNotes;
      }
      dataToCreate.orderDate = curDate;
      dataToCreate.batchCode = await generateUniqueBatchCode();
      let getData = await dbService.createOne(purchaseOrder, dataToCreate);
      if (getData) {
        return res.success({
          message: `Order Created`,
          data: { getData }
        });
      } else {
        return res.failure({ message: `Failed To Create Order` });
      }
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const purchaseOrderList = async (req, res) => {
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
        'orderNumber': { [Op.like]: '%' + dataToFind.search + '%' },
        'total': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }
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
    querOptions.select = ['id', 'orderPrefix', 'orderNumber', 'total', 'orderDate', 'orderStatus','batchCode'];
    querOptions.include = [{
      model: supplier,
      as: 'supplierData',
      attributes: ['id', 'companyName']
    }];
    if (options.sortBy) {
      querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order };
    } else { querOptions.sort = { 'createdAt': -1 }; }
    foundData = await dbService.paginate(purchaseOrder, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Purchase Order List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const purchaseOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await purchaseOrder.findOne({
      where,
      attributes: ['id', 'orderPrefix', 'supplierName', 'orderDate', 'orderStatus', 'supplierId', 'orderNumber', 'totalQty', 'total', 'subTotal', 'orderNotes', 'batchNumber'],
      include: [
        {
          model: purchaseOrderItem,
          as: 'purchaseOrderItemData',
          attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
          include: [
            {
              model: rawMaterial,
              as: 'rawMaterialData',
              attributes: ['id', 'brandName', 'name', 'size', 'sku', ['shortNameType', 'unitType']],
              include: [
                {
                  model: rawMaterialProduct,
                  as: 'productDetails',
                  attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
                },
              ]
            },
          ]
        },
        {
          model: supplier,
          as: 'supplierData',
          attributes: ['id', 'companyName', 'orderMethod', 'mobileNumber', 'emailCc', 'email'],
        }
      ]

    });
    if (getData) {
      const obj = getData.toJSON();
      let orderStatus = {};
      if (getData?.supplierData?.orderMethod != 'Email') {
        orderStatus.mobileNumber = getData?.supplierData?.mobileNumber;
      } else {
        orderStatus.email = getData?.supplierData?.email;
        orderStatus.emailCc = getData?.supplierData?.emailCc;
      }
      orderStatus.orderMethod = getData?.supplierData?.orderMethod;
      orderStatus.sendStatus = getData?.orderStatus;
      obj.orderStatusObj = orderStatus;
      return res.success({ data: { getData: obj } });
    } else {
      return res.recordNotFound({ message: 'Purchase Order not found.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const manageOrderStatus = async (req, res) => {
  try {
    let {
      id, status
    } = req.body;
    if (!id || !status) {
      return res.badRequest({ message: 'Insufficient request parameters! id, status is required.' });
    }
    if (status == ORDER_STATUS.ORDER_PLACED || status == ORDER_STATUS.QUEUED || status == ORDER_STATUS.MODIFYING || status == ORDER_STATUS.HOLD_ORDER || status == ORDER_STATUS.EMAIL_DELIVERED || status == ORDER_STATUS.RECEIVING || status == ORDER_STATUS.PENDING_RECEIVING || status == ORDER_STATUS.COMPLETED || status == ORDER_STATUS.CANCELLED || status == ORDER_STATUS.SHIPPED || status == ORDER_STATUS.UNHOLD_ORDER) {
      let where = { id };
      let getData = await purchaseOrder.findOne({ where });
      if (getData) {
        if (getData.orderStatus == '9') {
          return res.success({ message: 'Order already cancelled' });
        }
        if (getData.orderStatus == '8') {
          return res.success({ message: 'Order already completed' });
        }
        let updateStatus = true;
        let message = 'Status Update successfully';
        if (status == ORDER_STATUS.ORDER_PLACED) {
          // Your code here for ORDER_PLACED status
        } else if (status == ORDER_STATUS.QUEUED) {
          // Your code here for QUEUED status
        } else if (status == ORDER_STATUS.MODIFYING) {
          // Your code here for MODIFYING status
        } else if (status == ORDER_STATUS.HOLD_ORDER) {

        } else if (status == ORDER_STATUS.UNHOLD_ORDER) {
          status = getData.lastStatus;
        } else if (status == ORDER_STATUS.EMAIL_DELIVERED) {
          // Your code here for EMAIL_DELIVERED status
        } else if (status == ORDER_STATUS.RECEIVING) {
          // Your code here for RECEIVING status
        } else if (status == ORDER_STATUS.PENDING_RECEIVING) {
          // Your code here for PENDING_RECEIVING status
        } else if (status == ORDER_STATUS.COMPLETED) {
          const productItems = await purchaseOrderItem.findAll({ where: { purchaseOrderId: id } });
          if (!await completeOrder(id,productItems)){
            return res.failure({ message: 'Something went wrong in complete order' });
          }
          message = 'Your Order is completed you can not change status';
        } else if (status == ORDER_STATUS.CANCELLED) {
          message = 'Your Order is cancelled';
        } else if (status == ORDER_STATUS.SHIPPED) {
          message = 'Your Order is shipped';
        } else {
        }
        if (updateStatus) {
          await dbService.update(purchaseOrder, { id }, {
            orderStatus: status,
            lastStatus: getData.orderStatus,
          });
          return res.success({ message: message });
        } else {
          return res.success({ message: 'Something went wrong' });
        }
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
async function completeOrder (id, productItems) {
  try {
    if (!productItems || productItems.length == 0) {
      return false;
    }
    
    let autoIncrementId = 1;
    const getOrder = await purchaseOrder.findOne({
      attributes: ['receiveNumber'],
      order: [
        ['createdAt', 'DESC'],
      ]
    });

    if (getOrder) {
      if (getOrder.receiveNumber) {
        const lastTwoDigits = +getOrder.receiveNumber.toString().slice(-2) + 1;
        autoIncrementId += lastTwoDigits;
      } else {
        autoIncrementId += 1;
      }
    }
    let receiveNumber = generateReceCode(autoIncrementId);
    let checkReceiveNumber = await purchaseOrder.findOne({ where: { receiveNumber } });

    while (checkReceiveNumber) {
      receiveNumber = generateBatchId(autoIncrementId);
      checkReceiveNumber = await purchaseOrder.findOne({ where: { receiveNumber } });
    }    
    let getData = await purchaseOrder.findOne({ where: { id } });
    if (getData.orderStatus == ORDER_STATUS.COMPLETED) {
      return false;
    }
    if (!getData) {
      return false;
    }
    let totalRecQty = 0;
    const idsArray = [];

    for (const data of productItems) {
      const checkId = await purchaseOrderItem.findOne({ where: { id: data.id } });
      if (checkId) {
        idsArray.push(checkId.rawMaterialId);
        totalRecQty += +data.quantity;
        const checkInventory = await rawMaterial.findOne({ where: { id: checkId.rawMaterialId } });
        await rawMaterial.update({
          onHand: +data.quantity + (+checkInventory.onHand),
          available: +data.quantity + (+checkInventory.available),
          stockStatus: 'IN STOCK',
        }, { where: { id: checkId.rawMaterialId } });
        await purchaseOrderItem.update({ itemsReceived: data.quantity }, { where: { id: data.id } });
      }
    }
    const updateData = await purchaseOrder.update({
      itemsReceived: totalRecQty,
      receiveNumber:receiveNumber 
    }, { where: { id } });
    if (updateData) {
      await rawMaterial.update({ inventoryType: 1 }, { where: { id: idsArray } });
      await purchaseOrder.update({ orderStatus: ORDER_STATUS.COMPLETED }, { where: { id } });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log('error=>',error);
    return false;
  }
}
const orderDelete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id, status is required.' });
    }
    let where = { id };
    let getData = await purchaseOrder.findOne({ where });
    if (getData) {
      const deleteOrder = await purchaseOrder.destroy({ where: { id } });
      if (deleteOrder) {
        await purchaseOrderItem.destroy({ where: { purchaseOrderId: id } });
      }
      return res.success({ message: `Order Deleted` });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

function generateReceCode (autoIncrementId) {
  // Generate a random number between 0 and 999
  let number = Math.floor(Math.random() * 1000);

  // Convert the number to a string and pad with leading zeros if necessary
  let threeDigitString = number.toString().padStart(3, '0');

  // Add the prefix "OD"
  let resultString = threeDigitString + autoIncrementId;

  return resultString;
}
const receivingOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let autoIncrementId = 1;
    const getOrder = await purchaseOrder.findOne({
      attributes: ['receiveNumber'],
      order: [
        ['createdAt', 'DESC'],
      ]
    });

    if (getOrder) {
      if (getOrder.receiveNumber) {
        const lastTwoDigits = +getOrder.receiveNumber.toString().slice(-2) + 1;
        autoIncrementId += lastTwoDigits;
      } else {
        autoIncrementId += 1;
      }
    }
    let receiveNumber = generateReceCode(autoIncrementId);
    let checkReceiveNumber = await purchaseOrder.findOne({ where: { receiveNumber } });

    while (checkReceiveNumber) {
      receiveNumber = generateBatchId(autoIncrementId);
      checkReceiveNumber = await purchaseOrder.findOne({ where: { receiveNumber } });
    }
    const getData = await purchaseOrder.findOne({
      where: { id },
      attributes: ['orderStatus', 'receiveNumber'],
    });
    if (getData.receiveNumber) {
      let getData = await purchaseOrder.findOne({
        where: { id },
        attributes: ['id', 'receiveNumber', 'itemsReceived', 'orderNumber','receivePrefix', 'orderPrefix',],
        include: [
          {
            model: purchaseOrderItem,
            as: 'purchaseOrderItemData',
            attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
            include: [
              {
                model: rawMaterial,
                as: 'rawMaterialData',
                attributes: ['id', 'brandName', 'name', 'size', 'unitBarcode', 'sku','onHand','available'],
                include: [
                  {
                    model: rawMaterialProduct,
                    as: 'productDetails',
                    attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
                  },
                ]
              },
            ]
          },
        ]
      });
      if (getData) {
        return res.success({
          message: `Receiving Data`,
          data: { getData }
        });
      } else {
        return res.recordNotFound();
      }

    }
    if (getData.orderStatus == ORDER_STATUS.COMPLETED || getData.orderStatus == ORDER_STATUS.CANCELLED) {
      let message = 'Order is not updated because the order is completed.';
      if (getData.orderStatus == ORDER_STATUS.CANCELLED) {
        message = 'Order is not updated because the order is canceled.';
      }
      return res.failure({ message: message });
    }

    const updateData = await purchaseOrder.update({
      receiveNumber: receiveNumber,
      orderStatus: ORDER_STATUS.PENDING_RECEIVING
    }, { where: { id } });
    if (updateData) {
      let where = { id };
      let getData = await purchaseOrder.findOne({
        where,
        attributes: ['id', 'receiveNumber', 'receivePrefix', 'orderPrefix', 'itemsReceived', 'orderNumber'],
        include: [
          {
            model: purchaseOrderItem,
            as: 'purchaseOrderItemData',
            attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
            include: [
              {
                model: rawMaterial,
                as: 'rawMaterialData',
                attributes: ['id', 'brandName', 'name', 'size', 'unitBarcode', 'sku','onHand','available'],
                include: [
                  {
                    model: rawMaterialProduct,
                    as: 'productDetails',
                    attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
                  },
                ]
              },
            ]
          },
        ]
      });
      if (getData) {
        return res.success({
          message: `Receiving Data`,
          data: { getData }
        });
      } else {
        return res.recordNotFound();
      }
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const submitReceivingOrder = async (req, res) => {
  try {
    const {
      id, productItems
    } = req.body;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters!  productItems is required.' });
    }
    if (!productItems || productItems.length == 0) {
      return res.badRequest({ message: 'Insufficient request parameters! productItems is required.' });
    }
    let getData = await purchaseOrder.findOne({ where: { id } });
    if (getData.orderStatus == ORDER_STATUS.COMPLETED) {
      return res.failure({ message: 'Order is completed.' });
    }
    if (!getData) {
      return res.failure({ message: 'Invalid Order' });
    }
    let totalRecQty = 0;
    const idsArray = [];
    for (const data of productItems) {
      const checkId = await purchaseOrderItem.findOne({ where: { id: data.id } });
      if (checkId) {
        idsArray.push(checkId.rawMaterialId);
        if (+checkId.itemsReceived != +checkId.quantity) {
          totalRecQty += +data.quantity;
          const checkInventory = await rawMaterial.findOne({ where: { id: checkId.rawMaterialId } });
          await rawMaterial.update({
            onHand: +data.quantity + (+checkInventory.onHand),
            available: +data.quantity + (+checkInventory.available),
            stockStatus: 'IN STOCK',
          }, { where: { id: checkId.rawMaterialId } });
          await purchaseOrderItem.update({ itemsReceived: data.quantity }, { where: { id: data.id } });
        } else {
          totalRecQty += +checkId.quantity;
        }
      }
    }
    const updateData = await purchaseOrder.update({
      itemsReceived: totalRecQty,
      orderStatus: ORDER_STATUS.PARTIALLY_COMPLETED
    }, { where: { id } });
    if (updateData) {
      getData = await purchaseOrder.findOne({ where: { id } });
      if (+getData.totalQty === +getData.itemsReceived) {
        await rawMaterial.update({ inventoryType: 1 }, { where: { id: idsArray } });
        await purchaseOrder.update({ orderStatus: ORDER_STATUS.COMPLETED }, { where: { id } });
      }
    }
    return res.success({ message: `Order #${getData.orderNumber} Receiving Finalised` });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const cancelReceivingOrder = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id, status is required.' });
    }
    let getData = await purchaseOrder.findOne({ where: { id } });
    if (getData) {
      const updateData = await purchaseOrder.update({
        orderStatus: '2',
        receiveNumber: null,
        itemsReceived: 0
      }, { where: { id } });
      await purchaseOrderItem.update({ itemsReceived: 0 }, { where: { purchaseOrderId: id } });
      if (updateData) {
        return res.success({ message: `Order #${getData.receiveNumber} Receiving Cancelled` });
      }
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  createPurchaseOrder,
  purchaseOrderList,
  purchaseOrderDetails,
  manageOrderStatus,
  orderDelete,
  receivingOrderDetails,
  cancelReceivingOrder,
  submitReceivingOrder
};