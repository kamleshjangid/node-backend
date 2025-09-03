const {
  customer,
  item,
  customerItem,
  itemGroup
} = require('@model/index');
const dbService = require('@utils/dbService');
const {
  Op, Sequelize 
} = require('sequelize');
const {
  capitalize, toLowerCase
} = require('@helpers/function');

const addCustomerItem = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body;

    if (!requestParam.itemId || !requestParam.customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId, itemId is required.' });
    }
    let where = {
      itemId: requestParam.itemId,
      customerId:requestParam.customerId ,
      adminId
    };

    if (!await customer.findOne({
      where:{
        id:requestParam.customerId,
        adminId 
      } 
    })) {
      return res.failure({ message: 'Invalid customer Id' });
    }
    const checkItem = await item.findOne({
      where:{
        id:requestParam.itemId,
        adminId 
      },
      attributes:['itemGroupId']
    });
    if (!checkItem) {
      return res.failure({ message: 'Invalid item Id' });
    }
    if (await customerItem.findOne({ where })) {
      return res.failure({ message: 'item already exists for this customer' });
    }
    const dataToCreate = {
      itemId:requestParam.itemId,
      customerId:requestParam.customerId,
      itemGroupId:checkItem.itemGroupId,
    };
    await dbService.createOne(customerItem, dataToCreate);
    return res.success({ message: `Customer Item  Added Successfully`, });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const manageStatus = async (req, res) => {
  try {
    const {
      customerId, itemGroupId, itemId, status
    } = req.body;
    if (!customerId || !status) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId, itemGroupId, itemId, status is required.' });
    }
    if (status == '0' || status == '1') {
      let where = { customerId };
      if (itemId) where.itemId = itemId;
      let getData = await customerItem.findOne({ where });
      if (getData) {
        if (!itemId && !itemGroupId){
          return res.badRequest({ message: 'Please select one item or item group' });
        }    
        if (itemGroupId){
          delete where.itemId;
          where.itemGroupId = itemGroupId;
        }
        await dbService.update(customerItem, where, { isActive: status });
        return res.success({ message: `${status == 0 ? 'Inactive' : 'Active'} successfully` });
      } else {
        return res.recordNotFound({ message:'Customer item not found..' });
      }
    } else {
      return res.failure({ message: 'Invalid status' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getCustomerItem = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId is required.' });
    }
    const customerData = await customer.findOne({
      where: {
        id: customerId,
        adminId 
      },
      attributes:[['tradingName','legalName']] 
    });

    let getData = await itemGroup.findAll({
      include: [
        {
          model: item,
          as: 'itemData',
          attributes:['id','itemGroupId','name','wholeSalePrice','retailPrice','legacyCode','maxOrder','weight','gstPercentage'],
          include: [
            {
              required: true,
              where:{
                customerId,
                adminId 
              },
              model: customerItem,
              as: 'customerItemData',
              attributes: ['isActive'],
            }
          ],
        }
      ],
      attributes: [
        'id',
        ['name', 'itemGroupName'],
      ],
      group: ['itemgroup.id', 'itemData.id','itemData->customerItemData.id'],
      where: {
        id: { [Op.col]: 'itemData.customerItemData.itemGroupId', },
        adminId
      }

    });

    return res.success({
      data: {
        customerName: customerData?.legalName,
        getData
      },
      message: 'Customer Item Data'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getItemList  = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { customerId } = req.body;
    if (!customerId) {
      return res.badRequest({ message: 'Insufficient request parameters! customerId is required.' });
    }

    const getData = await item.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          required: false,
          where:{
            customerId,
            adminId 
          },
          model: customerItem,
          as: 'customerItemData',
          attributes: [],
        }
      ],
      where: {
        isDeleted: false,
        adminId,
        [Op.or]: [
          { '$customerItemData.itemId$': { [Op.ne]: Sequelize.col('items.id') } },
          { '$customerItemData.itemId$': { [Op.eq]: null } }
        ]

      },
      order: [
        ['name', 'ASC'],
      ],
    });
    return res.success({
      data: getData,
      message: 'Item List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  addCustomerItem,
  manageStatus,
  getCustomerItem,
  getItemList
};