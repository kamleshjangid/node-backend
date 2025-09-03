/**
 * authController.js
 * @description :: exports authentication methods
 */
const authService = require('@services/auth');
const {
  user, role, userRole, userAuthSettings, userTokens, pushNotification
} = require('@model/index');
const dbService = require('@utils/dbService');
const dayjs = require('dayjs');
const userSchemaKey = require('@utils/validation/superAdminValidation');
const validation = require('@utils/validateRequest');
const authConstant = require('@constants/authConstant');
const { checkUniqueFieldsInDatabase } = require('@utils/common');
const bcrypt = require('bcryptjs');

const uuid = require('uuid').v4;

/**
 * @description : user registration 
 * @param {Object} req : request for register
 * @param {Object} res : response for register
 * @return {Object} : response for register {status, message, data}
 */
const register = async (req, res) => {
  try {
    let dataToRegister = req.body;
    let validateRequest = validation.validateParamsWithJoi(
      dataToRegister,
      userSchemaKey.schemaKeys
    );
    if (!validateRequest.isValid) {
      return res.validationError({ message: `Invalid values in parameters, ${validateRequest.message}` });
    }
    let isEmptyPassword = false;
    if (!dataToRegister.password) {
      isEmptyPassword = true;
      dataToRegister.password = Math.random().toString(36).slice(2);
    }

    let checkUniqueFields = await checkUniqueFieldsInDatabase(user, ['email'], dataToRegister, 'REGISTER');
    if (checkUniqueFields.isDuplicate) {
      return res.validationError({ message: `${checkUniqueFields.value} already exists.Unique ${checkUniqueFields.field} are allowed.` });
    }

    const result = await dbService.createOne(user, {
      ...dataToRegister,
      userType: authConstant.USER_TYPES.Admin
    });

    /*
     *     if (isEmptyPassword && req.body.email){
     *     await sendPasswordByEmail({
     *      email: req.body.email,
     *      password: req.body.password
     *     });
     *     }
     */
    return res.success({ data: result });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

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
    let result = await authService.loginUser(dataToRegister.username, dataToRegister.password, authConstant.PLATFORM.SUPER_ADMIN, roleAccess);
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
    where.isActive = true; where.isDeleted = false; let found = await dbService.findOne(user, where);
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
  const params = req.body;
  try {
    if (!params.token || !params.email || !params.username) {
      return res.badRequest({ message: 'Insufficient request parameters! token, email, password is required.' });
    }
    let userAuth = await dbService.findOne(userTokens, { token: params.token });
    if (!userAuth) {
      return res.failure({ message: 'Invalid token' });
    }
    await dbService.update(user, { id: userAuth.userId }, {
      email: params.email,
      username: params.username
    });
    return res.success({ message: 'Profile Updated Successfully' });
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
    const { token } = req.body;
    if (!token) {
      return res.badRequest({ message: 'Insufficient request parameters! token is required.' });
    }
    let userAuth = await dbService.findOne(userTokens, { token: token });
    if (!userAuth) {
      return res.failure({ message: 'Invalid token' });
    }

    let where = { id: userAuth.userId };
    let getData = await user.findOne({
      where,
      attributes: ['email', 'username'],
    });
    if (getData) {
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
    const token = (req.headers.authorization).replace('Bearer ', '');
    if (!token || !oldPassword || !newPassword) {
      return res.badRequest({ message: 'Insufficient request parameters! oldPassword, newPassword, token is required.' });
    }

    // Retrieve user authentication record from the database using the token
    let userAuth = await dbService.findOne(userTokens, { token: token });
    if (!userAuth) {
      return res.failure({ message: 'Invalid token' });
    }

    // Retrieve user record from the database using userAuth.userId
    let userCheck = await dbService.findOne(user, { id: userAuth.userId });
    if (!userCheck) {
      return res.failure({ message: 'User not found' });
    }

    // Compare oldPassword with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(oldPassword, userCheck.password);
    if (!passwordMatch) {
      return res.failure({ message: 'Old password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 8);

    // Update the user's password in the database with the hashed new password
    let updatedUser = await dbService.update(user, { id: userAuth.userId }, { password: hashedNewPassword });

    return res.success({ message: 'Password updated successfully.' });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};

module.exports = {
  getUserDetails,
  updateProfile,
  register,
  login,
  forgotPassword,
  validateResetPassword,
  resetPassword,
  logout,
  changePassword
};
