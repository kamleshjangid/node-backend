const { notes } = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
  
const addNotes = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const requestParam = req.body; 
    const {
      id, heading, title, description, startDate, endDate, color
    } = requestParam;
  
    if (!heading || !title || !startDate || !endDate || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! heading, title, description, startDate, endDate adminId is required.' });
    }
    const dataToCreate = {
      heading,
      title,
      description,
      startDate,
      endDate,
      colorCode:color
    };  

    // let endDateTimeString = `${dataToCreate.endDate}T00:00:59`;
    // dataToCreate.endDate = new Date(endDateTimeString);
    const messageType = id ? 'update' : 'insert';
    let token = '';
  
    if (id) {
      await dbService.update(notes, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(notes, dataToCreate);
      if (getData) token = getData.id;
    }
  
    return res.success({
      message: `Notes ${id ? 'Updated' : 'Added'} Successfully`,
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
    let getData = await notes.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] }
    });
    if (getData) {
      // const obj = getData.toJSON();
      // let startDate = new Date(getData.startDate);
      // let endDate = new Date(getData.endDate);
      
      // obj.startDate = startDate.toISOString().split('T')[0];
      // obj.endDate = endDate.toISOString().split('T')[0];
            
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message:'notes not found' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
  
const deleteNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'ID is required.' });
    }

    let where = { id };
    let getData = await notes.findOne({ where });

    if (getData) {
      const currentDate = new Date();
      const endDate = new Date(getData.endDate);
      if (currentDate > endDate) {
        return res.failure({ message: 'Cannot delete past notes.' });
      }

      try {
        await notes.destroy({ where: where });
      } catch (error) {
        return res.failure({ message: 'Note could not be deleted.' });
      }

      return res.success({ message: 'Note deleted successfully.' });
    } else {
      return res.recordNotFound({ message: 'Invalid ID.' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const getNotesList = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const getData = await notes.findAll({
      where:{ adminId },
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] } ,
      order:[['startDate','ASC']]
    });
    return res.success({
      data: getData,
      message: 'Notes List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = { 
  addNotes,
  getDetails, 
  deleteNotes,
  getNotesList
};