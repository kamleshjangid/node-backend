// middleware/setHeadersInContext.js
const cls = require('cls-hooked');
module.exports = (req, res, next) => {
  const namespace = cls.getNamespace('sequelize-namespace');
  if (namespace) {
    namespace.run(() => {
      namespace.set('headers', req.headers);
      next();
    });
  } else {
    // Handle the case when the namespace is not found
    console.error('Namespace not found');
    next();
  }    
};
