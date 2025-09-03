/**
 * deleteDependent.js
 * @description :: exports deleteDependent service for project.
 */

let Departments = require('../model/departments');
let Enterprise = require('../model/enterprise');
let Encounter = require('../model/encounter');
let Note = require('../model/note');
let Medication = require('../model/medication');
let Order = require('../model/order');
let Patient = require('../model/patient');
let OrderItem = require('../model/orderItem');
let Customer = require('../model/Customer');
let Task = require('../model/Task');
let Comment = require('../model/Comment');
let Plan = require('../model/Plan');
let Chat_group = require('../model/Chat_group');
let Chat_message = require('../model/Chat_message');
let ToDo = require('../model/ToDo');
let Appointment_schedule = require('../model/Appointment_schedule');
let Appointment_slot = require('../model/Appointment_slot');
let Event = require('../model/Event');
let Master = require('../model/Master');
let Blog = require('../model/Blog');
let User = require('../model/user');
let UserAuthSettings = require('../model/userAuthSettings');
let UserTokens = require('../model/userTokens');
let Role = require('../model/role');
let ProjectRoute = require('../model/projectRoute');
let RouteRole = require('../model/routeRole');
let UserRole = require('../model/userRole');
let dbService = require('.//dbService');

const deleteDepartments = async (filter) =>{
  try {
    let response  = await dbService.destroy(Departments,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteEnterprise = async (filter) =>{
  try {
    let enterprise = await dbService.findAll(Enterprise,filter);
    if (enterprise && enterprise.length){
      enterprise = enterprise.map((obj) => obj.id);

      const departmentsFilter = { $or: [{ enterprises : { $in : enterprise } }] };
      const departmentsCnt = await dbService.destroy(Departments,departmentsFilter);

      const noteFilter = { $or: [{ encounterId : { $in : enterprise } }] };
      const noteCnt = await dbService.destroy(Note,noteFilter);

      let deleted  = await dbService.destroy(Enterprise,filter);
      let response = {
        departments :departmentsCnt.length,
        note :noteCnt.length,
      };
      return response; 
    } else {
      return {  enterprise : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteEncounter = async (filter) =>{
  try {
    let response  = await dbService.destroy(Encounter,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteNote = async (filter) =>{
  try {
    let response  = await dbService.destroy(Note,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteMedication = async (filter) =>{
  try {
    let response  = await dbService.destroy(Medication,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteOrder = async (filter) =>{
  try {
    let response  = await dbService.destroy(Order,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deletePatient = async (filter) =>{
  try {
    let response  = await dbService.destroy(Patient,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteOrderItem = async (filter) =>{
  try {
    let response  = await dbService.destroy(OrderItem,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteCustomer = async (filter) =>{
  try {
    let response  = await dbService.destroy(Customer,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteTask = async (filter) =>{
  try {
    let response  = await dbService.destroy(Task,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteComment = async (filter) =>{
  try {
    let comment = await dbService.findAll(Comment,filter);
    if (comment && comment.length){
      comment = comment.map((obj) => obj.id);

      const CommentFilter = { $or: [{ parentItem : { $in : comment } }] };
      const CommentCnt = await dbService.destroy(Comment,CommentFilter);

      let deleted  = await dbService.destroy(Comment,filter);
      let response = { Comment :CommentCnt.length, };
      return response; 
    } else {
      return {  comment : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deletePlan = async (filter) =>{
  try {
    let response  = await dbService.destroy(Plan,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteChat_group = async (filter) =>{
  try {
    let chat_group = await dbService.findAll(Chat_group,filter);
    if (chat_group && chat_group.length){
      chat_group = chat_group.map((obj) => obj.id);

      const Chat_messageFilter = { $or: [{ groupId : { $in : chat_group } }] };
      const Chat_messageCnt = await dbService.destroy(Chat_message,Chat_messageFilter);

      let deleted  = await dbService.destroy(Chat_group,filter);
      let response = { Chat_message :Chat_messageCnt.length, };
      return response; 
    } else {
      return {  chat_group : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteChat_message = async (filter) =>{
  try {
    let response  = await dbService.destroy(Chat_message,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteToDo = async (filter) =>{
  try {
    let response  = await dbService.destroy(ToDo,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteAppointment_schedule = async (filter) =>{
  try {
    let response  = await dbService.destroy(Appointment_schedule,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteAppointment_slot = async (filter) =>{
  try {
    let appointment_slot = await dbService.findAll(Appointment_slot,filter);
    if (appointment_slot && appointment_slot.length){
      appointment_slot = appointment_slot.map((obj) => obj.id);

      const Appointment_scheduleFilter = { $or: [{ slot : { $in : appointment_slot } }] };
      const Appointment_scheduleCnt = await dbService.destroy(Appointment_schedule,Appointment_scheduleFilter);

      let deleted  = await dbService.destroy(Appointment_slot,filter);
      let response = { Appointment_schedule :Appointment_scheduleCnt.length, };
      return response; 
    } else {
      return {  appointment_slot : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteEvent = async (filter) =>{
  try {
    let response  = await dbService.destroy(Event,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteMaster = async (filter) =>{
  try {
    let master = await dbService.findAll(Master,filter);
    if (master && master.length){
      master = master.map((obj) => obj.id);

      const MasterFilter = { $or: [{ parentId : { $in : master } }] };
      const MasterCnt = await dbService.destroy(Master,MasterFilter);

      let deleted  = await dbService.destroy(Master,filter);
      let response = { Master :MasterCnt.length, };
      return response; 
    } else {
      return {  master : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteBlog = async (filter) =>{
  try {
    let response  = await dbService.destroy(Blog,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteUser = async (filter) =>{
  try {
    let user = await dbService.findAll(User,filter);
    if (user && user.length){
      user = user.map((obj) => obj.id);

      const departmentsFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const departmentsCnt = await dbService.destroy(Departments,departmentsFilter);

      const enterpriseFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const enterpriseCnt = await dbService.destroy(Enterprise,enterpriseFilter);

      const encounterFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const encounterCnt = await dbService.destroy(Encounter,encounterFilter);

      const noteFilter = { $or: [{ provider : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const noteCnt = await dbService.destroy(Note,noteFilter);

      const medicationFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const medicationCnt = await dbService.destroy(Medication,medicationFilter);

      const orderFilter = { $or: [{ orderBy : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const orderCnt = await dbService.destroy(Order,orderFilter);

      const patientFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const patientCnt = await dbService.destroy(Patient,patientFilter);

      const orderItemFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const orderItemCnt = await dbService.destroy(OrderItem,orderItemFilter);

      const CustomerFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const CustomerCnt = await dbService.destroy(Customer,CustomerFilter);

      const TaskFilter = { $or: [{ completedBy : { $in : user } },{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const TaskCnt = await dbService.destroy(Task,TaskFilter);

      const CommentFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const CommentCnt = await dbService.destroy(Comment,CommentFilter);

      const PlanFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const PlanCnt = await dbService.destroy(Plan,PlanFilter);

      const Chat_groupFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Chat_groupCnt = await dbService.destroy(Chat_group,Chat_groupFilter);

      const Chat_messageFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Chat_messageCnt = await dbService.destroy(Chat_message,Chat_messageFilter);

      const ToDoFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const ToDoCnt = await dbService.destroy(ToDo,ToDoFilter);

      const Appointment_scheduleFilter = { $or: [{ host : { $in : user } },{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Appointment_scheduleCnt = await dbService.destroy(Appointment_schedule,Appointment_scheduleFilter);

      const Appointment_slotFilter = { $or: [{ userId : { $in : user } },{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Appointment_slotCnt = await dbService.destroy(Appointment_slot,Appointment_slotFilter);

      const EventFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const EventCnt = await dbService.destroy(Event,EventFilter);

      const MasterFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const MasterCnt = await dbService.destroy(Master,MasterFilter);

      const BlogFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const BlogCnt = await dbService.destroy(Blog,BlogFilter);

      const userFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const userCnt = await dbService.destroy(User,userFilter);

      const userAuthSettingsFilter = { $or: [{ userId : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const userAuthSettingsCnt = await dbService.destroy(UserAuthSettings,userAuthSettingsFilter);

      const userTokensFilter = { $or: [{ userId : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const userTokensCnt = await dbService.destroy(UserTokens,userTokensFilter);

      const userRoleFilter = { $or: [{ userId : { $in : user } }] };
      const userRoleCnt = await dbService.destroy(UserRole,userRoleFilter);

      let deleted  = await dbService.destroy(User,filter);
      let response = {
        departments :departmentsCnt.length,
        enterprise :enterpriseCnt.length,
        encounter :encounterCnt.length,
        note :noteCnt.length,
        medication :medicationCnt.length,
        order :orderCnt.length,
        patient :patientCnt.length,
        orderItem :orderItemCnt.length,
        Customer :CustomerCnt.length,
        Task :TaskCnt.length,
        Comment :CommentCnt.length,
        Plan :PlanCnt.length,
        Chat_group :Chat_groupCnt.length,
        Chat_message :Chat_messageCnt.length,
        ToDo :ToDoCnt.length,
        Appointment_schedule :Appointment_scheduleCnt.length,
        Appointment_slot :Appointment_slotCnt.length,
        Event :EventCnt.length,
        Master :MasterCnt.length,
        Blog :BlogCnt.length,
        user :userCnt.length + deleted.length,
        userAuthSettings :userAuthSettingsCnt.length,
        userTokens :userTokensCnt.length,
        userRole :userRoleCnt.length,
      };
      return response; 
    } else {
      return {  user : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteUserAuthSettings = async (filter) =>{
  try {
    let response  = await dbService.destroy(UserAuthSettings,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteUserTokens = async (filter) =>{
  try {
    let response  = await dbService.destroy(UserTokens,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteRole = async (filter) =>{
  try {
    let role = await dbService.findAll(Role,filter);
    if (role && role.length){
      role = role.map((obj) => obj.id);

      const routeRoleFilter = { $or: [{ roleId : { $in : role } }] };
      const routeRoleCnt = await dbService.destroy(RouteRole,routeRoleFilter);

      const userRoleFilter = { $or: [{ roleId : { $in : role } }] };
      const userRoleCnt = await dbService.destroy(UserRole,userRoleFilter);

      let deleted  = await dbService.destroy(Role,filter);
      let response = {
        routeRole :routeRoleCnt.length,
        userRole :userRoleCnt.length,
      };
      return response; 
    } else {
      return {  role : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteProjectRoute = async (filter) =>{
  try {
    let projectroute = await dbService.findAll(ProjectRoute,filter);
    if (projectroute && projectroute.length){
      projectroute = projectroute.map((obj) => obj.id);

      const routeRoleFilter = { $or: [{ routeId : { $in : projectroute } }] };
      const routeRoleCnt = await dbService.destroy(RouteRole,routeRoleFilter);

      let deleted  = await dbService.destroy(ProjectRoute,filter);
      let response = { routeRole :routeRoleCnt.length, };
      return response; 
    } else {
      return {  projectroute : 0 };
    }

  } catch (error){
    throw new Error(error.message);
  }
};

const deleteRouteRole = async (filter) =>{
  try {
    let response  = await dbService.destroy(RouteRole,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const deleteUserRole = async (filter) =>{
  try {
    let response  = await dbService.destroy(UserRole,filter);
    return response;
  } catch (error){
    throw new Error(error.message);
  }
};

const countDepartments = async (filter) =>{
  try {
    const departmentsCnt =  await dbService.count(Departments,filter);
    return { departments : departmentsCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countEnterprise = async (filter) =>{
  try {
    let enterprise = await dbService.findAll(Enterprise,filter);
    if (enterprise && enterprise.length){
      enterprise = enterprise.map((obj) => obj.id);

      const departmentsFilter = { $or: [{ enterprises : { $in : enterprise } }] };
      const departmentsCnt =  await dbService.count(Departments,departmentsFilter);

      const noteFilter = { $or: [{ encounterId : { $in : enterprise } }] };
      const noteCnt =  await dbService.count(Note,noteFilter);

      let response = {
        departments : departmentsCnt,
        note : noteCnt,
      };
      return response; 
    } else {
      return {  enterprise : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countEncounter = async (filter) =>{
  try {
    const encounterCnt =  await dbService.count(Encounter,filter);
    return { encounter : encounterCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countNote = async (filter) =>{
  try {
    const noteCnt =  await dbService.count(Note,filter);
    return { note : noteCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countMedication = async (filter) =>{
  try {
    const medicationCnt =  await dbService.count(Medication,filter);
    return { medication : medicationCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countOrder = async (filter) =>{
  try {
    const orderCnt =  await dbService.count(Order,filter);
    return { order : orderCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countPatient = async (filter) =>{
  try {
    const patientCnt =  await dbService.count(Patient,filter);
    return { patient : patientCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countOrderItem = async (filter) =>{
  try {
    const orderItemCnt =  await dbService.count(OrderItem,filter);
    return { orderItem : orderItemCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countCustomer = async (filter) =>{
  try {
    const CustomerCnt =  await dbService.count(Customer,filter);
    return { Customer : CustomerCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countTask = async (filter) =>{
  try {
    const TaskCnt =  await dbService.count(Task,filter);
    return { Task : TaskCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countComment = async (filter) =>{
  try {
    let comment = await dbService.findAll(Comment,filter);
    if (comment && comment.length){
      comment = comment.map((obj) => obj.id);

      const CommentFilter = { $or: [{ parentItem : { $in : comment } }] };
      const CommentCnt =  await dbService.count(Comment,CommentFilter);

      let response = { Comment : CommentCnt, };
      return response; 
    } else {
      return {  comment : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countPlan = async (filter) =>{
  try {
    const PlanCnt =  await dbService.count(Plan,filter);
    return { Plan : PlanCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countChat_group = async (filter) =>{
  try {
    let chat_group = await dbService.findAll(Chat_group,filter);
    if (chat_group && chat_group.length){
      chat_group = chat_group.map((obj) => obj.id);

      const Chat_messageFilter = { $or: [{ groupId : { $in : chat_group } }] };
      const Chat_messageCnt =  await dbService.count(Chat_message,Chat_messageFilter);

      let response = { Chat_message : Chat_messageCnt, };
      return response; 
    } else {
      return {  chat_group : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countChat_message = async (filter) =>{
  try {
    const Chat_messageCnt =  await dbService.count(Chat_message,filter);
    return { Chat_message : Chat_messageCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countToDo = async (filter) =>{
  try {
    const ToDoCnt =  await dbService.count(ToDo,filter);
    return { ToDo : ToDoCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countAppointment_schedule = async (filter) =>{
  try {
    const Appointment_scheduleCnt =  await dbService.count(Appointment_schedule,filter);
    return { Appointment_schedule : Appointment_scheduleCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countAppointment_slot = async (filter) =>{
  try {
    let appointment_slot = await dbService.findAll(Appointment_slot,filter);
    if (appointment_slot && appointment_slot.length){
      appointment_slot = appointment_slot.map((obj) => obj.id);

      const Appointment_scheduleFilter = { $or: [{ slot : { $in : appointment_slot } }] };
      const Appointment_scheduleCnt =  await dbService.count(Appointment_schedule,Appointment_scheduleFilter);

      let response = { Appointment_schedule : Appointment_scheduleCnt, };
      return response; 
    } else {
      return {  appointment_slot : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countEvent = async (filter) =>{
  try {
    const EventCnt =  await dbService.count(Event,filter);
    return { Event : EventCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countMaster = async (filter) =>{
  try {
    let master = await dbService.findAll(Master,filter);
    if (master && master.length){
      master = master.map((obj) => obj.id);

      const MasterFilter = { $or: [{ parentId : { $in : master } }] };
      const MasterCnt =  await dbService.count(Master,MasterFilter);

      let response = { Master : MasterCnt, };
      return response; 
    } else {
      return {  master : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countBlog = async (filter) =>{
  try {
    const BlogCnt =  await dbService.count(Blog,filter);
    return { Blog : BlogCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countUser = async (filter) =>{
  try {
    let user = await dbService.findAll(User,filter);
    if (user && user.length){
      user = user.map((obj) => obj.id);

      const departmentsFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const departmentsCnt =  await dbService.count(Departments,departmentsFilter);

      const enterpriseFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const enterpriseCnt =  await dbService.count(Enterprise,enterpriseFilter);

      const encounterFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const encounterCnt =  await dbService.count(Encounter,encounterFilter);

      const noteFilter = { $or: [{ provider : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const noteCnt =  await dbService.count(Note,noteFilter);

      const medicationFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const medicationCnt =  await dbService.count(Medication,medicationFilter);

      const orderFilter = { $or: [{ orderBy : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const orderCnt =  await dbService.count(Order,orderFilter);

      const patientFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const patientCnt =  await dbService.count(Patient,patientFilter);

      const orderItemFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const orderItemCnt =  await dbService.count(OrderItem,orderItemFilter);

      const CustomerFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const CustomerCnt =  await dbService.count(Customer,CustomerFilter);

      const TaskFilter = { $or: [{ completedBy : { $in : user } },{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const TaskCnt =  await dbService.count(Task,TaskFilter);

      const CommentFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const CommentCnt =  await dbService.count(Comment,CommentFilter);

      const PlanFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const PlanCnt =  await dbService.count(Plan,PlanFilter);

      const Chat_groupFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Chat_groupCnt =  await dbService.count(Chat_group,Chat_groupFilter);

      const Chat_messageFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Chat_messageCnt =  await dbService.count(Chat_message,Chat_messageFilter);

      const ToDoFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const ToDoCnt =  await dbService.count(ToDo,ToDoFilter);

      const Appointment_scheduleFilter = { $or: [{ host : { $in : user } },{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Appointment_scheduleCnt =  await dbService.count(Appointment_schedule,Appointment_scheduleFilter);

      const Appointment_slotFilter = { $or: [{ userId : { $in : user } },{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const Appointment_slotCnt =  await dbService.count(Appointment_slot,Appointment_slotFilter);

      const EventFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const EventCnt =  await dbService.count(Event,EventFilter);

      const MasterFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const MasterCnt =  await dbService.count(Master,MasterFilter);

      const BlogFilter = { $or: [{ updatedBy : { $in : user } },{ addedBy : { $in : user } }] };
      const BlogCnt =  await dbService.count(Blog,BlogFilter);

      const userFilter = { $or: [{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const userCnt =  await dbService.count(User,userFilter);

      const userAuthSettingsFilter = { $or: [{ userId : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const userAuthSettingsCnt =  await dbService.count(UserAuthSettings,userAuthSettingsFilter);

      const userTokensFilter = { $or: [{ userId : { $in : user } },{ addedBy : { $in : user } },{ updatedBy : { $in : user } }] };
      const userTokensCnt =  await dbService.count(UserTokens,userTokensFilter);

      const userRoleFilter = { $or: [{ userId : { $in : user } }] };
      const userRoleCnt =  await dbService.count(UserRole,userRoleFilter);

      let response = {
        departments : departmentsCnt,
        enterprise : enterpriseCnt,
        encounter : encounterCnt,
        note : noteCnt,
        medication : medicationCnt,
        order : orderCnt,
        patient : patientCnt,
        orderItem : orderItemCnt,
        Customer : CustomerCnt,
        Task : TaskCnt,
        Comment : CommentCnt,
        Plan : PlanCnt,
        Chat_group : Chat_groupCnt,
        Chat_message : Chat_messageCnt,
        ToDo : ToDoCnt,
        Appointment_schedule : Appointment_scheduleCnt,
        Appointment_slot : Appointment_slotCnt,
        Event : EventCnt,
        Master : MasterCnt,
        Blog : BlogCnt,
        user : userCnt,
        userAuthSettings : userAuthSettingsCnt,
        userTokens : userTokensCnt,
        userRole : userRoleCnt,
      };
      return response; 
    } else {
      return {  user : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countUserAuthSettings = async (filter) =>{
  try {
    const userAuthSettingsCnt =  await dbService.count(UserAuthSettings,filter);
    return { userAuthSettings : userAuthSettingsCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countUserTokens = async (filter) =>{
  try {
    const userTokensCnt =  await dbService.count(UserTokens,filter);
    return { userTokens : userTokensCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countRole = async (filter) =>{
  try {
    let role = await dbService.findAll(Role,filter);
    if (role && role.length){
      role = role.map((obj) => obj.id);

      const routeRoleFilter = { $or: [{ roleId : { $in : role } }] };
      const routeRoleCnt =  await dbService.count(RouteRole,routeRoleFilter);

      const userRoleFilter = { $or: [{ roleId : { $in : role } }] };
      const userRoleCnt =  await dbService.count(UserRole,userRoleFilter);

      let response = {
        routeRole : routeRoleCnt,
        userRole : userRoleCnt,
      };
      return response; 
    } else {
      return {  role : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countProjectRoute = async (filter) =>{
  try {
    let projectroute = await dbService.findAll(ProjectRoute,filter);
    if (projectroute && projectroute.length){
      projectroute = projectroute.map((obj) => obj.id);

      const routeRoleFilter = { $or: [{ routeId : { $in : projectroute } }] };
      const routeRoleCnt =  await dbService.count(RouteRole,routeRoleFilter);

      let response = { routeRole : routeRoleCnt, };
      return response; 
    } else {
      return {  projectroute : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const countRouteRole = async (filter) =>{
  try {
    const routeRoleCnt =  await dbService.count(RouteRole,filter);
    return { routeRole : routeRoleCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const countUserRole = async (filter) =>{
  try {
    const userRoleCnt =  await dbService.count(UserRole,filter);
    return { userRole : userRoleCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteDepartments = async (filter,updateBody) =>{  
  try {
    const departmentsCnt =  await dbService.update(Departments,filter);
    return { departments : departmentsCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteEnterprise = async (filter,updateBody) =>{  
  try {
    let enterprise = await dbService.findAll(Enterprise,filter, { id:1 });
    if (enterprise.length){
      enterprise = enterprise.map((obj) => obj.id);

      const departmentsFilter = { '$or': [{ enterprises : { '$in' : enterprise } }] };
      const departmentsCnt = await dbService.update(Departments,departmentsFilter,updateBody);

      const noteFilter = { '$or': [{ encounterId : { '$in' : enterprise } }] };
      const noteCnt = await dbService.update(Note,noteFilter,updateBody);
      let updated = await dbService.update(Enterprise,filter,updateBody);

      let response = {
        departments :departmentsCnt.length,
        note :noteCnt.length,
      };
      return response;
    } else {
      return {  enterprise : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteEncounter = async (filter,updateBody) =>{  
  try {
    const encounterCnt =  await dbService.update(Encounter,filter);
    return { encounter : encounterCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteNote = async (filter,updateBody) =>{  
  try {
    const noteCnt =  await dbService.update(Note,filter);
    return { note : noteCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteMedication = async (filter,updateBody) =>{  
  try {
    const medicationCnt =  await dbService.update(Medication,filter);
    return { medication : medicationCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteOrder = async (filter,updateBody) =>{  
  try {
    const orderCnt =  await dbService.update(Order,filter);
    return { order : orderCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeletePatient = async (filter,updateBody) =>{  
  try {
    const patientCnt =  await dbService.update(Patient,filter);
    return { patient : patientCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteOrderItem = async (filter,updateBody) =>{  
  try {
    const orderItemCnt =  await dbService.update(OrderItem,filter);
    return { orderItem : orderItemCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteCustomer = async (filter,updateBody) =>{  
  try {
    const CustomerCnt =  await dbService.update(Customer,filter);
    return { Customer : CustomerCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteTask = async (filter,updateBody) =>{  
  try {
    const TaskCnt =  await dbService.update(Task,filter);
    return { Task : TaskCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteComment = async (filter,updateBody) =>{  
  try {
    let comment = await dbService.findAll(Comment,filter, { id:1 });
    if (comment.length){
      comment = comment.map((obj) => obj.id);

      const CommentFilter = { '$or': [{ parentItem : { '$in' : comment } }] };
      const CommentCnt = await dbService.update(Comment,CommentFilter,updateBody);
      let updated = await dbService.update(Comment,filter,updateBody);

      let response = { Comment :CommentCnt.length, };
      return response;
    } else {
      return {  comment : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeletePlan = async (filter,updateBody) =>{  
  try {
    const PlanCnt =  await dbService.update(Plan,filter);
    return { Plan : PlanCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteChat_group = async (filter,updateBody) =>{  
  try {
    let chat_group = await dbService.findAll(Chat_group,filter, { id:1 });
    if (chat_group.length){
      chat_group = chat_group.map((obj) => obj.id);

      const Chat_messageFilter = { '$or': [{ groupId : { '$in' : chat_group } }] };
      const Chat_messageCnt = await dbService.update(Chat_message,Chat_messageFilter,updateBody);
      let updated = await dbService.update(Chat_group,filter,updateBody);

      let response = { Chat_message :Chat_messageCnt.length, };
      return response;
    } else {
      return {  chat_group : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteChat_message = async (filter,updateBody) =>{  
  try {
    const Chat_messageCnt =  await dbService.update(Chat_message,filter);
    return { Chat_message : Chat_messageCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteToDo = async (filter,updateBody) =>{  
  try {
    const ToDoCnt =  await dbService.update(ToDo,filter);
    return { ToDo : ToDoCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteAppointment_schedule = async (filter,updateBody) =>{  
  try {
    const Appointment_scheduleCnt =  await dbService.update(Appointment_schedule,filter);
    return { Appointment_schedule : Appointment_scheduleCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteAppointment_slot = async (filter,updateBody) =>{  
  try {
    let appointment_slot = await dbService.findAll(Appointment_slot,filter, { id:1 });
    if (appointment_slot.length){
      appointment_slot = appointment_slot.map((obj) => obj.id);

      const Appointment_scheduleFilter = { '$or': [{ slot : { '$in' : appointment_slot } }] };
      const Appointment_scheduleCnt = await dbService.update(Appointment_schedule,Appointment_scheduleFilter,updateBody);
      let updated = await dbService.update(Appointment_slot,filter,updateBody);

      let response = { Appointment_schedule :Appointment_scheduleCnt.length, };
      return response;
    } else {
      return {  appointment_slot : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteEvent = async (filter,updateBody) =>{  
  try {
    const EventCnt =  await dbService.update(Event,filter);
    return { Event : EventCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteMaster = async (filter,updateBody) =>{  
  try {
    let master = await dbService.findAll(Master,filter, { id:1 });
    if (master.length){
      master = master.map((obj) => obj.id);

      const MasterFilter = { '$or': [{ parentId : { '$in' : master } }] };
      const MasterCnt = await dbService.update(Master,MasterFilter,updateBody);
      let updated = await dbService.update(Master,filter,updateBody);

      let response = { Master :MasterCnt.length, };
      return response;
    } else {
      return {  master : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteBlog = async (filter,updateBody) =>{  
  try {
    const BlogCnt =  await dbService.update(Blog,filter);
    return { Blog : BlogCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteUser = async (filter,updateBody) =>{  
  try {
    let user = await dbService.findAll(User,filter, { id:1 });
    if (user.length){
      user = user.map((obj) => obj.id);

      const departmentsFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const departmentsCnt = await dbService.update(Departments,departmentsFilter,updateBody);

      const enterpriseFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const enterpriseCnt = await dbService.update(Enterprise,enterpriseFilter,updateBody);

      const encounterFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const encounterCnt = await dbService.update(Encounter,encounterFilter,updateBody);

      const noteFilter = { '$or': [{ provider : { '$in' : user } },{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const noteCnt = await dbService.update(Note,noteFilter,updateBody);

      const medicationFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const medicationCnt = await dbService.update(Medication,medicationFilter,updateBody);

      const orderFilter = { '$or': [{ orderBy : { '$in' : user } },{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const orderCnt = await dbService.update(Order,orderFilter,updateBody);

      const patientFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const patientCnt = await dbService.update(Patient,patientFilter,updateBody);

      const orderItemFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const orderItemCnt = await dbService.update(OrderItem,orderItemFilter,updateBody);

      const CustomerFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const CustomerCnt = await dbService.update(Customer,CustomerFilter,updateBody);

      const TaskFilter = { '$or': [{ completedBy : { '$in' : user } },{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const TaskCnt = await dbService.update(Task,TaskFilter,updateBody);

      const CommentFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const CommentCnt = await dbService.update(Comment,CommentFilter,updateBody);

      const PlanFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const PlanCnt = await dbService.update(Plan,PlanFilter,updateBody);

      const Chat_groupFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const Chat_groupCnt = await dbService.update(Chat_group,Chat_groupFilter,updateBody);

      const Chat_messageFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const Chat_messageCnt = await dbService.update(Chat_message,Chat_messageFilter,updateBody);

      const ToDoFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const ToDoCnt = await dbService.update(ToDo,ToDoFilter,updateBody);

      const Appointment_scheduleFilter = { '$or': [{ host : { '$in' : user } },{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const Appointment_scheduleCnt = await dbService.update(Appointment_schedule,Appointment_scheduleFilter,updateBody);

      const Appointment_slotFilter = { '$or': [{ userId : { '$in' : user } },{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const Appointment_slotCnt = await dbService.update(Appointment_slot,Appointment_slotFilter,updateBody);

      const EventFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const EventCnt = await dbService.update(Event,EventFilter,updateBody);

      const MasterFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const MasterCnt = await dbService.update(Master,MasterFilter,updateBody);

      const BlogFilter = { '$or': [{ updatedBy : { '$in' : user } },{ addedBy : { '$in' : user } }] };
      const BlogCnt = await dbService.update(Blog,BlogFilter,updateBody);

      const userFilter = { '$or': [{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const userCnt = await dbService.update(User,userFilter,updateBody);

      const userAuthSettingsFilter = { '$or': [{ userId : { '$in' : user } },{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const userAuthSettingsCnt = await dbService.update(UserAuthSettings,userAuthSettingsFilter,updateBody);

      const userTokensFilter = { '$or': [{ userId : { '$in' : user } },{ addedBy : { '$in' : user } },{ updatedBy : { '$in' : user } }] };
      const userTokensCnt = await dbService.update(UserTokens,userTokensFilter,updateBody);

      const userRoleFilter = { '$or': [{ userId : { '$in' : user } }] };
      const userRoleCnt = await dbService.update(UserRole,userRoleFilter,updateBody);
      let updated = await dbService.update(User,filter,updateBody);

      let response = {
        departments :departmentsCnt.length,
        enterprise :enterpriseCnt.length,
        encounter :encounterCnt.length,
        note :noteCnt.length,
        medication :medicationCnt.length,
        order :orderCnt.length,
        patient :patientCnt.length,
        orderItem :orderItemCnt.length,
        Customer :CustomerCnt.length,
        Task :TaskCnt.length,
        Comment :CommentCnt.length,
        Plan :PlanCnt.length,
        Chat_group :Chat_groupCnt.length,
        Chat_message :Chat_messageCnt.length,
        ToDo :ToDoCnt.length,
        Appointment_schedule :Appointment_scheduleCnt.length,
        Appointment_slot :Appointment_slotCnt.length,
        Event :EventCnt.length,
        Master :MasterCnt.length,
        Blog :BlogCnt.length,
        user :userCnt.length + updated.length,
        userAuthSettings :userAuthSettingsCnt.length,
        userTokens :userTokensCnt.length,
        userRole :userRoleCnt.length,
      };
      return response;
    } else {
      return {  user : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteUserAuthSettings = async (filter,updateBody) =>{  
  try {
    const userAuthSettingsCnt =  await dbService.update(UserAuthSettings,filter);
    return { userAuthSettings : userAuthSettingsCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteUserTokens = async (filter,updateBody) =>{  
  try {
    const userTokensCnt =  await dbService.update(UserTokens,filter);
    return { userTokens : userTokensCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteRole = async (filter,updateBody) =>{  
  try {
    let role = await dbService.findAll(Role,filter, { id:1 });
    if (role.length){
      role = role.map((obj) => obj.id);

      const routeRoleFilter = { '$or': [{ roleId : { '$in' : role } }] };
      const routeRoleCnt = await dbService.update(RouteRole,routeRoleFilter,updateBody);

      const userRoleFilter = { '$or': [{ roleId : { '$in' : role } }] };
      const userRoleCnt = await dbService.update(UserRole,userRoleFilter,updateBody);
      let updated = await dbService.update(Role,filter,updateBody);

      let response = {
        routeRole :routeRoleCnt.length,
        userRole :userRoleCnt.length,
      };
      return response;
    } else {
      return {  role : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteProjectRoute = async (filter,updateBody) =>{  
  try {
    let projectroute = await dbService.findAll(ProjectRoute,filter, { id:1 });
    if (projectroute.length){
      projectroute = projectroute.map((obj) => obj.id);

      const routeRoleFilter = { '$or': [{ routeId : { '$in' : projectroute } }] };
      const routeRoleCnt = await dbService.update(RouteRole,routeRoleFilter,updateBody);
      let updated = await dbService.update(ProjectRoute,filter,updateBody);

      let response = { routeRole :routeRoleCnt.length, };
      return response;
    } else {
      return {  projectroute : 0 };
    }
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteRouteRole = async (filter,updateBody) =>{  
  try {
    const routeRoleCnt =  await dbService.update(RouteRole,filter);
    return { routeRole : routeRoleCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

const softDeleteUserRole = async (filter,updateBody) =>{  
  try {
    const userRoleCnt =  await dbService.update(UserRole,filter);
    return { userRole : userRoleCnt };
  } catch (error){
    throw new Error(error.message);
  }
};

module.exports = {
  deleteDepartments,
  deleteEnterprise,
  deleteEncounter,
  deleteNote,
  deleteMedication,
  deleteOrder,
  deletePatient,
  deleteOrderItem,
  deleteCustomer,
  deleteTask,
  deleteComment,
  deletePlan,
  deleteChat_group,
  deleteChat_message,
  deleteToDo,
  deleteAppointment_schedule,
  deleteAppointment_slot,
  deleteEvent,
  deleteMaster,
  deleteBlog,
  deleteUser,
  deleteUserAuthSettings,
  deleteUserTokens,
  deleteRole,
  deleteProjectRoute,
  deleteRouteRole,
  deleteUserRole,
  countDepartments,
  countEnterprise,
  countEncounter,
  countNote,
  countMedication,
  countOrder,
  countPatient,
  countOrderItem,
  countCustomer,
  countTask,
  countComment,
  countPlan,
  countChat_group,
  countChat_message,
  countToDo,
  countAppointment_schedule,
  countAppointment_slot,
  countEvent,
  countMaster,
  countBlog,
  countUser,
  countUserAuthSettings,
  countUserTokens,
  countRole,
  countProjectRoute,
  countRouteRole,
  countUserRole,
  softDeleteDepartments,
  softDeleteEnterprise,
  softDeleteEncounter,
  softDeleteNote,
  softDeleteMedication,
  softDeleteOrder,
  softDeletePatient,
  softDeleteOrderItem,
  softDeleteCustomer,
  softDeleteTask,
  softDeleteComment,
  softDeletePlan,
  softDeleteChat_group,
  softDeleteChat_message,
  softDeleteToDo,
  softDeleteAppointment_schedule,
  softDeleteAppointment_slot,
  softDeleteEvent,
  softDeleteMaster,
  softDeleteBlog,
  softDeleteUser,
  softDeleteUserAuthSettings,
  softDeleteUserTokens,
  softDeleteRole,
  softDeleteProjectRoute,
  softDeleteRouteRole,
  softDeleteUserRole,
};
