/**
 * settingController.js
 * @description :: exports setting methods
 */
const authService = require('@services/auth');
const {
  week, orderWorkDay, admin
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const routeSchemaKey = require('@utils/validation/routeValidation');
const validation = require('@utils/validateRequest');

/**
 * @description : get week list 
 * @param {Object} req : request for week
 * @param {Object} res : response for week
 * @return {Object} : response for week { data}
 */
const getWeeks = async (req, res) => {
  const adminId = req.headers['admin-id'] || null;
  try {
    const getPakingNote = await admin.findOne({
      where:{ id: adminId },  
      attributes:['packingNote'] 
    });    
    let where = {
      isDeleted: false,
      isActive: true,
    };
    where.adminId = adminId;
    const getData = await week.findAll({
      where: where,
      attributes: ['id', 'name','type'],
      order: [
        ['displayOrder', 'ASC'],
      ],
    });
    return res.success({
      data: {
        getData,
        getPakingNote 
      },
      message: 'Week List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : Update records in the 'week' database table for specified week IDs
 * @param {Object} req : Request object
 * @param {Object} res : Response object
 * @return {Object} : Response indicating success or error
 */
const saveOrderWeek = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      weekId, packingNote 
    } = req.body;
    if (!weekId || weekId.length == 0){
      return res.badRequest({ message: 'Insufficient request parameters! weekId is required.' });
    }
    if (packingNote){
      await dbService.update(admin, { id: adminId }, { packingNote });
    }
    await dbService.update(week, { adminId }, { type: false });
    for (const id of weekId) {
      await dbService.update(week, {
        id,
        adminId 
      }, { type: true });
    }
    return res.success({ message: 'Week records updated successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const updateFootNotes = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const { packingNote } = req.body;
    await dbService.update(admin, { id: adminId }, { packingNote });
    return res.success({ message: 'Foot Notes updated successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getWeeks,
  saveOrderWeek,
  updateFootNotes
};