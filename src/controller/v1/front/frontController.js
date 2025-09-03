/**
 * frontController.js
 * @description :: exports action methods for front Functions.
 */

const formidable = require('formidable');
const { user } = require('@model/index');
const dbService = require('@utils/dbService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.menuIndex = async (req, res) => {
  res.render('menu/index');
};
