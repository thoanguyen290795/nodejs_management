//define paths
let express = require('express');
let router = express.Router();
const GroupsModel    = require(__path_schemas    + 'groups');
const ValidateGroups  = require(__path_validates  + 'groups');
const utilsHelpers  = require(__path_helpers    + 'utils')
const paramsHelpers = require(__path_helpers    + 'params');
const systemConfig  = require(__path_configs    + 'system');

const { check, validationResult } = require('express-validator');
const linkIndex = '/'+systemConfig.preFixAdmin+ '/groups/'; 
const pageTitleIndex = 'Item Management - List';
const pageTitleAdd = 'Item Management - Add';
const pageTitleEdit = 'Item Management - Edit';
const folderView  = __path_views + 'pages/groups/';
/* GET users listing. */
router.get('(/status/:status)?', (req, res, next) =>{
  let objWhere = {};
  let keyword = paramsHelpers.getParam(req.query,'keyword',''); 
  let currentStatus  = paramsHelpers.getParam(req.params,'status','all');
  let statusFilter =  utilsHelpers.createFilterStatus(currentStatus,'groups');
  let sortField = paramsHelpers.getParam(req.session,'sort_field','name'); 
  let sortType =  paramsHelpers.getParam(req.session,'sort_type','asc'); 
  let sort = {}; 
  sort[sortField] = sortType; 
  let pagination = {
    totalItems:1,
    totalItemsPerPage: 5, 
    currentPage: parseInt(paramsHelpers.getParam(req.query, 'page', 1)),
    pageRanges:3
  }

  if(currentStatus !== 'all') objWhere.status = currentStatus; 
  if(keyword !== '') objWhere.name = new RegExp(keyword, 'i'); 

  GroupsModel.countDocuments(objWhere).then( (data)=>{
    pagination.totalItems = data;  
    });

    GroupsModel
    .find(objWhere)
    .select('name status ordering created modified group_acp')
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
                                      sortType
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
await GroupsModel.updateOne({ _id:id }, data, (err,result)=>{
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
await GroupsModel.updateMany({ _id: {$in:req.body.cid}}, data, (err,result)=>{
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
      GroupsModel.updateOne({ _id:item }, data, (err,result)=>{});
    })
  } else {
    GroupsModel.updateOne({ _id:cids }, { ordering: parseInt(orderings)}, (err,result)=>{});
  }
  res.redirect(linkIndex)
  });

//delete 
router.get('/delete/:id', async (req, res, next) => {
  let id             = paramsHelpers.getParam(req.params,'id','');
await GroupsModel.deleteOne({ _id:id }, (err,result)=>{
  req.flash('success', 'Delete item successfully',false);
  res.redirect(linkIndex)
});
}); 
//delete multi
router.post('/delete', async (req, res, next) => {
await GroupsModel.remove({ _id: {$in:req.body.cid}}, (err,result)=>{
  req.flash('success', 'Delete multi - status successfully',false);
  res.redirect(linkIndex)
}); 
});
   //FORM
router.get('/form(/:id)?', function(req, res, next) {
  let id = paramsHelpers.getParam(req.params,'id',''); 
  let item = {name:'', ordering: 0, status: 'novalue'};
  let errors = null; 
  if(id === ''){//Add
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd,item,errors });
  } else { //Edit
    GroupsModel.findById(id, (err, item) => {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit,item,errors });
    });  
  }
  ;
}); 
//ADDs
router.post('/save', ValidateGroups.validator,
                    async (req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body));
  let item = Object.assign(req.body)
  let errors = validationResult(req);
  errors = errors.errors;
if(item.id!=='' && typeof item !== 'undefined'){
    if (errors.length>0 ) {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit,item,errors });
    } else { 
      GroupsModel.updateOne({ _id:item.id },{ 
        ordering: parseInt(item.ordering),
        name:item.name,
        status:item.status,
        content: item.content,
        group_acp: item.group_acp,
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
  if (errors.length>0 ) {
    res.render(`${folderView}form`, { pageTitle: pageTitleAdd,item,errors });
  } else { //add 
    item.created = {
      user_id : 0,
      user_name: 'admin',
      time: Date.now()
    }
    new GroupsModel(item).save().then(()=>{
      req.flash('success', 'Add item successfully',false);
      res.redirect(linkIndex)
     })
  }
}
  });

  router.get('/sort/:sort_field/:sort_type', function(req, res, next) {
     req.session.sort_field = paramsHelpers.getParam(req.params,'sort_field','ordering'); 
     req.session.sort_type = sort_type = paramsHelpers.getParam(req.params,'sort_type','asc'); 
    res.redirect(linkIndex)

  }); 

  //CHANGE GROUP ACP 
router.get('/change-group-acp/:id/:group_acp', async (req, res, next) => {
  let currentGroupACP = paramsHelpers.getParam(req.params,'group_acp','yes');
  let id             = paramsHelpers.getParam(req.params,'id','');
  //active < => inactive 
  let groupACP = (currentGroupACP == "yes")? "no" : "yes";
  let data = {
    group_acp: groupACP,
    modified: {
      user_id: 0,
      user_name: 'admin', 
      time: Date.now()
    }
  }
await GroupsModel.updateOne({ _id:id }, data, (err,result)=>{
  req.flash('success', 'Updated Group ACP successfully',false);
  res.redirect(linkIndex)
});
}); 
module.exports = router;
