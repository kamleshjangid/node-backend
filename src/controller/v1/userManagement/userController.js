const {
  role, adminUser, menu, admin
} = require('@model/index');
const dbService = require('@utils/dbService');
const { Op } = require('sequelize');
const {
  capitalize, toLowerCase, generateStrongPassword, cryptoFUN
} = require('@helpers/function');

const addUser = async (req, res) => {
  try {
    const adminId = req.headers['admin-id'] || null;
    const {
      firstName, lastName, roleId, email, mobileNumber, id, sideBarItem
    } = req.body;

    if (!firstName || !roleId || !email || !adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! firstName, roleId, email, adminId is required.' });
    }
    let menuItem = sideBarItem;
    if (!sideBarItem || sideBarItem.length == 0) {
      const getMenu = await menu.findOne({});
      if (!getMenu){
        return res.badRequest({ message: 'Please select permisssiion' });
      }
      menuItem = getMenu.menuKeys;
    }
    let where = { email:email.toLowerCase() };
    if (await admin.findOne({
      where:{
        email:email.toLowerCase(),
        adminId: null 
      } 
    })) {
      return res.failure({ message: 'Email already exists another account' });
    }
    where.adminId = adminId;
    
    if (id) where.id = { [Op.ne]: id };
    if (!await role.findOne({ where:{ id:roleId } })) {
      return res.failure({ message: 'Role not found..' });
    }
    if (await admin.findOne({ where })) {
      return res.failure({ message: 'Email already exists another account' });
    }
    
    const dataToCreate = {
      firstName,
      lastName,
      roleId,
      email,
      mobileNumber, 
      sideBarItem:menuItem,
      adminId
    };
    const messageType = id ? 'update' : 'insert';
    let token = '';

    if (id) {
      await dbService.update(admin, { id }, dataToCreate);
      token = id;
    } else {
      let password = generateStrongPassword(8);
      dataToCreate.password = cryptoFUN(password, 'encrypt');
      let getData = await dbService.createOne(admin, dataToCreate);
      if (getData) token = getData.id;
    }

    return res.success({
      message: `User ${id ? 'Updated' : 'Created'} Successfully`,
      data: { 
        messageType,
        token
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await admin.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted'] },
      include:[
        {
          model:role,
          as:'roleData',
          attributes:['id','name']
        }
      ]
    });
    // getData.password = cryptoFUN(getData.password, 'decrypt');
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const manageUserStatus = async (req, res) => {
  try {
    const {
      id, status
    } = req.body;
    if (!id || !status) {
      return res.badRequest({ message: 'Insufficient request parameters! id, status is required.' });
    }
    if (status == '0' || status == '1') {
      let where = { id };
      let getData = await admin.findOne({ where });
      if (getData) {
        await dbService.update(admin, { id }, { isActive: status });
        return res.success({ message: `${status == 0 ? 'Inactive' : 'Active'} successfully` });
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

const userList = async (req, res) => {
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
    query.adminId = adminId;
    if (!adminId){
      query.adminId = null;  
    }
    if (dataToFind.search) {
      query[Op.or] = {
        'firstName': { [Op.like]: '%' + dataToFind.search + '%' },
        'lastName': { [Op.like]: '%' + dataToFind.search + '%' },
        'mobileNumber': { [Op.like]: '%' + dataToFind.search + '%' },
        'email': { [Op.like]: '%' + dataToFind.search + '%' },
      };
    }

    let foundData;
    if (dataToFind && dataToFind.isCountOnly) {
      foundData = await dbService.count(admin, query);
      if (!foundData) {
        return res.recordNotFound();
      }
      foundData = { totalRecords: foundData };
      return res.success({ data: foundData });
    }
    if (dataToFind && dataToFind.querOptions !== undefined) {
      querOptions = dataToFind.querOptions;
    }
    querOptions.select = ['id', 'firstName', 'lastName', 'email', 'mobileNumber', 'isActive', 'createdAt'];
    querOptions.include = [{
      model:role,
      as:'roleData',
      attributes:['id','name']
    }];    
    if (options.sortBy && Object.keys(options.sortBy).length !== 0) querOptions.sort = { [options.sortBy.orderBy]: options.sortBy.order == 'asc' ? 1 : -1 };
    else querOptions.sort = { 'firstName': 1 };
    foundData = await dbService.paginate(admin, query, querOptions);
    return res.success({
      data: foundData,
      message: 'Admin user List'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const {
      newPassword, id
    } = req.body;
    if (!newPassword || !id) {
      return res.badRequest({ message: 'Insufficient request parameters! newPassword, id is required.' });
    }
    let userCheck = await dbService.findOne(admin, { id });
    if (!userCheck) {
      return res.failure({ message: 'User not found' });
    }
    // Hash the new password
    const hashedNewPassword = cryptoFUN(newPassword, 'encrypt');

    // Update the user's password in the database with the hashed new password
    let updatedUser = await dbService.update(admin, { id }, { password: hashedNewPassword });

    return res.success({ message: 'Password updated successfully.' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
const loginDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.badRequest({ message: 'Insufficient request parameters! id is required.' });
    }
    let where = { id };
    let getData = await admin.findOne({
      where,
      attributes: ['email', 'password'],
    });
    getData.password = cryptoFUN(getData.password, 'decrypt');
    if (getData) {
      return res.success({ data: getData });
    } else {
      return res.recordNotFound();
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
module.exports = {
  addUser,
  manageUserStatus,
  getUserDetails ,
  userList,
  changePassword,
  loginDetails
};