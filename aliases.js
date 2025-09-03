const path = require('path');
const moduleAlias = require('module-alias');
moduleAlias.addAliases({
  '@src': path.resolve(__dirname, 'src'),
  '@helpers': path.resolve(__dirname, 'src/helpers'),
  '@excel': path.resolve(__dirname, 'src/excel'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@config': path.resolve(__dirname, 'src/config'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@controller': path.resolve(__dirname, 'src/controller'),
  '@middleware': path.resolve(__dirname, 'src/middleware'),
  '@model': path.resolve(__dirname, 'src/model'),
  // '@postman': path.resolve(__dirname, 'src/postman'),
  '@routes': path.resolve(__dirname, 'src/routes'),
  '@seeders': path.resolve(__dirname, 'src/seeders'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@data': path.resolve(__dirname, 'src/data'),
  '@public': path.resolve(__dirname, 'src/public'),
});

require('./src/app.js');
