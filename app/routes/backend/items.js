//define paths
let express = require('express');
let router = express.Router();
const ItemsModel    = require(__path_schemas    + 'items');
const ValidateItem  = require(__path_validates  + 'items');
const utilsHelpers  = require(__path_helpers    + 'utils')
const paramsHelpers = require(__path_helpers    + 'params');
const systemConfig  = require(__path_configs    + 'system');

const { check, validationResult } = require('express-validator');
const linkIndex = '/'+systemConfig.preFixAdmin+ '/items/'; 
const pageTitleIndex = 'Item Management - List';
const pageTitleAdd = 'Item Management - Add';
const pageTitleEdit = 'Item Management - Edit';
const folderView  = __path_views + 'pages/items/';
/* GET users listing. */
router.get('(/status/:status)?', (req, res, next) =>{
  let objWhere = {};
  let keyword = paramsHelpers.getParam(req.query,'keyword',''); 
  let currentStatus  = paramsHelpers.getParam(req.params,'status','all');
  let statusFilter =  utilsHelpers.createFilterStatus(currentStatus,'items');
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

   ItemsModel.countDocuments(objWhere).then( (data)=>{
    pagination.totalItems = data;  
    });

   ItemsModel
    .find(objWhere)
    .select('name status ordering created modified')
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
      user_name: 'admin', 
      time: Date.now()
    }
  }
await ItemsModel.updateOne({ _id:id }, data, (err,result)=>{
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
await ItemsModel.updateMany({ _id: {$in:req.body.cid}}, data, (err,result)=>{
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
       ItemsModel.updateOne({ _id:item }, data, (err,result)=>{});
    })
  } else {
     ItemsModel.updateOne({ _id:cids }, { ordering: parseInt(orderings)}, (err,result)=>{});
  }
  res.redirect(linkIndex)
  });

//delete 
router.get('/delete/:id', async (req, res, next) => {
  let id             = paramsHelpers.getParam(req.params,'id','');
await ItemsModel.deleteOne({ _id:id }, (err,result)=>{
  req.flash('success', 'Delete item successfully',false);
  res.redirect(linkIndex)
});
}); 
//delete multi
router.post('/delete', async (req, res, next) => {
await ItemsModel.remove({ _id: {$in:req.body.cid}}, (err,result)=>{
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
    ItemsModel.findById(id, (err, item) => {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit,item,errors });
    });  
  }
  ;
}); 
//ADDs
router.post('/save', ValidateItem.validator,
                    async (req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body));
  let item = Object.assign(req.body)
  let errors = validationResult(req);
  errors = errors.errors;
if(item.id!=='' && typeof item !== 'undefined'){
    if (errors.length>0 ) {
      res.render(`${folderView}form`, { pageTitle: pageTitleEdit,item,errors });
    } else { 
      ItemsModel.updateOne({ _id:item.id },{ 
        ordering: parseInt(item.ordering),
        name:item.name,
        status:item.status,
        content: item.content,
        modified: {
          user_id: 0,
          user_name: 'admin', 
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
    new ItemsModel(item).save().then(()=>{
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
module.exports = router;
