//define paths
let express = require('express');
let router = express.Router();
const UsersModel    = require(__path_schemas    + 'users');
const GroupsModel    = require(__path_schemas    + 'groups');
const ValidateUser  = require(__path_validates  + 'users');
const utilsHelpers  = require(__path_helpers    + 'utils')
const paramsHelpers = require(__path_helpers    + 'params');
const systemConfig  = require(__path_configs    + 'system');

const { check, validationResult } = require('express-validator');
const linkIndex = '/'+systemConfig.preFixAdmin+ '/users/'; 
const pageTitleIndex = 'User Management - List';
const pageTitleAdd = 'User Management - Add';
const pageTitleEdit = 'User Management - Edit';
const folderView  = __path_views + 'pages/users/';
/* GET users listing. */
router.get('(/status/:status)?', (req, res, next) =>{
  let objWhere = {};
  let keyword = paramsHelpers.getParam(req.query,'keyword',''); 
  let currentStatus  = paramsHelpers.getParam(req.params,'status','all');
  let statusFilter =  utilsHelpers.createFilterStatus(currentStatus,'users');
  let sortField = paramsHelpers.getParam(req.session,'sort_field','name'); 
  let sortType =  paramsHelpers.getParam(req.session,'sort_type','asc'); 
  let groupID =  paramsHelpers.getParam(req.session,'group_id',''); 

  let sort = {}; 
  sort[sortField] = sortType; 
  let pagination = {
    totalItems:1,
    totalItemsPerPage: 5, 
    currentPage: parseInt(paramsHelpers.getParam(req.query, 'page', 1)),
    pageRanges:3
  }
  let groupsItems = []; 
   GroupsModel.find({},{_id: 1,name: 1}).then((items)=>{
    groupsItems = items; 
    groupsItems.unshift({_id: 'allvalue', name: 'All Group'})
  });
  if(groupID !== '') objWhere = {'group.id': groupID}
  if(groupID == 'allvalue') objWhere = {};
  if(currentStatus !== 'all') objWhere.status = currentStatus; 
  if(keyword !== '') objWhere.name = new RegExp(keyword, 'i'); 



  UsersModel.countDocuments(objWhere).then( (data)=>{
    pagination.totalItems = data;  
    });

    UsersModel
    .find(objWhere)
    .select('name status ordering created modified group.name')
    .sort(sort)
    .skip((pagination.currentPage-1) * pagination.totalItemsPerPage)
    .limit(pagination.totalItemsPerPage)
    .then((items)=>{
      res.render(`${folderView}list`,{
                                      pageTitle:pageTitleIndex,
                                      items,
                                      statusFilter,
                                      pagination,     
                                      currentStatus,
                                      keyword,
                                      sortField,
                                      sortType,
                                      groupsItems,
                                      groupID
                });
    })
  })
 //change status 
router.get('/change-status/:id/:status', async (req, res, next) => {
  let currentStatus  = paramsHelpers.getParam(req.params,'status','active');
  let id             = paramsHelpers.getParam(req.params,'id','');
  //active <=> inactive 
  let status = (currentStatus == "inactive")? "active" : "inactive";
  let data = {
    status: status,
    modified: {
      user_id: 0,
      user_name: 0, 
      time: Date.now()
    }
  }
await UsersModel.updateOne({ _id:id }, data, (err,result)=>{
  req.flash('success', 'Updated status successfully',false);
  res.redirect(linkIndex)
});
}); 
 //change status  -- Multi
 router.post('/change-status/:status', async (req, res, next) => {
  let currentStatus  = paramsHelpers.getParam(req.params,'status','active');
  let data = {
    status: currentStatus,
    modified: {
      user_id: 0,
      user_name: 'admin', 
      time: Date.now()
    }
  }
await UsersModel.updateMany({ _id: {$in:req.body.cid}}, data, (err,result)=>{
  req.flash('success', `Update ${result.n} status successfully`,false);
  res.redirect(linkIndex)
}); 
});

//change ordering - nulti 
router.post('/save-ordering',  (req, res, next) => {
  //single item 
  let cids = req.body.cid;
  let orderings = req.body.ordering; 
  if(Array.isArray(cids)){
    cids.forEach( (item,index)=>{
      let data = {
        ordering: parseInt(orderings[index]),
        modified: {
          user_id: 0,
          user_name: 'admin', 
          time: Date.now()
        }
      }
      UsersModel.updateOne({ _id:item }, data, (err,result)=>{});
    })
  } else {
    UsersModel.updateOne({ _id:cids }, { ordering: parseInt(orderings)}, (err,result)=>{});
  }
  res.redirect(linkIndex)
  });

//delete 
router.get('/delete/:id', async (req, res, next) => {
  let id             = paramsHelpers.getParam(req.params,'id','');
await UsersModel.deleteOne({ _id:id }, (err,result)=>{
  req.flash('success', 'Delete item successfully',false);
  res.redirect(linkIndex)
});
}); 
//delete multi
router.post('/delete', async (req, res, next) => {
await UsersModel.remove({ _id: {$in:req.body.cid}}, (err,result)=>{
  req.flash('success', 'Delete multi - status successfully',false);
  res.redirect(linkIndex)
}); 
});
   //FORM
router.get('/form(/:id)?', async (req, res, next) => {
  let id = paramsHelpers.getParam(req.params,'id',''); 
  let item = {name:'', ordering: 0, status: 'novalue', group_id:'', group_name: ''};
  let errors = null; 
  let groupsItems = []; 
  await GroupsModel.find({},{_id: 1,name: 1}).then((items)=>{
    groupsItems = items; 
    groupsItems.unshift({_id: 'novalue', name: 'Choose Group'})
  });
  
  if(id === ''){//Add
    res.render(`${folderView}form`, {pageTitle: pageTitleAdd,item,errors,groupsItems});
  } else { //Edit
    UsersModel.findById(id, (err, item) => {
      item.group_id = item.group.id; 
      item.group_name = item.group_name; 
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit,item,errors,groupsItems });
    });  
  }
  ;
}); 
//ADD  SUBMIT EDIT
router.post('/save', ValidateUser.validator, async (req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body));
  let item = Object.assign(req.body)
  let errors = validationResult(req);
  errors = errors.errors;
if(item.id !=='' && typeof item !== 'undefined'){ //edit
    if (errors.length>0 ) {
      let groupsItems= [];
      await GroupsModel.find({},{_id: 1,name: 1}).then((items)=>{
        groupsItems = items; 
        groupsItems.unshift({_id: 'novalue', name: 'Choose Group'})
      });
      res.render(`${folderView}form`,{ pageTitle: pageTitleEdit,item,errors,groupsItems});
    } else { 
      UsersModel.updateOne({ _id:item.id },{ 
        ordering: parseInt(item.ordering),
        name:item.name,
        status:item.status,
        content: item.content,
        group: {
          id: item.group_id,
          name: item.group_name
        },
        modified: {
          user_id: 0,
          user_name: '', 
          time: Date.now()
        }
      }, (err,result)=>{ 
          req.flash('success', 'Update item successfully',false);
          res.redirect(linkIndex)
        });
    }
} else {
  if (errors.length>0 ) { //add - errors
    let groupsItems= [];
      await GroupsModel.find({},{_id: 1,name: 1}).then((items)=>{
        groupsItems = items; 
        groupsItems.unshift({_id: 'novalue', name: 'Choose Group'})
      });
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd,item,errors,groupsItems });
  } else { //add  - no errors
    item.created = {
      user_id : 0,
      user_name: 'admin',
      time: Date.now()
    }
    item.group = {
      id: item.group_id,
      name: item.group_name
    }
    new UsersModel(item).save().then(()=>{
      req.flash('success', 'Add item successfully',false);
      res.redirect(linkIndex)
     })
  }
}
  });
//SORT
  router.get('/sort/:sort_field/:sort_type', (req, res, next) => {
     req.session.sort_field = paramsHelpers.getParam(req.params,'sort_field','ordering'); 
     req.session.sort_type = sort_type = paramsHelpers.getParam(req.params,'sort_type','asc'); 
    res.redirect(linkIndex)

  }); 
//filter
router.get('/filter-group/:group_id', (req, res, next) => {
  req.session.group_id = paramsHelpers.getParam(req.params,'group_id',''); 
 res.redirect(linkIndex)

}); 
module.exports = router;
