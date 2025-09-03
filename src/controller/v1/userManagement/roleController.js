const { role } = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');

const addRole = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      name, id
    } = req.body;

    if (!name) {
      return res.badRequest({ message: 'Insufficient request parameters! name  is required.' });
    }
    let where = { name };
    where.adminId = adminId;
    if (id) where.id = { [Op.ne]: id };

    if (await role.findOne({ where })) {
      return res.failure({ message: 'Name already exists' });
    }
    const dataToCreate = { name };
    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(role, { id }, dataToCreate);
    } else {
      let getData = await dbService.createOne(role, dataToCreate);
      if (getData) token = getData.id;
    }

    return res.success({
      message: `Role ${id ? 'Updated' : 'Added'} Successfully`,
      data: { 
        messageType,
        token
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getRoleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await role.findOne({
      where,
      attributes: ['id', 'name', 'isActive', 'isDeleted', 'createdAt']
    });
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message:'Role not found' });
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
      let getData = await role.findOne({ where });
      if (getData) {
        await dbService.update(role, { id }, { isActive: status });
        return res.success({ message: `${status == 0 ? 'Inactive' : 'Active'} successfully` });
      } else {
        return res.recordNotFound({ message: 'Role not found' });
      }

    } else {
      return res.failure({ message: 'Invalid status' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const roleList = async (req, res) => {
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
      query[Op.or] = { 'name': { [Op.like]: '%' + dataToFind.search + '%' }, };
    }
    query.adminId = adminId;
    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(role, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'name', 'isActive', 'createdAt'];
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    else querOptions.sort = { 'name': 1 };

    foundData = await dbService.paginate(role, query, querOptions);
    return res.success({
      data: foundData,
      message: 'role List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = { 
  addRole,
  getRoleDetails, 
  manageStatus,
  roleList
};