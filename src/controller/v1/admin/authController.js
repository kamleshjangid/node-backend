/**
 * authController.js
 * @description :: exports authentication methods
 */
const authService = require('@services/adminAuth');
const {
  user, role, userRole, userAuthSettings, userTokens, pushNotification, admin, countries, state, menu
} = require('@model/index');
const dbService = require('@utils/dbService');
const dayjs = require('dayjs');
const userSchemaKey = require('@utils/validation/superAdminValidation');
const validation = require('@utils/validateRequest');
const authConstant = require('@constants/authConstant');
const { checkUniqueFieldsInDatabase } = require('@utils/common');
const bcrypt = require('bcryptjs');
const {
  capitalize, toLowerCase, generateStrongPassword, cryptoFUN
} = require('@helpers/function');
const { Op } = require('sequelize');

const uuid = require('uuid').v4;

/**
 * @description : login with username and password
 * @param {Object} req : request for login 
 * @param {Object} res : response for login
 * @return {Object} : response for login {status, message, data}
 */
const login = async (req, res) => {
  try {
    let dataToRegister = req.body;
    let validateRequest = validation.validateParamsWithJoi(
      dataToRegister,
      userSchemaKey.schemaKeys
    );
    if (!validateRequest.isValid) {
      return res.validationError({ message: `Invalid values in parameters, ${validateRequest.message}` });
    }
    let roleAccess = false;
    if (req.body.includeRoleAccess) {
      roleAccess = req.body.includeRoleAccess;
    }
    let result = await authService.loginUser(dataToRegister.username, dataToRegister.password, authConstant.PLATFORM.ADMIN, roleAccess);
    if (result.flag) {
      return res.badRequest({ message: result.data });
    }
    return res.success({
      data: result.data,
      message: 'Login successful.'
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : send email or sms to user with OTP on forgot password
 * @param {Object} req : request for forgotPassword
 * @param {Object} res : response for forgotPassword
 * @return {Object} : response for forgotPassword {status, message, data}
 */
const forgotPassword = async (req, res) => {
  const params = req.body;
  try {
    if (!params.email) {
      return res.badRequest({ message: 'Insufficient request parameters! email is required' });
    }
    let where = { email: params.email.toString().toLowerCase() };
    where.isActive = true; where.isDeleted = false; let found = await dbService.findOne(admin, where);
    if (!found) {
      return res.recordNotFound({ message: 'Email Not Found' });
    }
    if (found.isActive == 0) {
      return res.failure({ message: 'You are blocked by Admin, Please contact to Admin.' });
    }
    let token = uuid();
    let expires = dayjs();
    expires = expires.add(authConstant.FORGOT_PASSWORD_WITH.EXPIRE_TIME, 'minute').toISOString();
    let updateData = {
      'recoveryCode': token,
      'linkExpiryTime': expires,
      'linkStatus': 0
    };
    await dbService.update(userAuthSettings, { userId: found.id }, updateData);
    return res.success({
      message: ' Please check your inbox. we have sent you the password reset steps.',
      data: { token }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : validate OTP
 * @param {Object} req : request for validateResetPasswordOtp
 * @param {Object} res : response for validateResetPasswordOtp
 * @return {Object} : response for validateResetPasswordOtp  {status, message, data}
 */
const validateResetPassword = async (req, res) => {
  const params = req.body;
  try {
    if (!params.token) {
      return res.badRequest({ message: 'Insufficient request parameters! token is required.' });
    }
    let found = await dbService.findOne(userAuthSettings, { recoveryCode: params.token });
    if (!found) {
      return res.failure({ message: 'Invalid Link' });
    }
    if (found.linkExpiryTime) {
      if (dayjs(new Date()).isAfter(dayjs(found.linkExpiryTime))) {// link expire        
        return res.failure({ message: 'Your reset password link is expired or invalid' });
      }
    }
    return res.success({ message: 'Valid Link' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : reset password with code and new password
 * @param {Object} req : request for resetPassword
 * @param {Object} res : response for resetPassword
 * @return {Object} : response for resetPassword {status, message, data}
 */
const resetPassword = async (req, res) => {
  const params = req.body;
  try {
    if (!params.token || !params.newPassword) {
      return res.badRequest({ message: 'Insufficient request parameters! token and newPassword is required.' });
    }
    let userAuth = await dbService.findOne(userAuthSettings, { recoveryCode: params.token });
    if (!userAuth) {
      return res.failure({ message: 'Invalid token' });
    }
    if (dayjs(new Date()).isAfter(dayjs(userAuth.linkExpiryTime))) {  /* link expire */
      return res.failure({ message: 'Your reset password link is expired or invalid' });
    }
    let response = await authService.resetPassword(userAuth.userId, params.newPassword);
    if (response.flag) {
      return res.failure({ message: response.data });
    }
    return res.success({ message: response.data });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : reset password with code and new password
 * @param {Object} req : request for resetPassword
 * @param {Object} res : response for resetPassword
 * @return {Object} : response for resetPassword {status, message, data}
 */
const updateProfile = async (req, res) => {
  const requestParam = req.body;
  try {
    const adminId = req.headers['admin-id'] || null;
    if (!adminId) {
      return res.badRequest({ message: 'Insufficient request parameters! token is required.' });
    }
    if (!requestParam.companyName || !requestParam.address1 || !requestParam.cityName || !requestParam.postcode || !requestParam.email) {
      return res.badRequest({ message: 'Insufficient request parameters! token, companyName, address1, cityName, postcode, email is required.' });
    }

    /*
     *     let userAuth = await dbService.findOne(userTokens, { token: requestParam.token });
     *     if (!userAuth) {
     *     return res.failure({ message: 'Invalid token' });
     *     }
     */
    let where = { email: toLowerCase(requestParam.email) };

    if (adminId) where.id = { [Op.ne]: requestParam.id };

    if (await admin.findOne({ where })) {
      return res.failure({ message: 'Email already exists' });
    }
    const dataToCreate = { ...requestParam };
    dataToCreate.email = toLowerCase(requestParam.email);
    dataToCreate.companyName = capitalize(requestParam.companyName);
    /*
     *     let password = generateStrongPassword(8);
     *     dataToCreate.password = cryptoFUN(password, 'encrypt');
     */
    const messageType = requestParam.id ? 'update' : 'insert';
    let token = '';
    if (adminId) {
      await dbService.update(admin, { id: adminId }, dataToCreate);
      token = requestParam.id;
    } else {
      return res.failure({ message: 'Invalid Id' });
    }
    return res.success({ message: 'Profile Updated Successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

const updateSetting = async (req, res) => {
  const requestParam = req.body;
  try {
    if (!requestParam.token) {
      return res.badRequest({ message: 'Insufficient request parameters! token, email, password is required.' });
    }
    if (!requestParam.mode || !requestParam.layout || !requestParam.contrast || !requestParam.presets) {
      return res.badRequest({ message: 'Insufficient request parameters! mode, layout, contrast, presets is required.' });
    }

    let userAuth = await dbService.findOne(userTokens, { token: requestParam.token });
    if (!userAuth) {
      return res.failure({ message: 'Invalid token' });
    }

    const dataToCreate = { ...requestParam };
    if (userAuth.userId) {
      await dbService.update(admin, { id: userAuth.userId }, dataToCreate);
      const getUserData = await admin.findOne({
        where: { id: userAuth.userId },
        attributes: ['mode', 'layout', 'contrast', 'presets']
      });
      return res.success({
        message: 'Setting Updated Successfully',
        data: getUserData
      });
    }
    return res.failure({ message: 'Invalid Id' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
/**
 * @description : logout user
 * @param {Object} req : request for logout
 * @param {Object} res : response for logout
 * @return {Object} : response for logout {status, message, data}
 */
const logout = async (req, res) => {
  try {
    let userToken = await dbService.findOne(userTokens, {
      token: (req.headers.authorization).replace('Bearer ', ''),
      userId: req.user.id
    });
    userToken.isTokenExpired = true;
    let id = userToken.id;
    delete userToken.id;
    await dbService.update(userTokens, { id: id }, userToken.toJSON());
    return res.success({ message: 'Logged Out Successfully' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description : view login user data
 * @param {Object} req : request for login user
 * @param {Object} res : response for login user
 * @return {Object} : response for login user {status, message, data}
 */
const getUserDetails = async (req, res) => {
  try {
    
    const { menuName } = req.body;
    const token = (req.headers.authorization).replace('Bearer ', '') || null;
    if (!token) {
      return res.badRequest({ message: 'Insufficient request parameters! token is required.' });
    }
    let userAuth = await dbService.findOne(userTokens, { token: token });
    if (!userAuth) {
      return res.failure({ message: 'Invalid token' });
    }
    let where = { id: userAuth.userId };
    let getData = await admin.findOne({
      where,
      attributes: { exclude: ['addedBy', 'updatedBy', 'updatedAt', 'isDeleted', 'password','userRole'] },
      include: [{
        model: countries,
        as: 'countryData',
        attributes: ['id', 'countryName']
      }, {
        model: state,
        as: 'stateData',
        attributes: ['id', 'stateName']
      }, {
        model: countries,
        as: 'tradingCountryData',
        attributes: ['id', 'countryName']
      }, {
        model: state,
        as: 'tradingStateData',
        attributes: ['id', 'stateName']
      }]
    });
    if (getData) {
      if (menuName && menuName.length > 0) {
        await dbService.update(menu, {}, { menuKeys: menuName[0].items });
      }
      return res.success({ data: getData });
    } else {
      return res.recordNotFound({ message: 'User Not Foundd' });
    }
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

/**
 * @description View login user data
 * @param {Object} req Request for login user
 * @param {Object} res Response for login user
 * @return {Object} Response for login user {status, message, data}
 */
const changePassword = async (req, res) => {
  try {
    const {
      oldPassword, newPassword
    } = req.body;
    if (!oldPassword || !newPassword) {
      return res.badRequest({ message: 'Insufficient request parameters! oldPassword, newPassword, token is required.' });
    }
    const adminId = req.headers['admin-id'] || null;
    // Retrieve user record from the database using userAuth.userId
    let userCheck = await dbService.findOne(admin, { id: adminId });
    if (!userCheck) {
      return res.failure({ message: 'User not found' });
    }

    if (oldPassword) {
      let isPasswordMatched = cryptoFUN(userCheck.password, 'decrypt');
      if (isPasswordMatched != oldPassword) {
        return res.failure({ message: 'Old password is incorrect' });
      }
    }

    // Hash the new password
    const hashedNewPassword = cryptoFUN(newPassword, 'encrypt');

    // Update the user's password in the database with the hashed new password
    let updatedUser = await dbService.update(admin, { id: adminId }, { password: hashedNewPassword });

    return res.success({ message: 'Password updated successfully.' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getUserDetails,
  updateProfile,
  login,
  forgotPassword,
  validateResetPassword,
  resetPassword,
  logout,
  changePassword,
  updateSetting
};
