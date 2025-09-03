/**
 * CustomerValidation.js
 * @description :: validate each post and put request as per Customer model
 */

const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('./commonFilterValidation');

/** validation keys and properties of Customer */
exports.schemaKeys = joi.object({
  firstName: joi.string().allow(null).allow(''),
  lastName: joi.string().allow(null).allow(''),
  profile: joi.string().allow(null).allow(''),
  contactNumber: joi.string().allow(null).allow(''),
  email: joi.string().allow(null).allow(''),
  isActive: joi.boolean(),
  isDeleted: joi.boolean()
}).unknown(true);

/** validation keys and properties of Customer for updation */
exports.updateSchemaKeys = joi.object({
  firstName: joi.string().allow(null).allow(''),
  lastName: joi.string().allow(null).allow(''),
  profile: joi.string().allow(null).allow(''),
  contactNumber: joi.string().allow(null).allow(''),
  email: joi.string().allow(null).allow(''),
  isActive: joi.boolean(),
  isDeleted: joi.boolean(),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
/** validation keys and properties of Customer for filter documents from collection */
exports.findFilterKeys = joi.object({
  options: options,
  ...Object.fromEntries(
    keys.map(key => [key, joi.object({
      firstName: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      lastName: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      profile: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      contactNumber: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      email: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      isActive: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
      isDeleted: joi.alternatives().try(joi.array().items(),joi.boolean(),joi.object()),
      id: joi.any()
    }).unknown(true),])
  ),
  isCountOnly: isCountOnly,
  include: joi.array().items(include),
  select: select
    
}).unknown(true);
