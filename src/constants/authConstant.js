/**
 * authConstant.js
 * @description :: constants used in authentication
 */

const CODE_VERSION = {
  currentVersion: '1.0.27', 
};
const DELIVERY_TYPE = {
  delivery_price: 'Delivery Price', 
  delivery_price_rule: 'Delivery Price Rule', 
  free_delivery: 'Free delivery', 
};
const JWT = {
  DEVICE_SECRET: 'myjwtdevicesecret', 
  ADMIN_SECRET: 'myjwtadminsecret',
  EXPIRES_IN: 1200
};
const SIZE_TYPE = ['Grams','Kilograms','Liters'];

const USER_TYPES = {
  superAdmin: 1,
  Admin: 2 
};

const PLATFORM = {
  SUPER_ADMIN: 1,
  ADMIN: 2 
};
const ORDER_STATUS = {
  DRAFT: '0',
  ORDER_PLACED: '1',
  QUEUED: '2',
  MODIFYING: '3',
  HOLD_ORDER: '4',
  EMAIL_DELIVERED: '5',
  RECEIVING: '6',
  PENDING_RECEIVING: '7',
  COMPLETED: '8',
  CANCELLED: '9',
  REMOVE: '10',
  PARTIALLY_COMPLETED: '11',
  SHIPPED: '12',
  UNHOLD_ORDER: '13',
};

let LOGIN_ACCESS = {
  [USER_TYPES.superAdmin]: [PLATFORM.SUPER_ADMIN],
  [USER_TYPES.Admin]: [PLATFORM.ADMIN] 
};
const PAYMENT_TERMS = ['COD', 'Prepaid', '7 day','14 day', '21 day', '30 day'];

const MAX_LOGIN_RETRY_LIMIT = 20;
const LOGIN_REACTIVE_TIME = 2;

const FORGOT_PASSWORD_WITH = {
  LINK: {
    email: true,
    sms: false
  },
  EXPIRE_TIME: 5
};

module.exports = {
  JWT,
  USER_TYPES,
  PLATFORM,
  MAX_LOGIN_RETRY_LIMIT,
  LOGIN_REACTIVE_TIME,
  FORGOT_PASSWORD_WITH,
  LOGIN_ACCESS,
  SIZE_TYPE,
  CODE_VERSION,
  DELIVERY_TYPE,
  ORDER_STATUS,
  PAYMENT_TERMS
};