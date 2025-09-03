/**
 * routeValidation.js
 * @description :: validate each post and put request as per route model
 */

const joi = require('joi');
const {
  options, isCountOnly, include, select 
} = require('./commonFilterValidation');

/** validation keys and properties of user */
exports.schemaKeys = joi.object({
  name: joi.string().trim().min(1).allow(null),
  description: joi.string().trim().min(1).allow(null),
}).min(1).unknown(true);

/** validation keys and properties of user for updation */
exports.updateSchemaKeys = joi.object({
  name: joi.string().allow(null).allow(''),
  description: joi.string().allow(null).allow(''),
  id: joi.number().integer()
}).unknown(true);

let keys = ['query', 'where'];
/** validation keys and properties of user for filter documents from collection */
exports.findFilterKeys = joi.object({
  options: options,
  ...Object.fromEntries(
    keys.map(key => [key, joi.object({
      name: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      description: joi.alternatives().try(joi.array().items(),joi.string(),joi.object()),
      id: joi.any()
    }).unknown(true),])
  ),
  isCountOnly: isCountOnly,
  include: joi.array().items(include),
  select: select
    
}).unknown(true);
