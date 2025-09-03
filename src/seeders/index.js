/**
 * seeder.js
 * @description :: functions that seeds mock data to run the application
 */
const model = require('@model');
const dbService = require('@utils/dbService');
const bcrypt = require('bcrypt');
const authConstant = require('@constants/authConstant');
const { replaceAll } = require('@utils/common');
const {
  week, menu, countryJson, stateJson, routeJson
} = require('@data/index');

/* seeds default users */
async function seedUser () {
  try {
    let userToBeInserted = {};
    userToBeInserted = await dbService.findOne(model.user, { 'username': 'Super Admin' });
    if (!userToBeInserted) {
      userToBeInserted = {
        'password': '3qtK7K354TcF',
        'isDeleted': false,
        'username': 'Admin',
        'email': 'admin@gfprecinct.com.au',
        'isActive': true,
        'userType': authConstant.USER_TYPES.superAdmin
      };
      await dbService.createOne(model.user, userToBeInserted);
    } else {
      userToBeInserted = {
        'password': '3qtK7K354TcF',
        'isDeleted': false,
        'username': 'Admin',
        'email': 'admin@gfprecinct.com.au',
        'isActive': true,
        'userType': authConstant.USER_TYPES.superAdmin
      };
      userToBeInserted.password = await bcrypt.hash(userToBeInserted.password, 8);
      await dbService.update(model.user, { 'username': 'Super Admin' }, userToBeInserted);
    }
    userToBeInserted = await dbService.findOne(model.user, { 'username': 'developer' });
    if (!userToBeInserted) {
      userToBeInserted = {
        'password': 'Dev@1234',
        'isDeleted': false,
        'username': 'developer',
        'email': 'dev@gmail.com',
        'isActive': true,
        'userType': 101
      };
      await dbService.createOne(model.user, userToBeInserted);
    } else {
      userToBeInserted = {
        'password': 'Dev@1234',
        'isDeleted': false,
        'username': 'developer',
        'email': 'dev@gmail.com',
        'isActive': true,
        'userType': 101
      };
      userToBeInserted.password = await bcrypt.hash(userToBeInserted.password, 8);
      await dbService.update(model.user, { 'username': 'developer' }, userToBeInserted);
    }
    console.info('User model seeded 🍺');
  } catch (error) {
    console.log('User seeder failed due to ', error.message);
  }
}

/* seeds roles */
async function seedRole () {
  try {
    const roles = ['Admin', 'User', 'System_User'];
    const insertedRoles = await dbService.findAll(model.role, { code: { $in: roles.map(role => role.toUpperCase()) } });
    const rolesToInsert = [];
    roles.forEach(role => {
      if (!insertedRoles.find(insertedRole => insertedRole.code === role.toUpperCase())) {
        rolesToInsert.push({
          name: role,
          code: role.toUpperCase(),
          weight: 1
        });
      }
    });
    if (rolesToInsert.length) {
      const result = await dbService.createMany(model.role, rolesToInsert);
      if (result) console.log('Role seeded 🍺');
      else console.log('Role seeder failed!');
    } else {
      console.log('Role is upto date 🍺');
    }
  } catch (error) {
    console.log('Role seeder failed due to ', error.message);
  }
}

/* seeds routes of project */
async function seedProjectRoutes (routes) {
  try {
    if (routes) {
      let routeName = '';
      const dbRoutes = await dbService.findAll(model.projectRoute, {});
      let routeArr = [];
      let routeObj = {};
      routes.forEach(route => {
        routeName = `${replaceAll((route.path).toLowerCase(), '/', '_')}`;
        route.methods.forEach(method => {
          routeObj = dbRoutes.find(dbRoute => dbRoute.route_name === routeName && dbRoute.method === method);
          if (!routeObj) {
            routeArr.push({
              'uri': route.path.toLowerCase(),
              'method': method,
              'route_name': routeName,
            });
          }
        });
      });
      if (routeArr.length) {
        const result = await dbService.createMany(model.projectRoute, routeArr);
        if (result) console.info('ProjectRoute model seeded 🍺');
        else console.info('ProjectRoute seeder failed.');
      } else {
        console.info('ProjectRoute is upto date 🍺');
      }
    }
  } catch (error) {
    console.log('ProjectRoute seeder failed due to ', error.message);
  }
}

/* seeds role for routes */
async function seedRouteRole () {
  try {
    const routeRoles = [
      {
        route: '/admin/user/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/user/create',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/admin/user/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/user/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/user/addbulk',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/admin/user/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/user/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/user/list',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/admin/user/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/user/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/admin/user/:id',
        role: 'User',
        method: 'GET'
      },
      {
        route: '/admin/user/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/user/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/user/count',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/admin/user/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/user/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/user/update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/admin/user/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/user/partial-update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/admin/user/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/user/updatebulk',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/admin/user/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdelete/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdeletemany',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/admin/user/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/user/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/admin/user/delete/:id',
        role: 'User',
        method: 'DELETE'
      },
      {
        route: '/admin/user/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/user/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/admin/user/deletemany',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/admin/user/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/departments/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/departments/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/departments/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/departments/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/departments/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/departments/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/departments/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/departments/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/departments/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/departments/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/departments/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/departments/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/enterprise/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/enterprise/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/enterprise/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/enterprise/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/enterprise/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/enterprise/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/enterprise/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/enterprise/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/enterprise/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/enterprise/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/enterprise/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/enterprise/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/encounter/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/encounter/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/encounter/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/encounter/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/encounter/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/encounter/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/encounter/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/encounter/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/encounter/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/encounter/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/encounter/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/encounter/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/note/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/note/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/note/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/note/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/note/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/note/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/note/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/note/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/note/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/note/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/note/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/note/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/medication/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/medication/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/medication/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/medication/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/medication/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/medication/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/medication/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/medication/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/medication/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/medication/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/medication/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/medication/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/order/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/order/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/order/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/order/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/order/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/order/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/order/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/order/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/order/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/order/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/order/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/order/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/patient/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/patient/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/patient/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/patient/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/patient/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/patient/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/patient/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/patient/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/patient/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/patient/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/patient/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/patient/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/orderitem/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/orderitem/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/orderitem/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/orderitem/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/orderitem/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/orderitem/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/orderitem/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/orderitem/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/orderitem/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/orderitem/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/orderitem/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/orderitem/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/customer/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/customer/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/customer/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/customer/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/customer/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/customer/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/customer/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/customer/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/customer/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/customer/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/customer/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/customer/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/task/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/task/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/task/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/task/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/task/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/task/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/task/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/task/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/task/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/task/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/task/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/task/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/comment/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/comment/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/comment/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/comment/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/comment/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/comment/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/comment/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/comment/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/comment/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/comment/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/comment/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/comment/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/plan/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/plan/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/plan/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/plan/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/plan/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/plan/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/plan/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/plan/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/plan/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/plan/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/plan/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/plan/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_group/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_group/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_group/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_group/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/chat_group/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_group/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_group/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_group/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_group/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_group/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_group/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/chat_group/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_message/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_message/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_message/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_message/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/chat_message/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/chat_message/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_message/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_message/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_message/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_message/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/chat_message/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/chat_message/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/todo/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/todo/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/todo/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/todo/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/todo/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/todo/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/todo/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/todo/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/todo/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/todo/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/todo/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/todo/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_schedule/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_schedule/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_schedule/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_schedule/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/appointment_schedule/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_schedule/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_schedule/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_schedule/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_schedule/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_schedule/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_schedule/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/appointment_schedule/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_slot/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_slot/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_slot/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_slot/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/appointment_slot/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/appointment_slot/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_slot/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_slot/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_slot/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_slot/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/appointment_slot/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/appointment_slot/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/event/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/event/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/event/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/event/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/event/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/event/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/event/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/event/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/event/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/event/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/event/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/event/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/master/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/master/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/master/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/master/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/master/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/master/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/master/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/master/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/master/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/master/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/master/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/master/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/blog/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/blog/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/blog/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/blog/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/blog/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/blog/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/blog/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/blog/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/blog/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/blog/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/blog/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/blog/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/userauthsettings/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userauthsettings/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userauthsettings/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/userauthsettings/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/usertokens/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/usertokens/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/usertokens/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/usertokens/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/role/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/role/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/role/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/role/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/role/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/role/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/role/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/role/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/projectroute/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/projectroute/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/projectroute/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/projectroute/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/routerole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/routerole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/routerole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/routerole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/admin/userrole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/admin/userrole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/admin/userrole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/admin/userrole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/create',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/create',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/addbulk',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/addbulk',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/list',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/list',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/:id',
        role: 'Admin',
        method: 'GET'
      },
      {
        route: '/device/api/v1/user/:id',
        role: 'User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/user/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/user/count',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/count',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/partial-update/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/partial-update/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/updatebulk',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/updatebulk',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdelete/:id',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdelete/:id',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdeletemany',
        role: 'Admin',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdeletemany',
        role: 'User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/user/delete/:id',
        role: 'Admin',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/user/delete/:id',
        role: 'User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/user/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/user/deletemany',
        role: 'Admin',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/deletemany',
        role: 'User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/user/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/departments/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/departments/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/departments/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/departments/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/departments/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/departments/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/departments/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/departments/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/departments/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/departments/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/departments/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/departments/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/enterprise/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/enterprise/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/enterprise/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/enterprise/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/enterprise/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/enterprise/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/enterprise/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/enterprise/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/enterprise/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/enterprise/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/enterprise/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/enterprise/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/encounter/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/encounter/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/encounter/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/encounter/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/encounter/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/encounter/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/encounter/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/encounter/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/encounter/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/encounter/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/encounter/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/encounter/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/note/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/note/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/note/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/note/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/note/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/note/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/note/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/note/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/note/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/note/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/note/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/note/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/medication/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/medication/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/medication/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/medication/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/medication/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/medication/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/medication/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/medication/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/medication/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/medication/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/medication/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/medication/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/order/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/order/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/order/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/order/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/order/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/order/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/order/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/order/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/order/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/order/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/order/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/order/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/patient/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/patient/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/patient/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/patient/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/patient/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/patient/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/patient/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/patient/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/patient/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/patient/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/patient/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/patient/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/orderitem/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/orderitem/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/orderitem/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/orderitem/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/orderitem/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/orderitem/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/orderitem/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/orderitem/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/orderitem/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/orderitem/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/orderitem/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/orderitem/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/customer/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/customer/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/customer/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/customer/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/customer/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/customer/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/customer/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/customer/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/customer/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/customer/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/customer/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/customer/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/task/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/task/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/task/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/task/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/task/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/task/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/task/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/task/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/task/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/task/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/task/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/task/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/comment/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/comment/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/comment/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/comment/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/comment/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/comment/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/comment/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/comment/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/comment/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/comment/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/comment/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/comment/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/plan/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/plan/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/plan/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/plan/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/plan/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/plan/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/plan/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/plan/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/plan/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/plan/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/plan/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/plan/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_group/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_group/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_group/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_group/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/chat_group/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_group/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_group/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_group/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_group/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_group/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_group/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/chat_group/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_message/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_message/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_message/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_message/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/chat_message/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/chat_message/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_message/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_message/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_message/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_message/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/chat_message/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/chat_message/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/todo/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/todo/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/todo/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/todo/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/todo/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/todo/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/todo/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/todo/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/todo/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/todo/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/todo/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/todo/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_schedule/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_schedule/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_schedule/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_schedule/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/appointment_schedule/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_schedule/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_schedule/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_schedule/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_schedule/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_schedule/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_schedule/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/appointment_schedule/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_slot/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_slot/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_slot/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_slot/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/appointment_slot/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/appointment_slot/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_slot/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_slot/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_slot/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_slot/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/appointment_slot/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/appointment_slot/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/event/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/event/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/event/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/event/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/event/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/event/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/event/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/event/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/event/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/event/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/event/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/event/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/master/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/master/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/master/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/master/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/master/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/master/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/master/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/master/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/master/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/master/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/master/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/master/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/blog/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/blog/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/blog/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/blog/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/blog/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/blog/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/blog/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/blog/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/blog/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/blog/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/blog/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/blog/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/userauthsettings/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userauthsettings/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userauthsettings/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/userauthsettings/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/usertokens/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/usertokens/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/usertokens/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/usertokens/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/role/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/role/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/role/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/role/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/projectroute/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/projectroute/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/projectroute/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/projectroute/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/routerole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/routerole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/routerole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/routerole/deletemany',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/create',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/addbulk',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/list',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/:id',
        role: 'System_User',
        method: 'GET'
      },
      {
        route: '/device/api/v1/userrole/count',
        role: 'System_User',
        method: 'POST'
      },
      {
        route: '/device/api/v1/userrole/update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/partial-update/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/updatebulk',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/softdelete/:id',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/softdeletemany',
        role: 'System_User',
        method: 'PUT'
      },
      {
        route: '/device/api/v1/userrole/delete/:id',
        role: 'System_User',
        method: 'DELETE'
      },
      {
        route: '/device/api/v1/userrole/deletemany',
        role: 'System_User',
        method: 'POST'
      },

    ];
    if (routeRoles && routeRoles.length) {
      const routes = [...new Set(routeRoles.map(routeRole => routeRole.route.toLowerCase()))];
      const routeMethods = [...new Set(routeRoles.map(routeRole => routeRole.method))];
      const roles = ['Admin', 'User', 'System_User'];
      const insertedProjectRoute = await dbService.findAll(model.projectRoute, {
        uri: { $in: routes },
        method: { $in: routeMethods },
        'isActive': true,
        'isDeleted': false
      });
      const insertedRoles = await dbService.findAll(model.role, {
        code: { $in: roles.map(role => role.toUpperCase()) },
        'isActive': true,
        'isDeleted': false
      });
      let projectRouteId = '';
      let roleId = '';
      let createRouteRoles = routeRoles.map(routeRole => {
        projectRouteId = insertedProjectRoute.find(pr => pr.uri === routeRole.route.toLowerCase() && pr.method === routeRole.method);
        roleId = insertedRoles.find(r => r.code === routeRole.role.toUpperCase());
        if (projectRouteId && roleId) {
          return {
            roleId: roleId.id,
            routeId: projectRouteId.id
          };
        }
      });
      createRouteRoles = createRouteRoles.filter(Boolean);
      const routeRolesToBeInserted = [];
      let routeRoleObj = {};

      await Promise.all(
        createRouteRoles.map(async routeRole => {
          routeRoleObj = await dbService.findOne(model.routeRole, {
            routeId: routeRole.routeId,
            roleId: routeRole.roleId,
          });
          if (!routeRoleObj) {
            routeRolesToBeInserted.push({
              routeId: routeRole.routeId,
              roleId: routeRole.roleId,
            });
          }
        })
      );
      if (routeRolesToBeInserted.length) {
        const result = await dbService.createMany(model.routeRole, routeRolesToBeInserted);
        if (result) console.log('RouteRole seeded 🍺');
        else console.log('RouteRole seeder failed!');
      } else {
        console.log('RouteRole is upto date 🍺');
      }
    }
  } catch (error) {
    console.log('RouteRole seeder failed due to ', error.message);
  }
}

/* seeds roles for users */
async function seedUserRole () {
  try {
    const userRoles = [{
      'username': 'Darian_Padberg50',
      'password': 'GpawcrqrE_nLgOD'
    }, {
      'username': 'Kathryn_Veum0',
      'password': 'k1zqTcJGu3h3i3z'
    }];
    const defaultRoles = await dbService.findAll(model.role);
    const insertedUsers = await dbService.findAll(model.user, { username: { $in: userRoles.map(userRole => userRole.username) } });
    let user = {};
    const userRolesArr = [];
    userRoles.map(userRole => {
      user = insertedUsers.find(user => user.username === userRole.username && user.isPasswordMatch(userRole.password) && user.isActive && !user.isDeleted);
      if (user) {
        if (user.userType === authConstant.USER_TYPES.Admin) {
          userRolesArr.push({
            userId: user.id,
            roleId: defaultRoles.find((d) => d.code === 'ADMIN').id
          });
        } else if (user.userType === authConstant.USER_TYPES.User) {
          userRolesArr.push({
            userId: user.id,
            roleId: defaultRoles.find((d) => d.code === 'USER').id
          });
        } else {
          userRolesArr.push({
            userId: user.id,
            roleId: defaultRoles.find((d) => d.code === 'SYSTEM_USER').id
          });
        }
      }
    });
    let userRoleObj = {};
    const userRolesToBeInserted = [];
    if (userRolesArr.length) {
      await Promise.all(
        userRolesArr.map(async userRole => {
          userRoleObj = await dbService.findOne(model.userRole, {
            userId: userRole.userId,
            roleId: userRole.roleId
          });
          if (!userRoleObj) {
            userRolesToBeInserted.push({
              userId: userRole.userId,
              roleId: userRole.roleId
            });
          }
        })
      );
      if (userRolesToBeInserted.length) {
        const result = await dbService.createMany(model.userRole, userRolesToBeInserted);
        if (result) console.log('UserRole seeded 🍺');
        else console.log('UserRole seeder failed');
      } else {
        console.log('UserRole is upto date 🍺');
      }
    }
  } catch (error) {
    console.log('UserRole seeder failed due to ', error.message);
  }
}

/*
 * async function weekSeeder () {
 * try {
 *  let dataInserted = {};
 *  dataInserted = await dbService.findOne(model.week);
 *  if (!dataInserted) {
 *    await dbService.createMany(model.week, week);
 *  }
 * } catch (error) {
 *  console.log('menu seeder failed due to ', error.message);
 * }
 * } 
 */

async function menuSeeder () {
  try {
    let dataInserted = {};
    dataInserted = await dbService.findOne(model.menu);
    if (!dataInserted) {
      await dbService.createOne(model.menu, { menuKeys: menu });
      console.log('Menu is upto date 🍺');
    }
  } catch (error) {
    console.log('menu seeder failed due to ', error);
  }
}
async function countrySeeder () {
  try {
    let dataInserted = {};
    dataInserted = await dbService.findOne(model.countries, { 'countryName': 'Australia' });
    if (!dataInserted) {
      await dbService.createMany(model.countries, countryJson);
      await dbService.createMany(model.state, stateJson);
      console.log('Country is upto date 🍺');
    }
  } catch (error) {
    console.log('country seeder failed due to ', error);
  }
}
async function routeSeeder () {
  try {
    let dataInserted = {};
    dataInserted = await dbService.findOne(model.route, { name: 'GFP Run' });
    if (!dataInserted) {
      await dbService.createMany(model.route, routeJson);
      console.log('Route is upto date 🍺');
    }
  } catch (error) {
    console.log('Route seeder failed due to ', error);
  }
}

/* calls of functions to seed mock data into multiple collections */
async function seedData (allRegisterRoutes) {
  await seedUser();
  await seedRole();
  await seedProjectRoutes(allRegisterRoutes);
  await seedRouteRole();
  await seedUserRole();
  await menuSeeder();
  await countrySeeder();
  // await routeSeeder();
  /* await weekSeeder(); */

};
module.exports = seedData;