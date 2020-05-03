const pathConfig = require('./path');
//define paths
global.__base         = __dirname + '/';
global.__path_app = __base + pathConfig.folder_app + '/';
global.__path_configs = __path_app + pathConfig.folder_configs + '/';
global.__path_helpers = __path_app + pathConfig.folder_helpers + '/';
global.__path_routes = __path_app + pathConfig.folder_routes + '/';
global.__path_schemas = __path_app + pathConfig.folder_schemas + '/';
global.__path_validates = __path_app + pathConfig.folder_validates + '/';
global.__path_views = __path_app + pathConfig.folder_views + '/';

var createError     = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var expressLayouts = require('express-ejs-layouts');
var moment = require('moment');
const flash = require('express-flash-notification');
const session = require('express-session');
const { body } = require('express-validator');
const { check, validationResult } = require('express-validator');

const databaseConfig = require(__path_configs + 'database');
const systemConfig = require(__path_configs +  'system');
let mongoose = require('mongoose');
mongoose.connect(`mmongodb+srv://${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.database}-4cyhs.mongodb.net/items?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});


let app = express();
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(flash(app,{
  viewName: __path_views + 'elements/flash'
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('layout', __path_views+'backend');
//local varisable
app.locals.systemConfig = systemConfig.preFixAdmin;
app.locals.moment = moment;
//set up router    
app.use(`/${systemConfig.preFixAdmin}`, require(__path_routes+ 'backend/index'));
app.use('/',require(__path_routes+ 'frontend/index'))
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render(__path_views + 'pages/error', { pageTitle: 'Page Not Found' });
});

module.exports = app;
