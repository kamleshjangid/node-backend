/**
 * loginController.js
 * @description :: exports action methods for login Functions.
 */

const formidable = require('formidable');
const { user } = require('@model/index');
const dbService = require('@utils/dbService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.loginUser = (req, res, next) => {
  try {
    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.internalServerError({ message: err.message });
      }
      let {
        email, password
      } = fields;
      try {
        let where = {
          email: email,
          userType: 101
        };
        const userInfo = await user.findOne({
          where,
          attributes: ['id', 'password']
        });
        if (userInfo) {
          bcrypt.compare(password, userInfo.password,
            async function (err, isMatch) {
              // Comparing the original password to encrypted password
              if (isMatch) {
                /* const token = jwt.sign({ id: userInfo.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION }); */
                req.session.user = userInfo.id;
                return res.success({ message: 'Redirecting....', });
              } else {
                return res.failure({ message: 'Incorrect email and password combination' });
              }
            });
        } else {
          return res.failure({ message: 'Incorrect email and password combination' });
        }
      } catch (error) {
        return res.internalServerError({ message: error.message });
      }
    });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
