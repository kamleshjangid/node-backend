const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const postmanToOpenApi = require('postman-to-openapi');
const setHeadersInContext = require('@middleware/setHeadersInContext');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
dotenv.config({ path: '.env' });
global.__basedir = __dirname;
const listEndpoints = require('express-list-endpoints');
const passport = require('passport');
require('@utils/dbService');
const models = require('@model/index');
const seeder = require('@seeders');
const dbService = require('@utils/dbService');
const session = require('express-session');
const morgan = require('morgan');
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs');
const {
  authenticate, noAuth
} = require('@middleware/authMiddleware');

// All routes
const routes = require('@routes');
// let logger = require('morgan');

const { devicePassportStrategy } = require('@config/devicePassportStrategy');
const { adminPassportStrategy } = require('@config/adminPassportStrategy');

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());
// Middleware to set headers in CLS context
app.use(setHeadersInContext);
app.use(require('@utils/response/responseHandler'));

const corsOptions = { origin: process.env.ALLOW_ORIGIN };
app.use(cors(corsOptions));

// Use ExpressWinston for logging in Express middleware
/*
 * app.use(
 * expressWinston.logger({
 *  transports: [new winston.transports.Console()],
 *  format: winston.format.combine(
 *    winston.format.timestamp(),
 *    winston.format.json()
 *  ),
 * })
 * );
 */// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

devicePassportStrategy(passport);
adminPassportStrategy(passport);

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/excel', express.static(path.join(__dirname, 'excel')));

async function generateOpenApi () {
  try {
    let openApiSpec;
    let source;

    // Check if postman-collection.json file exists
    const filePath = 'src/postman/postman-collection.json';

    let fileExists = true;
    try {
      await fs.promises.readFile(filePath, 'utf8'); // Attempt to read the file
    } catch (error) {
      if (error.code === 'ENOENT') { // Check if the error is due to file not found
        fileExists = false;
      } else {
        throw error; // Rethrow any other errors
      }
    }

    if (fileExists) {
      // Read the JSON file
      source = 'file';
      const collectionData = await fs.promises.readFile(filePath, 'utf8');
      // Generate OpenAPI spec from file
      openApiSpec = await postmanToOpenApi(collectionData, path.join('src/postman/swagger.yml'), { defaultTag: 'General' });
      // Parse the OpenAPI spec
      const swaggerObject = YAML.parse(openApiSpec);
      // Modify the swaggerObject if needed
      swaggerObject.servers[0].url = '/';
      // Save the OpenAPI specification into the database
      await models.collection.destroy({
        where: {},
        truncate: true
      });
      const createdCollection = await models.collection.create({
        name: swaggerObject.info.title,
        openapiSpec: openApiSpec
      });

      console.log('OpenAPI specification saved to database successfully.');

      return swaggerObject;
    } else {
      // Fetch the collection data from the database
      const collection = await models.collection.findOne({});
      if (!collection) {
        throw new Error('Collection not found in the database.');
      }

      // Use the collection data to generate OpenAPI spec
      openApiSpec = collection.openapiSpec;

      // Parse the OpenAPI spec
      const swaggerObject = YAML.parse(openApiSpec);

      // Modify the swaggerObject if needed
      swaggerObject.servers[0].url = '/';

      console.log('OpenAPI specification generated from database.');

      return swaggerObject;
    }
  } catch (error) {
    console.error('Error generating OpenAPI specification:', error);
    throw error;
  }
}

// Configure session middleware
app.use(session({
  secret: '749c3567-aca7-4c1f-b411-68fc3a3de165',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
if (process.env.NODE_ENV !== 'test') {
  models.sequelize.sync({ alter: true }).then(() => {
  }).finally(() => {
    const allRegisterRoutes = listEndpoints(app);
    dbService.findOne(models.user).then(res => {
      if (!res) {
        seeder(allRegisterRoutes).then(() => { console.log('Seeding done.'); });
      }
    }).catch(e => {
      console.log('User not found, some error occurred');
    });

    /*
     * Swagger Documentation
     * Usage
     */
    generateOpenApi()
      .then(swaggerObject => {
        // Use the modified OpenAPI specification with swagger-ui
        app.use('/swagger', authenticate, swaggerUi.serve, swaggerUi.setup(swaggerObject));
      })
      .catch(error => {
        // Handle errors
        console.error('Error:', error);
      });
  });
  app.use(routes);

  app.listen(process.env.PORT, () => {
    console.log(`Your application is running on ${process.env.PORT}`);
  });
} else {  
  module.exports = app;
}
