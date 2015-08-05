var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');

var routes  	= require('./routes/index');
var settings 	= require('./settings');
// var users   	= require('./routes/users');
var session 	= require('express-session');
var MongoStore	= require('connect-mongo')(session);
var flash 		= require('connect-flash');
var multer  	= require('multer');//文件上传中间件

var app = express();



app.use(flash());
app.use(session({
	secret: settings.cookieSecret,
	key: settings.db,
	cookie: {maxAge: 1000*60*60*30},
	store: new MongoStore({
		db: settings.db,
		host: settings.host,
		port: settings.port
	})
}));

app.use(function(req,res){
	res.render('404');
});


// view engine setup
app.set('port',process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({
	dest: './public/images',
}).single('avatar'));

app.listen(app.get('port'),function(){
	console.log('express 服务器监听3000端口');
});
// app.use('/', routes);
// app.use('/users', users);
routes(app);
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });


module.exports = app;
