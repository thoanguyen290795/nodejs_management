
const databaseConfig = require(__path_configs + 'database');
let mongoose = require('mongoose');

let schema = new mongoose.Schema({ 
    name: String, 
    status: String,
    ordering: Number,
    content: String,
    created: {
        user_id: Number,
        user_name: String, 
        time: Date
    }, 
    modified: {
        user_id: Number, 
        user_name: String, 
        time: Date
    }
});

module.exports = mongoose.model(databaseConfig.col_users,schema)
