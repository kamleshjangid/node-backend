const jwt = require('jsonwebtoken');
const { user } = require('@model/index');

const authMiddleware = async (req, res, next) => { 
  const token = req.header('Authorization');  
  if (!token) 
    return res.unAuthorized({ message: 'Access denied. Token not provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await user.findByPk(decoded.id);
    if (!user) {
      return res.unAuthorized({ message: 'Invalid token. User not found.' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.unAuthorized({ message: 'Invalid token.' });
  }
}; 

// Middleware for authentication
const authenticate = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/');
  }
};
  
// Middleware for no-authentication (public routes)
const noAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next();
  } else {
    res.redirect('/dashboard');
  }
};

module.exports = {
  authenticate,
  noAuth
};
