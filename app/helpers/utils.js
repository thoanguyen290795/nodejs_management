
let createFilterStatus =  (currentStatus,collection) => {
  const currentModel = require(__path_schemas + collection);
    let statusFilter = [
        {name:'All', value: 'all', count:4, class:'default'},
        {name:'Active', value: 'active', count:4, class:'default'},
        {name:'InActive', value: 'inactive',count:4, class:'default'}
      ];      
      statusFilter.forEach((item,index)=>{
        let condition = {};
        if(item.value !== 'all') condition = {status:item.value}; 
        if(item.value === currentStatus) statusFilter[index].class = 'success';
        currentModel.count(condition).then((data)=>{
          statusFilter[index].count = data
        });
    })
    return statusFilter
}
module.exports = {
    createFilterStatus
}