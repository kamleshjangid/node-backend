const {
  holiday, cart 
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
  
const addHoliday = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body; 
    const {
      id, title, startDate, endDate, color
    } = requestParam;
  
    if (!title || !startDate || !endDate || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! title, startDate, endDate, adminId is required.' });
    }
    const existingCartOrder = await cart.findOne({ 
      where: { 
        adminId,
        [Op.or]: [
          { deliveryDate: { [Op.between]: [startDate, endDate] } },
        ]
      }
    });
    
    if (existingCartOrder) {
      return res.failure({ message: 'An order already exists within this date range.' });
    }
    let where = {
      adminId,
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } }
      ]
    };
      
    if (id) where.id = { [Op.ne]: id };
      
    if (await holiday.findOne({ where })) {
      return res.failure({ message: 'A holiday already exists within the specified date range.' });
    }
    const dataToCreate = {
      title,
      startDate,
      endDate,
      colorCode:color,
    };  
    // let endDateTimeString = `${dataToCreate.endDate}T00:00:59`;
    // dataToCreate.endDate = new Date(endDateTimeString);

    const messageType = id ? 'update' : 'insert';
    let token = '';
  
    if (id) {
      await dbService.update(holiday, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(holiday, dataToCreate);
      if (getData) token = getData.id;
    }
  
    return res.success({
      message: `Holiday ${id ? 'Updated' : 'Added'} Successfully`,
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
    let getData = await holiday.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] }
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message:'holiday not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
  
const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await holiday.findOne({ where });
    if (getData) {
      const currentDate = new Date();
      const endDate = new Date(getData.endDate);
      if (currentDate > endDate) {
        return res.failure({ message: 'Cannot delete past holiday.' });
      }

      try {
        await holiday.destroy({ where: where }); 
      } catch (error) {
        return res.failure({ message: 'This holiday not delete' });
      }
      return res.success({ message: 'Holiday Deleted' });
    } else {
      return res.recordNotFound({ message: 'Invalid Id' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getHolidayList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await holiday.findAll({
      where:{ adminId },
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] } ,
      order:[['startDate','ASC']]
    });
    return res.success({
      data: getData,
      message: 'Holiday List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = { 
  addHoliday,
  getDetails, 
  deleteHoliday,
  getHolidayList
};